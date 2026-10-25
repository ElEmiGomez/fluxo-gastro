'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { triggerHaptic, HAPTIC_PATTERNS } from '@/lib/haptic'

interface UseTableSessionParams {
  slug: string
  initialTable: string
  urlSession?: string | null
}

export function useTableSession({ slug, initialTable, urlSession }: UseTableSessionParams) {
  const [tableNumber, setTableNumber] = useState<string>(initialTable)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const readPaidLockFromStorage = (s: string, t: string): boolean => {
    if (typeof window === 'undefined') return false
    try {
      if (
        sessionStorage.getItem(`fluxo_paid_lock_${s}_${t}`) === 'true' ||
        sessionStorage.getItem(`fluxo_table_paid_lock_${s}_${t}`) === 'true'
      ) {
        return true
      }
      const stored = sessionStorage.getItem(`fluxo_paid_order_${s}_${t}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        return Boolean(parsed?.isOrderPaid)
      }
    } catch {}
    return false
  }

  const [isOrderPaid, setIsOrderPaid] = useState<boolean>(() => readPaidLockFromStorage(slug, tableNumber))
  const [isTablePaid, setIsTablePaid] = useState<boolean>(() => readPaidLockFromStorage(slug, tableNumber))
  const [isPaidBannerDismissed, setIsPaidBannerDismissed] = useState<boolean>(false)
  const [isReviewBoosterDismissed, setIsReviewBoosterDismissed] = useState<boolean>(false)
  const [hasRequestedBill, setHasRequestedBill] = useState<boolean>(false)
  const hasRequestedBillRef = useRef<boolean>(false)
  const userRequestedBillTimeRef = useRef<number | null>(null)

  const [pendingServiceCalls, setPendingServiceCalls] = useState<Set<string>>(new Set())
  const [serviceRequestedToast, setServiceRequestedToast] = useState<string | null>(null)

  const handleTableMarkedPaid = useCallback((paidSnapshot?: { total?: number; points?: number }) => {
    setIsTablePaid(true)
    setIsOrderPaid(true)
    setIsPaidBannerDismissed(false)
    setIsReviewBoosterDismissed(false)
    setHasRequestedBill(false)
    hasRequestedBillRef.current = false
    userRequestedBillTimeRef.current = null
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(`fluxo_bill_requested_${slug}_${tableNumber}`)
        sessionStorage.removeItem(`fluxo_paid_banner_dismissed_${slug}_${tableNumber}`)
        sessionStorage.removeItem(`fluxo_review_dismissed_${slug}`)
        sessionStorage.setItem(`fluxo_paid_lock_${slug}_${tableNumber}`, 'true')
        sessionStorage.setItem(`fluxo_table_paid_lock_${slug}_${tableNumber}`, 'true')
        const currentData = sessionStorage.getItem(`fluxo_paid_order_${slug}_${tableNumber}`)
        const prevParsed = currentData ? JSON.parse(currentData) : {}
        const lastPaidStored = typeof window !== 'undefined' ? sessionStorage.getItem(`fluxo_last_paid_total_${slug}_${tableNumber}`) : null
        const totalAmount = paidSnapshot?.total ?? (lastPaidStored ? Number(lastPaidStored) : (prevParsed.total ?? 0))
        const pointsEarned = paidSnapshot?.points ?? prevParsed.points ?? (totalAmount > 0 ? Math.round(totalAmount * 10) : 50)
        sessionStorage.setItem(
          `fluxo_paid_order_${slug}_${tableNumber}`,
          JSON.stringify({
            isOrderPaid: true,
            total: totalAmount,
            points: pointsEarned,
            paidAt: Date.now(),
          })
        )
      } catch {}
    }
  }, [slug, tableNumber])

  const resetPaidOrderSession = useCallback(() => {
    setIsOrderPaid(false)
    setIsTablePaid(false)
    if (typeof window !== 'undefined') {
      try {
        const lastPaidVal = sessionStorage.getItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
        if (lastPaidVal) {
          sessionStorage.setItem(`fluxo_last_client_paid_amount_${slug}`, lastPaidVal)
        }
        sessionStorage.setItem(`fluxo_paid_dismissed_${slug}_${tableNumber}`, String(Date.now()))
        sessionStorage.removeItem(`fluxo_active_order_ids_${slug}_${tableNumber}`)
        sessionStorage.removeItem(`fluxo_paid_lock_${slug}_${tableNumber}`)
        sessionStorage.removeItem(`fluxo_table_paid_lock_${slug}_${tableNumber}`)
        sessionStorage.removeItem(`fluxo_paid_order_${slug}_${tableNumber}`)
        sessionStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
        sessionStorage.removeItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
        localStorage.removeItem(`fluxo_cart_${slug}_${tableNumber}`)
      } catch {}
    }
  }, [slug, tableNumber])

  const handleBillRequested = useCallback(() => {
    userRequestedBillTimeRef.current = Date.now()
    hasRequestedBillRef.current = true
    setHasRequestedBill(true)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`fluxo_bill_requested_${slug}_${tableNumber}`, 'true')
      } catch {}
    }
  }, [slug, tableNumber])

  const handleRequestMicroService = useCallback(async (serviceName: string) => {
    triggerHaptic(HAPTIC_PATTERNS.SERVICE_CALL)
    const isWaiterCall = /waiter|mozo/i.test(serviceName)
    const callType = isWaiterCall ? 'waiter_attention' : `service_${serviceName}`
    try {
      const res = await fetch('/api/service-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          table_number: tableNumber,
          call_type: callType,
        }),
      })

      if (!res.ok) {
        throw new Error('Error al solicitar servicio')
      }

      const registeredKey = isWaiterCall ? 'mozo' : serviceName
      setPendingServiceCalls(prev => new Set(prev).add(registeredKey))
      setServiceRequestedToast(registeredKey)
      setTimeout(() => {
        setServiceRequestedToast(null)
      }, 3000)
    } catch {
      alert('Hubo un inconveniente al solicitar el servicio. Por favor avisa directamente al personal o intenta nuevamente.')
    }
  }, [slug, tableNumber])

  // Inicialización y restauración de sesión en servidor
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const hasLockedPaid = readPaidLockFromStorage(slug, tableNumber)
        if (hasLockedPaid) {
          setIsOrderPaid(true)
          setIsTablePaid(true)
        } else {
          setIsOrderPaid(false)
          setIsTablePaid(false)
          sessionStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
          localStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
        }
        sessionStorage.removeItem(`fluxo_bill_requested_${slug}_${tableNumber}`)
        sessionStorage.removeItem(`fluxo_paid_banner_dismissed_${slug}_${tableNumber}`)
      } catch {}

      // Registro analítico anónimo (RGPD compliant)
      try {
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, type: 'page_view', table_number: tableNumber }),
        }).catch(() => {})
      } catch {}

      const localStoredSession = localStorage.getItem(`gastro_session_${slug}_${tableNumber}`)

      const ensureServerSession = () => {
        fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, table_number: tableNumber, action: 'start_session' }),
        })
          .then(r => r.json())
          .then(startData => {
            if (startData.session_token) {
              setSessionId(startData.session_token)
              localStorage.setItem(`gastro_session_${slug}_${tableNumber}`, startData.session_token)
            }
          })
          .catch(() => {})
      }

      if (urlSession) {
        setSessionId(urlSession)
        localStorage.setItem(`gastro_session_${slug}_${tableNumber}`, urlSession)
        ensureServerSession()
      } else if (localStoredSession) {
        fetch(`/api/session/restore?slug=${slug}&table=${tableNumber}&token=${encodeURIComponent(localStoredSession)}&_t=${Date.now()}`, { cache: 'no-store' })
          .then(r => r.json())
          .then(data => {
            if (data.restored && data.session_token) {
              setSessionId(data.session_token)
              localStorage.setItem(`gastro_session_${slug}_${tableNumber}`, data.session_token)
            } else {
              resetPaidOrderSession()
              localStorage.removeItem(`gastro_session_${slug}_${tableNumber}`)
              ensureServerSession()
            }
          })
          .catch(() => {
            ensureServerSession()
          })
      } else {
        fetch(`/api/session/restore?slug=${slug}&table=${tableNumber}&_t=${Date.now()}`, { cache: 'no-store' })
          .then(r => r.json())
          .then(data => {
            if (data.restored && data.session_token) {
              setSessionId(data.session_token)
              localStorage.setItem(`gastro_session_${slug}_${tableNumber}`, data.session_token)
            } else {
              resetPaidOrderSession()
              ensureServerSession()
            }
          })
          .catch(() => {
            ensureServerSession()
          })
      }
    }
  }, [slug, tableNumber, urlSession, resetPaidOrderSession])

  // Escuchar evento de liberación de mesa para resetear inmediatamente el estado del comensal
  useEffect(() => {
    const handleFreed = (e: any) => {
      const freedTbl = e.detail?.tableNumber ?? e.detail?.table_number
      if (freedTbl?.toString() === tableNumber?.toString()) {
        resetPaidOrderSession()
        setIsOrderPaid(false)
        setIsTablePaid(false)
        setIsPaidBannerDismissed(false)
        setIsReviewBoosterDismissed(false)
        setHasRequestedBill(false)
        hasRequestedBillRef.current = false
        userRequestedBillTimeRef.current = null
        if (e.detail?.new_session_id) {
          setSessionId(e.detail.new_session_id)
          try {
            localStorage.setItem(`gastro_session_${slug}_${tableNumber}`, e.detail.new_session_id)
          } catch (_) {}
        } else {
          setSessionId(null)
          try {
            localStorage.removeItem(`gastro_session_${slug}_${tableNumber}`)
          } catch (_) {}
          fetch('/api/tables', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, table_number: tableNumber, action: 'start_session' }),
          })
            .then(r => r.json())
            .then(startData => {
              if (startData?.session_token) {
                setSessionId(startData.session_token)
                try {
                  localStorage.setItem(`gastro_session_${slug}_${tableNumber}`, startData.session_token)
                } catch (_) {}
              }
            })
            .catch(() => {})
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('fluxo_table_freed', handleFreed)
      return () => {
        window.removeEventListener('fluxo_table_freed', handleFreed)
      }
    }
  }, [slug, tableNumber, resetPaidOrderSession])

  return {
    tableNumber,
    setTableNumber,
    sessionId,
    setSessionId,
    isOrderPaid,
    setIsOrderPaid,
    resetPaidOrderSession,
    isTablePaid,
    setIsTablePaid,
    isPaidBannerDismissed,
    setIsPaidBannerDismissed,
    isReviewBoosterDismissed,
    setIsReviewBoosterDismissed,
    hasRequestedBill,
    setHasRequestedBill,
    hasRequestedBillRef,
    userRequestedBillTimeRef,
    handleBillRequested,
    handleTableMarkedPaid,
    pendingServiceCalls,
    setPendingServiceCalls,
    serviceRequestedToast,
    handleRequestMicroService,
  }
}
