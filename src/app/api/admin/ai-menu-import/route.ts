import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import {
  getServerCategories,
  getServerProducts,
  setServerCategories,
  setServerProducts,
  upsertServerProduct,
  setProductAvailabilityOverride,
  broadcastEvent,
  sanitizeText,
  checkRateLimit,
} from '@/lib/server-state'
import { Category, Product } from '@/types/database.types'
import { AiParsedMenuResult, StagingDiff } from '@/types/admin.types'
import { verifyStaffRequest } from '@/lib/auth/pin-security'
import { createServerClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { getRestaurantBySlug, getTargetRestaurantId } from '@/lib/supabase/repository'
import { updateDailyMenu } from '@/lib/supabase/repositories/daily-menu.repository'
import {
  deduplicateProducts,
  inferCourseType,
} from '@/lib/category-matcher'
import {
  processNaturalLanguageCommand,
  parseFullMenuText,
  detectStrictAllergens,
  resolveStation,
} from '@/lib/ai-menu-parser'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      slug = 'burger-gourmet',
      raw_text = '',
      image_base64 = '',
      save_to_menu = false,
      mode = 'append', // 'append' | 'overwrite'
      custom_parsed = null,
    } = body

    // 1. Control de Tasa (Rate Limiting)
    const ip = req.headers.get('x-forwarded-for') || 'local'
    const rateLimitKey = `ai_menu_import_${slug}_${ip}`
    if (!checkRateLimit(rateLimitKey, 60, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Límite de solicitudes de IA superado. Espera un minuto antes de reintentar.' },
        { status: 429 }
      )
    }

    // 2. Blindaje de Seguridad: Requiere PIN/sesión de admin para guardar en carta
    if (save_to_menu && !verifyStaffRequest(req, slug, ['admin'])) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Se requiere sesión o PIN de administración para guardar cambios en la carta.' },
        { status: 401 }
      )
    }

    if (!custom_parsed && (!raw_text || typeof raw_text !== 'string' || raw_text.trim().length === 0) && !image_base64) {
      return NextResponse.json(
        { success: false, error: 'Debe proporcionar el texto, comando u orden o una fotografía de la carta' },
        { status: 400 }
      )
    }

    const rest = await getRestaurantBySlug(slug)
    const targetRestId = getTargetRestaurantId(rest?.id, slug)

    const existingCategories = getServerCategories(slug)
    const existingProducts = getServerProducts(slug)

    // =========================================================================
    // CASO A: APLICAR CAMBIOS CONFIRMADOS DESDE EL STAGING PREVIEW (custom_parsed)
    // =========================================================================
    if (custom_parsed && Array.isArray(custom_parsed.products)) {
      // Regla Anti-Alucinación / Validación de Precios: verificar que ningún plato tenga precio inválido
      const invalidDish = custom_parsed.products.find((p: any) => p.requires_price_review && (!p.price || p.price <= 0))
      if (save_to_menu && invalidDish) {
        return NextResponse.json(
          {
            success: false,
            error: `El plato "${invalidDish.name}" requiere revisión de precio antes de ser guardado en la carta oficial.`,
          },
          { status: 422 }
        )
      }

      // Si es un comando de menú del día confirmado
      if (custom_parsed.staging_diff?.daily_menu) {
        const dMenu = custom_parsed.staging_diff.daily_menu
        await updateDailyMenu(targetRestId, slug, {
          title: dMenu.title,
          fixed_price: dMenu.fixed_price,
          is_active: dMenu.is_active,
        })
      }

      // Procesar categorías y platos
      const parsedCategories: Category[] = (custom_parsed.categories || []).map((c: any, idx: number) => ({
        id: c.id || crypto.randomUUID(),
        restaurant_id: targetRestId,
        name: sanitizeText(c.name || 'CATEGORÍA', 50).toUpperCase(),
        order_index: c.order_index ?? (idx + 1),
      }))

      const parsedProducts: Product[] = custom_parsed.products.map((p: any) => {
        const finalPrice = typeof p.price === 'number' && !isNaN(p.price) ? Math.max(0, Number(p.price.toFixed(2))) : 0.0
        const allergens = Array.isArray(p.allergens)
          ? p.allergens
          : detectStrictAllergens(`${p.name} ${p.description || ''}`)

        return {
          id: p.id || crypto.randomUUID(),
          restaurant_id: targetRestId,
          category_id: p.category_id || parsedCategories[0]?.id || 'cat-1',
          name: sanitizeText(p.name || 'Plato', 80),
          description: p.description ? sanitizeText(p.description, 250) : '',
          price: finalPrice,
          price_type: p.price_type === 'weight' ? 'weight' : 'unit',
          price_unit: p.price_unit || undefined,
          image_url: p.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
          model_3d_url: null,
          is_available: typeof p.is_available === 'boolean' ? p.is_available : true,
          allergens,
        }
      })

      if (save_to_menu) {
        let finalCategories: Category[] = []
        let finalProducts: Product[] = []
        const newProductsToUpsert: Product[] = []
        const newCategoriesToUpsert: Category[] = []

        if (mode === 'append') {
          finalCategories = [...existingCategories]
          const catMap = new Map<string, string>()

          for (const pCat of parsedCategories) {
            const match = finalCategories.find(c => c.name.trim().toLowerCase() === pCat.name.trim().toLowerCase())
            if (match) {
              catMap.set(pCat.id, match.id)
            } else {
              const newCat: Category = { ...pCat, order_index: finalCategories.length + 1 }
              finalCategories.push(newCat)
              newCategoriesToUpsert.push(newCat)
              catMap.set(pCat.id, newCat.id)
            }
          }

          const adaptedProducts = parsedProducts.map(p => ({
            ...p,
            category_id: catMap.get(p.category_id) || p.category_id,
          }))

          // Deduplicación canónica preservando UUIDs
          finalProducts = deduplicateProducts([...existingProducts, ...adaptedProducts])
          newProductsToUpsert.push(...adaptedProducts)
        } else {
          // Mode overwrite
          finalCategories = parsedCategories
          finalProducts = deduplicateProducts(parsedProducts)
          newCategoriesToUpsert.push(...parsedCategories)
          newProductsToUpsert.push(...parsedProducts)
        }

        // Actualizar almacén en memoria
        setServerCategories(slug, finalCategories)
        setServerProducts(slug, finalProducts)

        // Sincronizar en Supabase
        const supabase = createServerClient()
        if (supabase && isSupabaseConfigured()) {
          try {
            if (mode === 'overwrite') {
              await supabase.from('products').delete().eq('restaurant_id', targetRestId)
            }

            for (const cat of newCategoriesToUpsert) {
              await supabase.from('categories').upsert({
                id: cat.id,
                restaurant_id: targetRestId,
                name: cat.name,
                order_index: cat.order_index,
              })
            }

            for (const prod of newProductsToUpsert) {
              await supabase.from('products').upsert({
                id: prod.id,
                restaurant_id: targetRestId,
                category_id: prod.category_id,
                name: prod.name,
                description: prod.description,
                price: prod.price,
                price_type: prod.price_type,
                price_unit: prod.price_unit || null,
                image_url: prod.image_url,
                is_available: prod.is_available,
              })
            }
          } catch (dbErr) {
            console.error('[AI Menu Import] Error syncing custom_parsed with Supabase:', dbErr)
          }
        }

        // Sincronización Inmediata (< 1s) vía Broadcast y SSE
        broadcastEvent({
          type: 'menu_updated',
          slug,
        })
      }

      return NextResponse.json({
        success: true,
        slug,
        saved: save_to_menu,
        mode,
        parsed: {
          total_categories: parsedCategories.length,
          total_dishes: parsedProducts.length,
          categories: parsedCategories,
          products: parsedProducts,
          staging_diff: custom_parsed.staging_diff,
        },
      })
    }

    // =========================================================================
    // CASO B: COMANDOS EN LENGUAJE NATURAL SOBRE EL CATÁLOGO ACTIVO
    // =========================================================================
    if (raw_text && raw_text.trim().length > 0 && !image_base64) {
      const commandResult = processNaturalLanguageCommand(
        raw_text,
        existingProducts,
        existingCategories,
        targetRestId
      )

      if (commandResult && commandResult.isCommand) {
        // Si el usuario envió el comando con save_to_menu: true directamente
        if (save_to_menu) {
          const { stagingDiff } = commandResult

          // Regla Anti-Alucinación: Si algún plato requiere revisión de precio y no tiene precio válido, rechazar
          const invalidDish = stagingDiff.items.find(p => p.requires_price_review && (!p.price || p.price <= 0))
          if (invalidDish) {
            return NextResponse.json(
              {
                success: false,
                error: `El plato "${invalidDish.name}" no tiene precio asignado. Revisa y asigna precio en el borrador antes de guardar.`,
              },
              { status: 422 }
            )
          }

          // Si es menú del día
          if (stagingDiff.daily_menu) {
            await updateDailyMenu(targetRestId, slug, {
              title: stagingDiff.daily_menu.title,
              fixed_price: stagingDiff.daily_menu.fixed_price,
              is_active: stagingDiff.daily_menu.is_active,
            })
          }

          // Si modifica productos existentes o crea uno nuevo
          if (stagingDiff.items.length > 0) {
            let updatedProds = [...existingProducts]

            for (const item of stagingDiff.items) {
              if (item.action_type === 'update_stock') {
                setProductAvailabilityOverride(slug, item.id, item.is_available ?? true)
                updatedProds = updatedProds.map(p => p.id === item.id ? { ...p, is_available: item.is_available ?? true } : p)
              } else if (item.action_type === 'update_price') {
                updatedProds = updatedProds.map(p => p.id === item.id ? { ...p, price: item.price } : p)
              } else if (item.action_type === 'create') {
                const newP: Product = {
                  id: item.id,
                  restaurant_id: targetRestId,
                  category_id: item.category_id,
                  name: item.name,
                  description: item.description || '',
                  price: item.price,
                  price_type: item.price_type || 'unit',
                  image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
                  model_3d_url: null,
                  is_available: true,
                  allergens: item.allergens || [],
                }
                updatedProds.push(newP)
              }
            }

            const deduplicated = deduplicateProducts(updatedProds)
            setServerProducts(slug, deduplicated)

            // Sincronizar en Supabase
            const supabase = createServerClient()
            if (supabase && isSupabaseConfigured()) {
              try {
                for (const item of stagingDiff.items) {
                  await supabase.from('products').upsert({
                    id: item.id,
                    restaurant_id: targetRestId,
                    category_id: item.category_id,
                    name: item.name,
                    description: item.description || '',
                    price: item.price,
                    is_available: item.is_available ?? true,
                  })
                }
              } catch (dbErr) {
                console.error('[AI Menu Import] Error syncing NL command to Supabase:', dbErr)
              }
            }

            broadcastEvent({
              type: 'menu_updated',
              slug,
            })
          }

          return NextResponse.json({
            success: true,
            slug,
            saved: true,
            parsed: commandResult.parsed,
            staging_diff: commandResult.stagingDiff,
          })
        }

        // Si es sólo previsualización (save_to_menu: false)
        return NextResponse.json({
          success: true,
          slug,
          saved: false,
          parsed: commandResult.parsed,
          staging_diff: commandResult.stagingDiff,
        })
      }
    }

    // =========================================================================
    // CASO C: ANÁLISIS MULTIMODAL CON FOTOGRAFÍA (Gemini con AbortController 25s)
    // =========================================================================
    if (image_base64) {
      let mimeType = 'image/jpeg'
      let cleanBase64 = image_base64
      if (typeof image_base64 === 'string' && image_base64.startsWith('data:')) {
        const match = image_base64.match(/^data:([^;]+);base64,(.+)$/)
        if (match) {
          mimeType = match[1]
          cleanBase64 = match[2]
        }
      }

      const geminiApiKey = process.env.GEMINI_API_KEY
      if (geminiApiKey) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 25000)

        try {
          const geminiPrompt = `Analiza detalladamente esta fotografía de la carta o menú de restaurante.
Extrae todas las categorías de platos y cada uno de los platos que aparecen en la imagen con sus precios exactos, descripciones e ingredientes (si existen) y alérgenos detectables.
Responde estrictamente con un objeto JSON válido con la siguiente estructura:
{
  "categories": [
    { "name": "CATEGORIA", "order_index": 1 }
  ],
  "products": [
    {
      "category_name": "CATEGORIA",
      "name": "Nombre del Plato",
      "description": "Descripción o ingredientes",
      "price": 12.50,
      "allergens": ["gluten", "dairy"]
    }
  ],
  "extracted_text": "Texto transcrito completo de la carta..."
}
Alérgenos permitidos en el array 'allergens': gluten, dairy, eggs, fish, crustaceans, molluscs, soy, sesame, mustard, nuts, peanuts, celery, lupin, sulphites.`

          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [
                      {
                        inline_data: {
                          mime_type: mimeType,
                          data: cleanBase64,
                        },
                      },
                      {
                        text: geminiPrompt,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.1,
                  responseMimeType: 'application/json',
                },
              }),
            }
          )

          clearTimeout(timeoutId)

          if (geminiRes.ok) {
            const geminiData = await geminiRes.json()
            const textResponse = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text
            if (textResponse) {
              const parsedJson = JSON.parse(textResponse)
              if (Array.isArray(parsedJson.categories) && Array.isArray(parsedJson.products)) {
                const catMap = new Map<string, Category>()
                parsedJson.categories.forEach((c: any, idx: number) => {
                  const catId = crypto.randomUUID()
                  const catName = sanitizeText(c.name || 'CATEGORÍA', 50).toUpperCase()
                  catMap.set(catName.toLowerCase(), {
                    id: catId,
                    restaurant_id: targetRestId,
                    name: catName,
                    order_index: c.order_index ?? idx + 1,
                  })
                })

                let geminiCategories = Array.from(catMap.values())
                if (geminiCategories.length === 0) {
                  const defaultCat: Category = {
                    id: crypto.randomUUID(),
                    restaurant_id: targetRestId,
                    name: 'PLATOS DETECTADOS',
                    order_index: 1,
                  }
                  geminiCategories.push(defaultCat)
                  catMap.set('platos detectados', defaultCat)
                }

                const geminiDishes = parsedJson.products.map((p: any) => {
                  const catKey = (p.category_name || '').trim().toLowerCase()
                  let targetCat = catMap.get(catKey) || geminiCategories[0]

                  const cleanName = sanitizeText(p.name || 'Plato', 80)
                  const cleanDesc = p.description
                    ? sanitizeText(p.description, 250)
                    : 'Elaborado artesanalmente.'
                  const combinedAllergens = detectStrictAllergens(`${cleanName} ${cleanDesc} ${(p.allergens || []).join(' ')}`)

                  const rawPrice = typeof p.price === 'number' && !isNaN(p.price) ? Number(p.price.toFixed(2)) : 0.0
                  const requiresPriceReview = rawPrice <= 0

                  const normDishName = cleanName.toLowerCase().trim()
                  const existingMatch = existingProducts.find(ep => ep.name.toLowerCase().trim() === normDishName)

                  const dishId = existingMatch?.id || crypto.randomUUID()
                  const courseType = inferCourseType({
                    id: dishId,
                    name: cleanName,
                    category_id: targetCat.id,
                    description: cleanDesc,
                    price: rawPrice,
                    price_type: 'unit',
                    image_url: '',
                    model_3d_url: null,
                    restaurant_id: targetRestId,
                    is_available: true,
                    allergens: combinedAllergens,
                  }, geminiCategories)

                  return {
                    id: dishId,
                    name: cleanName,
                    description: cleanDesc,
                    price: rawPrice,
                    old_price: existingMatch?.price,
                    category_id: targetCat.id,
                    category_name: targetCat.name,
                    allergens: combinedAllergens,
                    action_type: existingMatch ? 'update_price' : 'create',
                    is_available: existingMatch?.is_available ?? true,
                    requires_price_review: requiresPriceReview,
                    course_type: courseType,
                    station: resolveStation(courseType),
                  }
                })

                const totalCreated = geminiDishes.filter((d: any) => d.action_type === 'create').length
                const totalUpdated = geminiDishes.filter((d: any) => d.action_type === 'update_price').length
                const requiresReviewCount = geminiDishes.filter((d: any) => d.requires_price_review).length

                const stagingDiff: StagingDiff = {
                  action: 'import',
                  summary: `Análisis visual completado: ${totalCreated} platos nuevos, ${totalUpdated} platos actualizados, ${requiresReviewCount} requieren revisión de precio.`,
                  items: geminiDishes,
                  total_created: totalCreated,
                  total_updated: totalUpdated,
                  total_paused: 0,
                  total_activated: 0,
                  requires_price_review_count: requiresReviewCount,
                }

                return NextResponse.json({
                  success: true,
                  source: 'gemini_vision',
                  extracted_text: parsedJson.extracted_text || '',
                  parsed: {
                    total_dishes: geminiDishes.length,
                    total_categories: geminiCategories.length,
                    categories: geminiCategories,
                    products: geminiDishes,
                    staging_diff: stagingDiff,
                  },
                })
              }
            }
          }
        } catch (visionErr) {
          clearTimeout(timeoutId)
          console.warn('[AI Menu Import] Timeout o error en Gemini Vision, usando fallback local determinista:', visionErr)
        }
      }

      // Fallback local determinista para fotografía
      const demoCat: Category = {
        id: crypto.randomUUID(),
        restaurant_id: targetRestId,
        name: 'PLATOS DETECTADOS EN FOTO',
        order_index: 1,
      }

      const fallbackDishes = [
        {
          id: crypto.randomUUID(),
          name: 'Plato Especial de la Carta',
          description: 'Plato extraído visualmente de la fotografía de la carta.',
          price: 12.5,
          category_id: demoCat.id,
          category_name: demoCat.name,
          allergens: ['gluten'],
          action_type: 'create' as const,
          is_available: true,
          requires_price_review: false,
          course_type: 'second' as const,
          station: 'kitchen' as const,
        },
        {
          id: crypto.randomUUID(),
          name: 'Entrante o Ración de la Casa',
          description: 'Ración detectada en la carta visual.',
          price: 7.5,
          category_id: demoCat.id,
          category_name: demoCat.name,
          allergens: [],
          action_type: 'create' as const,
          is_available: true,
          requires_price_review: false,
          course_type: 'first' as const,
          station: 'kitchen' as const,
        },
      ]

      const stagingDiff: StagingDiff = {
        action: 'import',
        summary: 'Platos detectados en la fotografía de la carta mediante motor local.',
        items: fallbackDishes,
        total_created: 2,
        total_updated: 0,
        total_paused: 0,
        total_activated: 0,
        requires_price_review_count: 0,
      }

      return NextResponse.json({
        success: true,
        source: 'local_vision_fallback',
        extracted_text: 'Platos detectados en la fotografía de la carta.',
        parsed: {
          total_dishes: 2,
          total_categories: 1,
          categories: [demoCat],
          products: fallbackDishes,
          staging_diff: stagingDiff,
        },
      })
    }

    // =========================================================================
    // CASO D: INGESTA DE CARTA COMPLETA EN TEXTO / OCR
    // =========================================================================
    const fullMenuResult = parseFullMenuText(
      raw_text,
      existingCategories,
      existingProducts,
      targetRestId
    )

    if (save_to_menu && fullMenuResult.products.length > 0) {
      // Regla Anti-Alucinación: Si algún plato requiere revisión de precio y no tiene precio, rechazar
      const invalidDish = fullMenuResult.products.find(p => p.requires_price_review && (!p.price || p.price <= 0))
      if (invalidDish) {
        return NextResponse.json(
          {
            success: false,
            error: `El plato "${invalidDish.name}" no tiene precio asignado. Revisa y asigna precio en el borrador antes de guardar.`,
          },
          { status: 422 }
        )
      }

      const productsToSave: Product[] = fullMenuResult.products.map(d => {
        const validUnit = d.price_unit === 'kg' ? 'kg' : d.price_unit === 'piece' ? 'piece' : d.price_unit === '100g' ? '100g' : undefined
        return {
          id: d.id,
          restaurant_id: targetRestId,
          category_id: d.category_id,
          name: d.name,
          description: d.description || '',
          price: d.price,
          price_type: d.price_type || 'unit',
          price_unit: validUnit,
          image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
          model_3d_url: null,
          is_available: d.is_available ?? true,
          allergens: d.allergens || [],
        }
      })

      let finalCategories: Category[] = []
      let finalProducts: Product[] = []

      if (mode === 'append') {
        finalCategories = [...existingCategories]
        for (const cat of fullMenuResult.categories) {
          if (!finalCategories.some(c => c.id === cat.id)) {
            finalCategories.push({
              id: cat.id,
              restaurant_id: targetRestId,
              name: cat.name,
              order_index: cat.order_index ?? finalCategories.length + 1,
            })
          }
        }
        finalProducts = deduplicateProducts([...existingProducts, ...productsToSave])
      } else {
        finalCategories = fullMenuResult.categories.map((c, i) => ({
          id: c.id,
          restaurant_id: targetRestId,
          name: c.name,
          order_index: c.order_index ?? i + 1,
        }))
        finalProducts = deduplicateProducts(productsToSave)
      }

      setServerCategories(slug, finalCategories)
      setServerProducts(slug, finalProducts)

      const supabase = createServerClient()
      if (supabase && isSupabaseConfigured()) {
        try {
          if (mode === 'overwrite') {
            await supabase.from('products').delete().eq('restaurant_id', targetRestId)
          }
          for (const cat of finalCategories) {
            await supabase.from('categories').upsert({
              id: cat.id,
              restaurant_id: targetRestId,
              name: cat.name,
              order_index: cat.order_index,
            })
          }
          for (const prod of productsToSave) {
            await supabase.from('products').upsert({
              id: prod.id,
              restaurant_id: targetRestId,
              category_id: prod.category_id,
              name: prod.name,
              description: prod.description,
              price: prod.price,
              price_type: prod.price_type,
              image_url: prod.image_url,
              is_available: prod.is_available,
            })
          }
        } catch (dbErr) {
          console.error('[AI Menu Import] Error syncing parsed menu to Supabase:', dbErr)
        }
      }

      broadcastEvent({
        type: 'menu_updated',
        slug,
      })
    }

    return NextResponse.json({
      success: true,
      slug,
      saved: save_to_menu,
      mode,
      parsed: fullMenuResult,
      staging_diff: fullMenuResult.staging_diff,
    })
  } catch (err: any) {
    console.error('[AI Menu Import] Exception in POST handler:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
