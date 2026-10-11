import { NextRequest, NextResponse } from 'next/server'
import { getDailyMenu, updateDailyMenu, isDailyMenuActive } from '@/lib/supabase/repositories/daily-menu.repository'
import { getRestaurantBySlug, getTargetRestaurantId } from '@/lib/supabase/repositories/restaurants.repository'
import { verifyStaffRequest } from '@/lib/auth/pin-security'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'burger-gourmet'

    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = getTargetRestaurantId(restaurant?.id, slug)

    const dailyMenu = await getDailyMenu(restaurantId, slug)
    const active = isDailyMenuActive(dailyMenu)

    return NextResponse.json({
      success: true,
      dailyMenu,
      isActive: active,
    })
  } catch (error: any) {
    console.error('[GET /api/daily-menu] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener Menú del Día' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug = 'burger-gourmet', updates = {} } = body

    // Verificación de autenticación de personal
    const isAuthorized = verifyStaffRequest(req, slug, ['admin', 'comandero'])
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'No autorizado para configurar el Menú del Día' },
        { status: 401 }
      )
    }

    const restaurant = await getRestaurantBySlug(slug)
    const restaurantId = getTargetRestaurantId(restaurant?.id, slug)

    const updatedMenu = await updateDailyMenu(restaurantId, slug, updates)
    const active = isDailyMenuActive(updatedMenu)

    return NextResponse.json({
      success: true,
      dailyMenu: updatedMenu,
      isActive: active,
    })
  } catch (error: any) {
    console.error('[POST /api/daily-menu] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar Menú del Día' },
      { status: 500 }
    )
  }
}
