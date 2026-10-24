'use client'

import { useState, useEffect, useCallback } from 'react'
import { LoyaltyProfile, LoyaltyReward, LoyaltySettings } from '@/types/loyalty.types'

interface UseLoyaltyOptions {
  slug: string
  tableNumber?: number | string
}

export function useLoyalty({ slug, tableNumber }: UseLoyaltyOptions) {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null)
  const [rewards, setRewards] = useState<LoyaltyReward[]>([])
  const [settings, setSettings] = useState<LoyaltySettings | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const storageKey = `fluxo_loyalty_user_${slug}`

  // 1. Cargar perfil desde localStorage y refrescar desde servidor
  const fetchProfile = useCallback(async (email: string) => {
    try {
      const tableQuery = tableNumber ? `&table=${encodeURIComponent(String(tableNumber))}` : ''
      const res = await fetch(`/api/loyalty/profile?slug=${encodeURIComponent(slug)}&email=${encodeURIComponent(email)}${tableQuery}`)
      if (!res.ok) throw new Error('Error al consultar perfil de fidelización')
      const data = await res.json()
      if (data.success && data.profile) {
        setProfile(data.profile)
        if (data.settings) {
          setSettings(data.settings)
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify({ email: data.profile.email, name: data.profile.name }))
        } catch (_) {}
      } else {
        setProfile(null)
        try {
          localStorage.removeItem(storageKey)
        } catch (_) {}
      }
    } catch (err: any) {
      console.warn('[useLoyalty] Error sincronizando perfil:', err)
    }
  }, [slug, storageKey, tableNumber])


  // 2. Cargar catálogo de recompensas
  const fetchRewards = useCallback(async () => {
    try {
      const res = await fetch(`/api/loyalty/rewards?slug=${encodeURIComponent(slug)}`)
      if (!res.ok) throw new Error('Error al consultar recompensas')
      const data = await res.json()
      if (data.success && Array.isArray(data.rewards)) {
        setRewards(data.rewards)
      }
    } catch (err: any) {
      console.warn('[useLoyalty] Error cargando catálogo de premios:', err)
    }
  }, [slug])

  // Efecto inicial de montaje
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    const init = async () => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.email) {
            await fetchProfile(parsed.email)
          }
        }
      } catch (e) {
        console.warn('[useLoyalty] Error leyendo almacenamiento local:', e)
      }

      try {
        const settingsRes = await fetch(`/api/loyalty/settings?slug=${encodeURIComponent(slug)}`)
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          if (settingsData.success && settingsData.settings) {
            setSettings(settingsData.settings)
          }
        }
      } catch (e) {
        console.warn('[useLoyalty] Error cargando configuración de fidelización:', e)
      }

      await fetchRewards()
      if (isMounted) setIsLoading(false)
    }

    init()

    return () => {
      isMounted = false
    }
  }, [slug, storageKey, fetchProfile, fetchRewards])

  // 3. Registro o login sin contraseña (zero-fricción: Nombre + Email)
  const loginOrRegister = async (name: string, email: string, phone?: string, lastPaidSessionTotal?: number) => {
    setError(null)
    setIsLoading(true)
    try {
      const hasPendingReviewBonus =
        typeof window !== 'undefined' &&
        (sessionStorage.getItem('fluxo_pending_google_review_bonus') === 'true' ||
          localStorage.getItem('fluxo_pending_google_review_bonus') === 'true')

      let effectiveLastPaid = lastPaidSessionTotal
      if (!effectiveLastPaid && typeof window !== 'undefined' && tableNumber) {
        const paidOrderData = sessionStorage.getItem(`fluxo_paid_order_${slug}_${tableNumber}`)
        if (paidOrderData) {
          try {
            const parsed = JSON.parse(paidOrderData)
            if (parsed.total) effectiveLastPaid = Number(parsed.total)
          } catch {}
        }
        const isPaidSession = sessionStorage.getItem(`fluxo_table_paid_${slug}_${tableNumber}`) === 'true' || Boolean(paidOrderData)
        if (isPaidSession) {
          const stored = sessionStorage.getItem(`fluxo_last_paid_total_${slug}_${tableNumber}`) || localStorage.getItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
          if (stored) effectiveLastPaid = Number(stored)
        }
      }

      const res = await fetch('/api/loyalty/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          name,
          email,
          phone,
          tableNumber,
          claimGoogleReviewBonus: hasPendingReviewBonus,
          lastPaidSessionTotal: effectiveLastPaid,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo registrar en el programa de puntos')
      }

      setProfile(data.profile)
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify({ email: data.profile.email, name: data.profile.name }))
        if (tableNumber && effectiveLastPaid) {
          sessionStorage.removeItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
          localStorage.removeItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
        }
        if (data.profile.google_review_bonus_awarded) {
          sessionStorage.removeItem('fluxo_pending_google_review_bonus')
          localStorage.removeItem('fluxo_pending_google_review_bonus')
        }
      }
      return data.profile
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 4. Cerrar sesión / Desconectar
  const logout = () => {
    setProfile(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
  }

  // 5. Reclamar bonus de Google Maps (+50 Puntos de un solo uso o configurable)
  const claimGoogleReviewBonus = async (bonusPoints: number = 50) => {
    if (profile?.google_review_bonus_awarded) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('fluxo_pending_google_review_bonus')
        localStorage.removeItem('fluxo_pending_google_review_bonus')
      }
      return { success: true, already_awarded: true, bonus_points: 0, profile }
    }

    if (!profile?.email) {
      // Si el comensal aún no inició sesión, guardar en almacenamiento para acreditar al registrarse
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('fluxo_pending_google_review_bonus', 'true')
        localStorage.setItem('fluxo_pending_google_review_bonus', 'true')
      }
      return { success: true, pending: true, bonus_points: bonusPoints }
    }

    setError(null)
    try {
      const res = await fetch('/api/loyalty/google-review-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email: profile.email, bonusPoints }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo reclamar el bonus de Google Maps')
      }

      const updated = data.profile || {
        ...profile,
        total_points: data.new_total_points,
        available_points: Math.max(0, data.new_total_points - (profile.held_points || 0)),
        google_review_bonus_awarded: true,
      }

      setProfile(updated)
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify({ email: updated.email, name: updated.name }))
        sessionStorage.removeItem('fluxo_pending_google_review_bonus')
        localStorage.removeItem('fluxo_pending_google_review_bonus')
      }
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  // 6. Canjear premio de cartilla de sellos
  const redeemStampReward = async (productId?: string) => {
    if (!profile?.email) {
      throw new Error('Debes identificarte para canjear tu premio.')
    }
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch('/api/loyalty/redeem-stamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email: profile.email, productId }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo canjear el premio')
      }
      if (data.profile) {
        setProfile(data.profile)
      } else {
        setProfile(prev => prev ? {
          ...prev,
          unlocked_rewards_count: data.remaining_rewards ?? Math.max(0, (prev.unlocked_rewards_count || 1) - 1)
        } : null)
      }
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 7. Refrescar estado manual
  const refresh = () => {
    if (profile?.email) {
      fetchProfile(profile.email)
    }
    fetchRewards()
  }

  return {
    profile,
    rewards,
    settings,
    stampsCount: profile?.stamps_count ?? 0,
    stampsTarget: settings?.target_stamps || profile?.stamps_target || 5,
    unlockedRewardsCount: profile?.unlocked_rewards_count ?? 0,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    error,
    loginOrRegister,
    logout,
    claimGoogleReviewBonus,
    redeemStampReward,
    refresh,
  }
}
