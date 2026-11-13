import type { OpeningSchedule } from '../types/gastronomic-web.types.ts'

export interface OpeningStatusResult {
  isOpen: boolean
  label: string
  subLabel: string
}

/**
 * Convierte una cadena "HH:MM" a minutos transcurridos desde las 00:00
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + (minutes || 0)
}

/**
 * Calcula si un local está abierto en un momento determinado teniendo en cuenta turnos de madrugada.
 * Maneja turnos que cruzan la medianoche (ej. de 20:00 a 02:30).
 */
export function getOpeningStatus(
  schedules: OpeningSchedule[],
  referenceDate: Date = new Date()
): OpeningStatusResult {
  if (!schedules || schedules.length === 0) {
    return {
      isOpen: false,
      label: 'Horario no disponible',
      subLabel: 'Consulta por WhatsApp',
    }
  }

  const currentDay = referenceDate.getDay() // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes()

  // 1. Comprobar si hay un turno activo hoy
  for (const item of schedules) {
    const openMin = timeToMinutes(item.open)
    const closeMin = timeToMinutes(item.close)

    // Caso A: Turno dentro del mismo día (ej. 12:30 a 16:30)
    if (item.dayOfWeek === currentDay && closeMin > openMin) {
      if (currentMinutes >= openMin && currentMinutes < closeMin) {
        return {
          isOpen: true,
          label: 'Abierto ahora',
          subLabel: `Cierra a las ${item.close}`,
        }
      }
    }

    // Caso B: Turno que cruza la medianoche (ej. Viernes 20:00 a 03:00)
    // Parte 1: Estamos en el día que comenzó el turno (después de openMin)
    if (item.dayOfWeek === currentDay && closeMin <= openMin) {
      if (currentMinutes >= openMin) {
        return {
          isOpen: true,
          label: 'Abierto ahora',
          subLabel: `Cierra a las ${item.close}`,
        }
      }
    }

    // Parte 2: Estamos en la madrugada del día siguiente (antes de closeMin)
    const previousDay = (currentDay + 6) % 7
    if (item.dayOfWeek === previousDay && closeMin <= openMin) {
      if (currentMinutes < closeMin) {
        return {
          isOpen: true,
          label: 'Abierto ahora',
          subLabel: `Cierra a las ${item.close}`,
        }
      }
    }
  }

  // 2. Si no está abierto, buscar la próxima apertura
  return {
    isOpen: false,
    label: 'Cerrado ahora',
    subLabel: 'Consulta horarios y reservas',
  }
}
