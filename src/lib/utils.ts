import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string | null | undefined, currency: string = '€'): string {
  const num = typeof amount === 'number' ? amount : Number(amount)
  const safeAmount = !isNaN(num) && isFinite(num) ? num : 0
  return `${safeAmount.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`
}

export function formatTimeAgo(isoString: string | null | undefined): string {
  if (!isoString) return 'Ahora'
  const time = new Date(isoString).getTime()
  if (isNaN(time)) return 'Ahora'
  
  const diffInMinutes = Math.floor((Date.now() - time) / 60000)
  if (diffInMinutes < 1) return 'Ahora'
  if (diffInMinutes === 1) return 'Hace 1 min'
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} mins`
  const hours = Math.floor(diffInMinutes / 60)
  return `Hace ${hours}h ${diffInMinutes % 60}m`
}

export function getWaitingMinutes(isoString: string | null | undefined): number {
  if (!isoString) return 0
  const time = new Date(isoString).getTime()
  if (isNaN(time)) return 0
  return Math.max(0, Math.floor((Date.now() - time) / 60000))
}
