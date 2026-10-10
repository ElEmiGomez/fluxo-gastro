import { DailyMenu } from '@/types/database.types'

/**
 * Evalúa si un Menú del Día está actualmente activo y dentro de su franja horaria programada.
 */
export function isDailyMenuActive(menu?: DailyMenu | null): boolean {
  if (!menu || !menu.is_active) return false
  if (!menu.schedule_enabled) return true

  const now = new Date()
  const dayOfWeek = now.getDay().toString() // '0'=Domingo, '1'=Lunes .. '6'=Sábado

  if (menu.schedule_days && menu.schedule_days.length > 0) {
    if (!menu.schedule_days.includes(dayOfWeek)) {
      return false
    }
  }

  if (menu.schedule_start_time && menu.schedule_end_time) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const [startH, startM] = menu.schedule_start_time.split(':').map(Number)
    const [endH, endM] = menu.schedule_end_time.split(':').map(Number)
    const startMinutes = (startH || 0) * 60 + (startM || 0)
    const endMinutes = (endH || 0) * 60 + (endM || 0)

    if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
      return false
    }
  }

  return true
}
