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

  const saveProfileToStorage = useCallback((p: LoyaltyProfile | null) => {
    if (typeof window === 'undefined') return
    try {
      if (p && p.email) {
        localStorage.setItem(storageKey, JSON.stringify({
          id: p.id,
          restaurant_slug: p.restaurant_slug || slug,
          email: p.email,
          name: p.name,
          phone: p.phone,
          total_points: p.total_points,
          available_points: p.available_points,
          held_points: p.held_points,
          stamps_count: p.stamps_count,
          stamps_target: p.stamps_target,
          unlocked_rewards_count: p.unlocked_rewards_count,
          total_stamps_earned: p.total_stamps_earned,
          google_review_bonus_awarded: p.google_review_bonus_awarded,
        }))
      } else {
        localStorage.removeItem(storageKey)
      }
    } catch (_) {}
  }, [storageKey, slug])

  const getStoredProfile = useCallback((): LoyaltyProfile | null => {
    if (typeof window === 'undefined') return null
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }, [storageKey])

  // 1. Cargar perfil desde localStorage y refrescar desde servidor
  const fetchProfile = useCallback(async (email: string) => {
    try {
      const cached = getStoredProfile()
      const tableQuery = tableNumber ? `&table=${encodeURIComponent(String(tableNumber))}` : ''
      const nameQuery = cached?.name ? `&name=${encodeURIComponent(cached.name)}` : ''
      const cachedStampsQuery = cached?.stamps_count !== undefined ? `&cachedStamps=${encodeURIComponent(String(cached.stamps_count))}` : ''
      const cachedUnlockedQuery = cached?.unlocked_rewards_count !== undefined ? `&cachedUnlocked=${encodeURIComponent(String(cached.unlocked_rewards_count))}` : ''
      const cachedBonusQuery = cached?.google_review_bonus_awarded ? `&cachedGoogleBonus=true` : ''
      let lastPaidParam = ''
      if (typeof window !== 'undefined' && tableNumber) {
        const storedPaid = sessionStorage.getItem(`fluxo_last_paid_total_${slug}_${tableNumber}`) ||
          localStorage.getItem(`fluxo_last_paid_total_${slug}_${tableNumber}`) ||
          sessionStorage.getItem(`fluxo_last_client_paid_amount_${slug}`)
        if (storedPaid) lastPaidParam = `&lastPaidSessionTotal=${encodeURIComponent(storedPaid)}`
      }
      const res = await fetch(`/api/loyalty/profile?slug=${encodeURIComponent(slug)}&email=${encodeURIComponent(email)}${tableQuery}${nameQuery}${cachedStampsQuery}${cachedUnlockedQuery}${cachedBonusQuery}${lastPaidParam}`)
      if (!res.ok) throw new Error('Error al consultar perfil de fidelización')
      const data = await res.json()
      if (data.success && data.profile) {
        const reconciledProfile: LoyaltyProfile = {
          ...data.profile,
          stamps_count: Math.max(cached?.stamps_count ?? 0, data.profile.stamps_count ?? 0),
          total_stamps_earned: Math.max(cached?.total_stamps_earned ?? 0, data.profile.total_stamps_earned ?? 0),
          unlocked_rewards_count: Math.max(cached?.unlocked_rewards_count ?? 0, data.profile.unlocked_rewards_count ?? 0),
          google_review_bonus_awarded: Boolean(data.profile.google_review_bonus_awarded || cached?.google_review_bonus_awarded),
        }
        setProfile(reconciledProfile)
        if (data.settings) {
          setSettings(data.settings)
        }
        saveProfileToStorage(reconciledProfile)
      } else if (cached && cached.email && cached.email.toLowerCase() === email.toLowerCase()) {
        // Nunca borrar la sesión persistente del cliente si una instancia serverless fría aún no tenía el perfil en memoria
        setProfile(prev => prev || cached)
        if (data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (err: any) {
      console.warn('[useLoyalty] Error sincronizando perfil:', err)
    }
  }, [slug, saveProfileToStorage, tableNumber, getStoredProfile])


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

  // Escuchar evento de logout para sincronizar estado en tiempo real (mismo tab y cross-tab)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleLogout = (e: any) => {
      if (!e.detail?.slug || e.detail.slug === slug) {
        setProfile(null)
      }
    }
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && !e.newValue) {
        setProfile(null)
      }
    }
    window.addEventListener('fluxo_loyalty_logout', handleLogout)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('fluxo_loyalty_logout', handleLogout)
      window.removeEventListener('storage', handleStorage)
    }
  }, [slug, storageKey])

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
            // Hidratación optimista para evitar saltos visuales al recargar
            setProfile((prev) => prev || ({
              id: parsed.id || 'stored-session',
              restaurant_slug: parsed.restaurant_slug || slug,
              email: parsed.email,
              name: parsed.name || '',
              phone: parsed.phone,
              total_points: parsed.total_points ?? 0,
              available_points: parsed.available_points ?? 0,
              held_points: parsed.held_points ?? 0,
              stamps_count: parsed.stamps_count ?? 0,
              stamps_target: parsed.stamps_target ?? 5,
              unlocked_rewards_count: parsed.unlocked_rewards_count ?? 0,
              total_stamps_earned: parsed.total_stamps_earned ?? 0,
              google_review_bonus_awarded: Boolean(parsed.google_review_bonus_awarded),
              created_at: '',
              updated_at: '',
            }))
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
      const hasPendingReviewBonus = false



      let effectiveLastPaid = lastPaidSessionTotal
      if (!effectiveLastPaid && typeof window !== 'undefined' && tableNumber) {
        const paidOrderData = sessionStorage.getItem(`fluxo_paid_order_${slug}_${tableNumber}`)
        if (paidOrderData) {
          try {
            const parsed = JSON.parse(paidOrderData)
            if (parsed.total) effectiveLastPaid = Number(parsed.total)
          } catch {}
        }
        const isPaidSession = sessionStorage.getItem(`fluxo_table_paid_${slug}_${tableNumber}`) === 'true' || Boolean(paidOrderData) || Boolean(sessionStorage.getItem(`fluxo_last_client_paid_amount_${slug}`))
        if (isPaidSession) {
          const stored = sessionStorage.getItem(`fluxo_last_paid_total_${slug}_${tableNumber}`) ||
            localStorage.getItem(`fluxo_last_paid_total_${slug}_${tableNumber}`) ||
            sessionStorage.getItem(`fluxo_last_client_paid_amount_${slug}`)
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
          claimGoogleReviewBonus: false,
          lastPaidSessionTotal: effectiveLastPaid,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo registrar en el programa de puntos')
      }

      setProfile(data.profile)
      saveProfileToStorage(data.profile)
      if (typeof window !== 'undefined') {
        if (tableNumber && effectiveLastPaid) {
          sessionStorage.removeItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
          localStorage.removeItem(`fluxo_last_paid_total_${slug}_${tableNumber}`)
        }
        sessionStorage.removeItem('fluxo_pending_google_review_bonus')
        localStorage.removeItem('fluxo_pending_google_review_bonus')
      }
      return data.profile
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 4. Cerrar sesión / Desconectar comensal de esta mesa
  const logout = useCallback(() => {
    setProfile(null)
    saveProfileToStorage(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(`fluxo_client_phone_${slug}`)
      sessionStorage.removeItem(`fluxo_client_phone_${slug}`)
      localStorage.removeItem('fluxo_pending_google_review_bonus')
      sessionStorage.removeItem('fluxo_pending_google_review_bonus')
      // Disparar evento para que otras vistas o pestañas sincronicen la desconexión
      window.dispatchEvent(new CustomEvent('fluxo_loyalty_logout', { detail: { slug } }))
      if (tableNumber) {
        fetch(`/api/loyalty/profile?slug=${encodeURIComponent(slug)}&table=${encodeURIComponent(String(tableNumber))}&action=leave_table`, {
          method: 'DELETE',
        }).catch(() => {})
      }
    }
  }, [storageKey, slug, saveProfileToStorage, tableNumber])

  // 5. Reclamar bonus de Google Maps (+50 Puntos o +1 Sello de un solo uso)
  const claimGoogleReviewBonus = async (bonusPoints: number = 50) => {
    if (profile?.google_review_bonus_awarded) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('fluxo_pending_google_review_bonus')
        localStorage.removeItem('fluxo_pending_google_review_bonus')
      }
      return { success: true, already_awarded: true, bonus_points: 0, profile }
    }

    if (!profile?.email) {
      // Si el comensal aún no inició sesión, guardar en sessionStorage de esta sesión para acreditar al registrarse
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('fluxo_pending_google_review_bonus', 'true')
      }
      return { success: true, pending: true, bonus_points: bonusPoints }
    }

    setError(null)
    try {
      let effectiveLastPaid: number | undefined = undefined
      if (typeof window !== 'undefined' && tableNumber) {
        const stored = sessionStorage.getItem(`fluxo_last_paid_total_${slug}_${tableNumber}`) ||
          localStorage.getItem(`fluxo_last_paid_total_${slug}_${tableNumber}`) ||
          sessionStorage.getItem(`fluxo_last_client_paid_amount_${slug}`)
        if (stored) effectiveLastPaid = Number(stored)
      }

      const res = await fetch('/api/loyalty/google-review-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          email: profile.email,
          bonusPoints,
          tableNumber,
          lastPaidSessionTotal: effectiveLastPaid,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo reclamar el bonus de Google Maps')
      }

      const orderStamp = ((effectiveLastPaid && effectiveLastPaid > 0) || (profile.stamps_count && profile.stamps_count > 0)) ? 1 : 0
      const fallbackStamps = Math.max((profile.stamps_count || 0) + 1, orderStamp + 1)
      const serverStamps = typeof data.stamps_count === 'number' ? data.stamps_count : (data.profile?.stamps_count ?? fallbackStamps)
      const finalStamps = Math.max(serverStamps, fallbackStamps)

      const updated: LoyaltyProfile = {
        ...(data.profile || profile),
        total_points: data.new_total_points ?? data.profile?.total_points ?? (profile.total_points + bonusPoints),
        available_points: Math.max(0, (data.new_total_points ?? data.profile?.total_points ?? (profile.total_points + bonusPoints)) - (profile.held_points || 0)),
        stamps_count: finalStamps,
        total_stamps_earned: Math.max((profile.total_stamps_earned || 0) + 1, finalStamps),
        google_review_bonus_awarded: true,
      }

      setProfile(updated)
      saveProfileToStorage(updated)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('fluxo_pending_google_review_bonus')
        localStorage.removeItem('fluxo_pending_google_review_bonus')
      }
      return { ...data, profile: updated }
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
        saveProfileToStorage(data.profile)
      } else {
        setProfile(prev => {
          if (!prev) return null
          const updated = {
            ...prev,
            unlocked_rewards_count: data.remaining_rewards ?? Math.max(0, (prev.unlocked_rewards_count || 1) - 1)
          }
          saveProfileToStorage(updated)
          return updated
        })
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
