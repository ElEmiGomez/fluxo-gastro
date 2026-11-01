import { NextRequest, NextResponse } from 'next/server'
import {
  ParsedMenuResponse,
  validateParsedMenuResponse,
  EU_ALLERGENS,
  VALID_EU_ALLERGEN_KEYS,
  sanitizeSlug,
} from '@/lib/menu-vision-schema'

export const dynamic = 'force-dynamic'

/**
 * Generador de respuesta fallback realista para visitas comerciales de calle.
 * Garantiza que la demo NUNCA arroje error 500 si no hay WiFi o falta API Key.
 */
function generateCommercialStreetFallback(customName?: string): ParsedMenuResponse {
  const name = customName?.trim() || 'Taberna O Marinheiro'
  const slug = sanitizeSlug(name)

  return {
    restaurant_name: name,
    suggested_slug: slug,
    slogan: 'Cocina Gallega Tradicional & Producto de Ría',
    categories: [
      {
        id: 'cat_entrantes',
        name: 'Entrantes & Raciones',
        role: 'starter',
        station: 'kitchen',
        items: [
          {
            id: 'item_1_1',
            name: 'Pimientos de Padrón fritos',
            description: 'Con escamas de sal marina (unos pican y otros no).',
            price: 7.5,
            is_market_price: false,
            allergens: [],
            dietary_tags: ['vegan', 'gluten_free'],
            station: 'kitchen',
            category_name: 'Entrantes & Raciones',
          },
          {
            id: 'item_1_2',
            name: 'Croquetas caseras de Jamón Ibérico',
            description: 'Bechamel cremosa con rebozado crujiente (6 uds).',
            price: 9.0,
            is_market_price: false,
            allergens: ['gluten', 'milk', 'eggs'],
            dietary_tags: [],
            station: 'kitchen',
            category_name: 'Entrantes & Raciones',
          },
          {
            id: 'item_1_3',
            name: 'Empanada artesanal de Xoubas',
            description: 'Masa de maíz tradicional recién horneada.',
            price: 8.5,
            is_market_price: false,
            allergens: ['gluten', 'fish'],
            dietary_tags: [],
            station: 'kitchen',
            category_name: 'Entrantes & Raciones',
          },
        ],
      },
      {
        id: 'cat_mariscos',
        name: 'Mariscos de la Ría & Lonja',
        role: 'starter',
        station: 'kitchen',
        items: [
          {
            id: 'item_2_1',
            name: 'Pulpo á Feira con Cachelos',
            description: 'Cocido al punto con pimentón de la Vera y aceite de oliva virgen extra.',
            price: 17.5,
            is_market_price: false,
            allergens: ['molluscs'],
            dietary_tags: ['gluten_free'],
            station: 'kitchen',
            category_name: 'Mariscos de la Ría & Lonja',
          },
          {
            id: 'item_2_2',
            name: 'Zamburiñas a la Plancha',
            description: 'Con majado fino de ajo, perejil y gotas de Albariño.',
            price: 15.0,
            is_market_price: false,
            allergens: ['molluscs', 'sulphites'],
            dietary_tags: ['gluten_free'],
            station: 'kitchen',
            category_name: 'Mariscos de la Ría & Lonja',
          },
          {
            id: 'item_2_3',
            name: 'Navajas de la Ría a la Plancha',
            description: 'Selección fresca del día con limón.',
            price: null,
            is_market_price: true, // Según Lonja
            allergens: ['molluscs'],
            dietary_tags: ['gluten_free'],
            station: 'kitchen',
            category_name: 'Mariscos de la Ría & Lonja',
          },
          {
            id: 'item_2_4',
            name: 'Centollo de la Ría Cocido',
            description: 'Pieza seleccionada en la lonja de Noia/Ribeira.',
            price: null,
            is_market_price: true, // Según Lonja
            allergens: ['crustaceans'],
            dietary_tags: ['gluten_free'],
            station: 'kitchen',
            category_name: 'Mariscos de la Ría & Lonja',
          },
        ],
      },
      {
        id: 'cat_principales',
        name: 'Platos Principales & Carnes',
        role: 'main',
        station: 'kitchen',
        items: [
          {
            id: 'item_3_1',
            name: 'Raxo gallego al ajo con patatas',
            description: 'Lomo adobado en dados dorados con patata gallega frita.',
            price: 13.5,
            is_market_price: false,
            allergens: [],
            dietary_tags: ['gluten_free'],
            station: 'kitchen',
            category_name: 'Platos Principales & Carnes',
          },
          {
            id: 'item_3_2',
            name: 'Churrasco de ternera gallega',
            description: 'A la brasa con chimichurri casero y ensalada de huerta.',
            price: 16.0,
            is_market_price: false,
            allergens: [],
            dietary_tags: ['gluten_free'],
            station: 'kitchen',
            category_name: 'Platos Principales & Carnes',
          },
          {
            id: 'item_3_3',
            name: 'Merluza del pincho a la gallega',
            description: 'Con ajada tradicional, patatas cocidas y guisantes.',
            price: 18.5,
            is_market_price: false,
            allergens: ['fish'],
            dietary_tags: ['gluten_free'],
            station: 'kitchen',
            category_name: 'Platos Principales & Carnes',
          },
        ],
      },
      {
        id: 'cat_bebidas',
        name: 'Vinos & Bebidas',
        role: 'drink',
        station: 'bar',
        items: [
          {
            id: 'item_4_1',
            name: 'Albariño D.O. Rías Baixas (Botella)',
            description: 'Vino blanco joven, fresco y floral.',
            price: 16.0,
            is_market_price: false,
            allergens: ['sulphites'],
            dietary_tags: ['vegan'],
            station: 'bar',
            category_name: 'Vinos & Bebidas',
          },
          {
            id: 'item_4_2',
            name: 'Cerveza Estrella Galicia Especial (Tercio)',
            description: 'Cerveza lager tradicional gallega.',
            price: 2.8,
            is_market_price: false,
            allergens: ['gluten'],
            dietary_tags: ['vegan'],
            station: 'bar',
            category_name: 'Vinos & Bebidas',
          },
          {
            id: 'item_4_3',
            name: 'Agua mineral de manantial (500ml)',
            description: 'Con o sin gas.',
            price: 2.0,
            is_market_price: false,
            allergens: [],
            dietary_tags: ['vegan', 'gluten_free'],
            station: 'bar',
            category_name: 'Vinos & Bebidas',
          },
        ],
      },
      {
        id: 'cat_postres',
        name: 'Sobremesa & Postres Caseros',
        role: 'dessert',
        station: 'kitchen',
        items: [
          {
            id: 'item_5_1',
            name: 'Tarta de Santiago tradicional',
            description: 'Elaborada con 100% almendra molida y cruz de azúcar glass.',
            price: 5.5,
            is_market_price: false,
            allergens: ['nuts', 'eggs'],
            dietary_tags: ['vegetarian'],
            station: 'kitchen',
            category_name: 'Sobremesa & Postres Caseros',
          },
          {
            id: 'item_5_2',
            name: 'Cañitas rellenas de crema pastelera',
            description: 'Hojaldre frito artesanal espolvoreado con canela (3 uds).',
            price: 5.0,
            is_market_price: false,
            allergens: ['gluten', 'milk', 'eggs'],
            dietary_tags: ['vegetarian'],
            station: 'kitchen',
            category_name: 'Sobremesa & Postres Caseros',
          },
        ],
      },
    ],
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { imageBase64, mimeType = 'image/jpeg', menuUrl, customRestaurantName } = body

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY

    // CASO 1: Si se proporcionó una URL externa (web del restaurante, PDF público o carta digital)
    if (menuUrl && typeof menuUrl === 'string' && menuUrl.trim().startsWith('http')) {
      try {
        const targetUrl = menuUrl.trim()
        const urlFetchRes = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(10000),
        })

        if (urlFetchRes.ok) {
          const contentType = urlFetchRes.headers.get('content-type') || ''
          
          // Si la URL devuelve un PDF o imagen binaria
          if (contentType.includes('application/pdf') || contentType.includes('image/')) {
            const arrayBuffer = await urlFetchRes.arrayBuffer()
            const base64FromUrl = Buffer.from(arrayBuffer).toString('base64')
            const effectiveMime = contentType.split(';')[0].trim() || 'application/pdf'
            
            // Re-enrutar al flujo multimodal con el Base64 obtenido
            return processMultimodalWithGemini(apiKey, base64FromUrl, effectiveMime, customRestaurantName)
          }

          // Si es HTML, extraer el texto visible depurado
          const rawHtml = await urlFetchRes.text()
          const textSnippet = rawHtml
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 15000)

          if (apiKey && textSnippet.length > 50) {
            const prompt = `Actúa como Principal AI Menu Digitizer & Food Safety Auditor de Fluxo.
A partir del siguiente contenido extraído de la web o carta digital del restaurante "${customRestaurantName || targetUrl}":
"""
${textSnippet}
"""
Extrae todos los platos, precios y categorías con máxima precisión.
Reglas:
1. Extrae nombres, descripciones y precios.
2. Si un plato tiene "S/M", "S/L" o "Según lonja/mercado", marca is_market_price: true y price: null.
3. Clasifica el role: "starter", "main", "drink", "dessert", "coffee" y station: "kitchen" o "bar".
4. Infiere los 14 alérgenos UE usando exclusivamente:
   ["gluten", "crustaceans", "eggs", "fish", "peanuts", "soy", "milk", "nuts", "celery", "mustard", "sesame", "sulphites", "lupin", "molluscs"].

Responde ÚNICAMENTE en JSON válido con el esquema:
{
  "restaurant_name": "${customRestaurantName || 'Restaurante'}",
  "suggested_slug": "slug-limpio",
  "slogan": "Eslogan o subtítulo",
  "categories": [
    {
      "id": "cat_1",
      "name": "Categoría",
      "role": "starter",
      "station": "kitchen",
      "items": [
        {
          "id": "item_1_1",
          "name": "Nombre plato",
          "description": "Detalle",
          "price": 12.50,
          "is_market_price": false,
          "allergens": ["gluten"],
          "dietary_tags": [],
          "station": "kitchen"
        }
      ]
    }
  ]
}`

            const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
            const geminiRes = await fetch(geminiEndpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
              }),
            })

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json()
              const rawJsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
              if (rawJsonText) {
                const parsed = JSON.parse(rawJsonText)
                const validated = validateParsedMenuResponse(parsed)
                return NextResponse.json({
                  success: true,
                  source: 'url_web_scraping_gemini',
                  data: validated,
                })
              }
            }
          }
        }
      } catch (urlErr) {
        console.warn('[OnboardingAI] Error fetching menu URL, falling back to street demo:', urlErr)
      }

      // Si la URL falló por CORS, timeout o falta de API key, devolver fallback de contingencia
      const fallback = generateCommercialStreetFallback(customRestaurantName || 'Restaurante Enlace')
      return NextResponse.json({
        success: true,
        source: 'url_fallback_resilient',
        data: fallback,
      })
    }

    // CASO 2: Extracción por Foto Base64
    // Si no hay API Key o la imagen viene vacía, responder con fallback ultra-rápido para demo de calle
    if (!apiKey || !imageBase64) {
      const fallback = generateCommercialStreetFallback(customRestaurantName)
      return NextResponse.json({
        success: true,
        source: 'commercial_demo_engine',
        data: fallback,
      })
    }

    return processMultimodalWithGemini(apiKey, imageBase64, mimeType, customRestaurantName)
  } catch (err: any) {
    const fallback = generateCommercialStreetFallback()
    return NextResponse.json({
      success: true,
      source: 'emergency_fallback',
      data: fallback,
    })
  }
}

