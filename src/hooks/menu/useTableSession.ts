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
  const [isTablePaid, setIsTablePaid] = useState<boolean>(false)
  const [isPaidBannerDismissed, setIsPaidBannerDismissed] = useState<boolean>(false)
  const [isReviewBoosterDismissed, setIsReviewBoosterDismissed] = useState<boolean>(false)
  const [hasRequestedBill, setHasRequestedBill] = useState<boolean>(false)
  const hasRequestedBillRef = useRef<boolean>(false)
  const userRequestedBillTimeRef = useRef<number | null>(null)

  const [pendingServiceCalls, setPendingServiceCalls] = useState<Set<string>>(new Set())
  const [serviceRequestedToast, setServiceRequestedToast] = useState<string | null>(null)

  const handleTableMarkedPaid = useCallback(() => {
    setIsTablePaid(true)
    setIsPaidBannerDismissed(false)
    setIsReviewBoosterDismissed(false)
    setHasRequestedBill(false)
    hasRequestedBillRef.current = false
    userRequestedBillTimeRef.current = null
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`fluxo_table_paid_${slug}_${tableNumber}`, 'true')
        sessionStorage.removeItem(`fluxo_bill_requested_${slug}_${tableNumber}`)
        sessionStorage.removeItem(`fluxo_paid_banner_dismissed_${slug}_${tableNumber}`)
        sessionStorage.removeItem(`fluxo_review_dismissed_${slug}`)
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
    try {
      const res = await fetch('/api/service-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          table_number: tableNumber,
          call_type: `service_${serviceName}`,
        }),
      })

      if (!res.ok) {
        throw new Error('Error al solicitar servicio')
      }

      setPendingServiceCalls(prev => new Set(prev).add(serviceName))
      setServiceRequestedToast(serviceName)
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
        sessionStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
        sessionStorage.removeItem(`fluxo_bill_requested_${slug}_${tableNumber}`)
        sessionStorage.removeItem(`fluxo_paid_banner_dismissed_${slug}_${tableNumber}`)
        localStorage.removeItem(`fluxo_table_paid_${slug}_${tableNumber}`)
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
        setSessionId(localStoredSession)
        ensureServerSession()
      } else {
        fetch(`/api/session/restore?slug=${slug}&table=${tableNumber}`)
          .then(r => r.json())
          .then(data => {
            if (data.restored && data.session_token) {
              setSessionId(data.session_token)
              localStorage.setItem(`gastro_session_${slug}_${tableNumber}`, data.session_token)
            } else {
              ensureServerSession()
            }
          })
          .catch(() => {
            ensureServerSession()
          })
      }
    }
  }, [slug, tableNumber, urlSession])

  return {
    tableNumber,
    setTableNumber,
    sessionId,
    setSessionId,
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
