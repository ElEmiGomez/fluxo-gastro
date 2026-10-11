'use client'

import { useState, useEffect, useCallback } from 'react'
import { LoyaltyProfile, LoyaltyReward } from '@/types/loyalty.types'

interface UseLoyaltyOptions {
  slug: string
  tableNumber?: number | string
}

export function useLoyalty({ slug, tableNumber }: UseLoyaltyOptions) {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null)
  const [rewards, setRewards] = useState<LoyaltyReward[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const storageKey = `fluxo_loyalty_user_${slug}`

  // 1. Cargar perfil desde localStorage y refrescar desde servidor
  const fetchProfile = useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/loyalty/profile?slug=${encodeURIComponent(slug)}&email=${encodeURIComponent(email)}`)
      if (!res.ok) throw new Error('Error al consultar perfil de fidelización')
      const data = await res.json()
      if (data.success && data.profile) {
        setProfile(data.profile)
        try {
          localStorage.setItem(storageKey, JSON.stringify({ email: data.profile.email, name: data.profile.name }))
        } catch (_) {}
      }
    } catch (err: any) {
      console.warn('[useLoyalty] Error sincronizando perfil:', err)
    }
  }, [slug, storageKey])

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

      await fetchRewards()
      if (isMounted) setIsLoading(false)
    }

    init()

    return () => {
      isMounted = false
    }
  }, [storageKey, fetchProfile, fetchRewards])

  // 3. Registro o login sin contraseña (zero-fricción: Nombre + Email)
  const loginOrRegister = async (name: string, email: string, phone?: string) => {
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch('/api/loyalty/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name, email, phone }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo registrar en el programa de puntos')
      }
      setProfile(data.profile)
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify({ email: data.profile.email, name: data.profile.name }))
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

  // 5. Reclamar bonus de Google Maps (+50 Puntos de un solo uso)
  const claimGoogleReviewBonus = async () => {
    if (!profile?.email) {
      throw new Error('Debes iniciar sesión con tu email para recibir el bonus.')
    }
    setError(null)
    try {
      const res = await fetch('/api/loyalty/google-review-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email: profile.email }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo reclamar el bonus de Google Maps')
      }
      // Actualizar perfil reactivamente
      setProfile(prev => prev ? {
        ...prev,
        total_points: data.new_total_points,
        available_points: Math.max(0, data.new_total_points - prev.held_points),
        google_review_bonus_awarded: true,
      } : null)
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  // 6. Refrescar estado manual
  const refresh = () => {
    if (profile?.email) {
      fetchProfile(profile.email)
    }
    fetchRewards()
  }

  return {
    profile,
    rewards,
    isLoading,
    isModalOpen,
    setIsModalOpen,
    error,
    loginOrRegister,
    logout,
    claimGoogleReviewBonus,
    refresh,
  }
}
