// ============================================================================
// Fluxo POS - Motor de División de Cuentas y Aritmética de Céntimos
// ============================================================================

export interface BillSplitItem {
  id: string
  name: string
  quantity: number
  unitPriceCents: number
  totalPriceCents: number
  paidQuantity: number // Cantidad ya pagada
  courseType?: string
}

export interface EqualSplitQuota {
  quotaNumber: number
  totalQuotas: number
  amountCents: number
  isRemainderAdjustment: boolean
  isPaid: boolean
  paidMethod?: 'cash' | 'card' | 'mixed'
}

/**
 * Convierte un importe flotante en euros a céntimos enteros exactos.
 */
export function toCents(euroAmount: number): number {
  return Math.round((Number(euroAmount) || 0) * 100)
}

/**
 * Convierte céntimos a string de euros con dos decimales "XX.XX €".
 */
export function centsToEuro(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €'
}

/**
 * Divide un total en céntimos en N cuotas exactas (2 a 12 comensales).
 * La última cuota absorbe el residuo del módulo para garantizar que la suma sea 100% idéntica.
 */
export function calculateEqualSplits(
  totalCents: number,
  numberOfGuests: number,
  paidQuotasCount = 0
): EqualSplitQuota[] {
  const n = Math.max(2, Math.min(12, Math.floor(numberOfGuests)))
  const baseQuota = Math.floor(totalCents / n)
  const remainder = totalCents % n

  const quotas: EqualSplitQuota[] = []

  for (let i = 1; i <= n; i++) {
    // Si hay residuo, se le asigna a la última cuota (o a las últimas n cuotas)
    const isLast = i === n
    const amount = isLast ? baseQuota + remainder : baseQuota

    quotas.push({
      quotaNumber: i,
      totalQuotas: n,
      amountCents: amount,
      isRemainderAdjustment: isLast && remainder > 0,
      isPaid: i <= paidQuotasCount,
    })
  }

  return quotas
}

/**
 * Verifica si la cuenta ha alcanzado exactamente 0 céntimos restantes para auto-liberar la mesa.
 */
export function isBillFullySettled(totalCents: number, paidCents: number): boolean {
  return Math.max(0, totalCents - paidCents) === 0
}

/**
 * Calcula el desglose restante por platos.
 */
export function calculateRemainingItemsBalance(items: BillSplitItem[]): {
  totalCents: number
  paidCents: number
  remainingCents: number
  remainingItems: BillSplitItem[]
} {
  let totalCents = 0
  let paidCents = 0
  const remainingItems: BillSplitItem[] = []

  for (const item of items) {
    const itemTotal = item.quantity * item.unitPriceCents
    const itemPaid = Math.min(item.quantity, item.paidQuantity) * item.unitPriceCents
    totalCents += itemTotal
    paidCents += itemPaid

    const remainingQty = item.quantity - item.paidQuantity
    if (remainingQty > 0) {
      remainingItems.push({
        ...item,
        quantity: remainingQty,
        totalPriceCents: remainingQty * item.unitPriceCents,
      })
    }
  }

  return {
    totalCents,
    paidCents,
    remainingCents: Math.max(0, totalCents - paidCents),
    remainingItems,
  }
}