async function processMultimodalWithGemini(
  apiKey: string | undefined,
  imageBase64: string,
  mimeType: string,
  customRestaurantName?: string
) {
  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '').replace(/^data:application\/pdf;base64,/, '')

    const prompt = `Actúa como Principal AI Menu Digitizer & Food Safety Auditor de Fluxo.
Analiza la imagen o PDF de esta carta física de hostelería y extrae todos los platos, precios y categorías con máxima precisión.
Reglas obligatorias:
1. Extrae los nombres, descripciones y precios.
2. Si un plato tiene texto como "S/M", "S/L", "Según mercado" o "Según lonja", marca "is_market_price": true y "price": null.
3. Clasifica cada categoría en su "role": "starter", "main", "drink", "dessert" o "coffee".
4. Asigna "station": "kitchen" para platos y "bar" para bebidas o cafés.
5. Infiere los 14 alérgenos estrictos de la UE (Reglamento 1169/2011) usando exclusivamente estas claves en minúsculas:
   ["gluten", "crustaceans", "eggs", "fish", "peanuts", "soy", "milk", "nuts", "celery", "mustard", "sesame", "sulphites", "lupin", "molluscs"].
6. Nombre del restaurante: "${customRestaurantName || 'Detectar de la carta'}".

Responde ÚNICAMENTE en JSON válido con la siguiente estructura:
{
  "restaurant_name": "Nombre del local",
  "suggested_slug": "nombre-del-local",
  "slogan": "Eslogan o subtítulo",
  "categories": [
    {
      "id": "cat_1",
      "name": "Nombre categoría",
      "role": "starter",
      "station": "kitchen",
      "items": [
        {
          "id": "item_1_1",
          "name": "Nombre plato",
          "description": "Detalle ingredientes",
          "price": 14.50,
          "is_market_price": false,
          "allergens": ["gluten", "crustaceans"],
          "dietary_tags": ["gluten_free"],
          "station": "kitchen"
        }
      ]
    }
  ]
}`

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const geminiRes = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    })

    if (geminiRes.ok) {
      const geminiData = await geminiRes.json()
      const rawJsonText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
      if (rawJsonText) {
        const parsed = JSON.parse(rawJsonText)
        const validated = validateParsedMenuResponse(parsed)
        return NextResponse.json({
          success: true,
          source: 'gemini_multimodal_vision',
          data: validated,
        })
      }
    }
  } catch (apiErr) {
    console.warn('[OnboardingAI] Gemini call failed, resorting to street demo fallback:', apiErr)
  }

  const fallback = generateCommercialStreetFallback(customRestaurantName)
  return NextResponse.json({
    success: true,
    source: 'commercial_demo_contingency',
    data: fallback,
  })
}
