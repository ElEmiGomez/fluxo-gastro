import { createServerClient } from '../server'
import { isSupabaseConfigured } from '../client'
import { DailyMenu, DailyMenuSection, DailyMenuItem, Product } from '@/types/database.types'
import { MOCK_DAILY_MENUS, MOCK_PRODUCTS } from '../mock-fallback'
import { broadcastEvent } from '@/lib/server-state'
import { getTargetRestaurantId } from './restaurants.repository'

// Almacén en memoria global para resiliencia y modo offline
const globalStore = globalThis as unknown as {
  __GASTRO_DAILY_MENUS__?: Record<string, DailyMenu>
}
if (!globalStore.__GASTRO_DAILY_MENUS__) {
  globalStore.__GASTRO_DAILY_MENUS__ = {}
}

export { isDailyMenuActive } from '@/lib/daily-menu-utils'

/**
 * Obtiene el menú del día de un restaurante con sus secciones y platos.
 */
export async function getDailyMenu(
  restaurantId: string,
  slug: string
): Promise<DailyMenu | null> {
  const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)
  const supabase = createServerClient()

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: menuData, error: menuErr } = await supabase
        .from('daily_menus')
        .select('*')
        .eq('restaurant_id', targetRestaurantId)
        .maybeSingle()

      if (!menuErr && menuData) {
        // Obtener secciones
        const { data: sectionsData } = await supabase
          .from('daily_menu_sections')
          .select('*')
          .eq('daily_menu_id', menuData.id)
          .order('sort_order', { ascending: true })

        const sections: DailyMenuSection[] = []

        if (sectionsData && sectionsData.length > 0) {
          for (const sec of sectionsData) {
            const { data: itemsData } = await supabase
              .from('daily_menu_items')
              .select('*, product:products(*)')
              .eq('section_id', sec.id)

            sections.push({
              ...sec,
              items: (itemsData || []) as DailyMenuItem[],
            })
          }
        }

        const fullMenu: DailyMenu = {
          ...menuData,
          sections,
        }

        globalStore.__GASTRO_DAILY_MENUS__![slug] = fullMenu
        return fullMenu
      }
    } catch (e) {
      console.warn('[getDailyMenu] Error consultando Supabase, utilizando fallback:', e)
    }
  }

  // Fallback a memoria o mock predefinido
  if (globalStore.__GASTRO_DAILY_MENUS__?.[slug]) {
    return globalStore.__GASTRO_DAILY_MENUS__[slug]
  }

  const defaultMock = MOCK_DAILY_MENUS[slug] || MOCK_DAILY_MENUS['burger-gourmet']
  if (defaultMock) {
    globalStore.__GASTRO_DAILY_MENUS__![slug] = { ...defaultMock }
    return globalStore.__GASTRO_DAILY_MENUS__![slug]
  }

  return null
}

/**
 * Actualiza la configuración, estado o platos del Menú del Día.
 */
export async function updateDailyMenu(
  restaurantId: string,
  slug: string,
  updates: Partial<DailyMenu>
): Promise<DailyMenu> {
  const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)
  const currentMenu = await getDailyMenu(restaurantId, slug)
  const supabase = createServerClient()

  const updatedMenu: DailyMenu = {
    ...(currentMenu || (MOCK_DAILY_MENUS[slug] || MOCK_DAILY_MENUS['burger-gourmet'])),
    ...updates,
    updated_at: new Date().toISOString(),
  }

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: savedMenu, error: saveErr } = await supabase
        .from('daily_menus')
        .upsert({
          id: updatedMenu.id,
          restaurant_id: targetRestaurantId,
          title: updatedMenu.title,
          fixed_price: updatedMenu.fixed_price,
          is_active: updatedMenu.is_active,
          schedule_enabled: updatedMenu.schedule_enabled ?? false,
          schedule_days: updatedMenu.schedule_days ?? ['1', '2', '3', '4', '5'],
          schedule_start_time: updatedMenu.schedule_start_time ?? '13:00',
          schedule_end_time: updatedMenu.schedule_end_time ?? '16:30',
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single()

      if (saveErr) {
        console.warn('[updateDailyMenu] Error upserting in Supabase, continuing with fallback:', saveErr.message)
      }
    } catch (e) {
      console.warn('[updateDailyMenu] Exception updating Supabase:', e)
    }
  }

  // Guardar en memoria global y emitir evento reactivo
  globalStore.__GASTRO_DAILY_MENUS__![slug] = updatedMenu
  broadcastEvent({
    type: 'daily_menu_updated',
    slug,
    dailyMenu: updatedMenu,
  })

  return updatedMenu
}
