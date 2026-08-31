'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { Restaurant } from '@/types/database.types'

interface TenantContextType {
  restaurant: Restaurant
  currentTable: string | null
  setTable: (table: string | null) => void
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export function TenantProvider({
  restaurant,
  initialTable = null,
  children,
}: {
  restaurant: Restaurant
  initialTable?: string | null
  children: React.ReactNode
}) {
  const [currentTable, setTable] = React.useState<string | null>(initialTable)

  // Inyección reactiva de variables CSS de Marca Blanca
  useEffect(() => {
    if (!restaurant) return

    const root = document.documentElement
    root.style.setProperty('--brand-primary', restaurant.primary_color || '#000000')
    root.style.setProperty('--brand-secondary', restaurant.secondary_color || '#ffffff')
    root.style.setProperty('--brand-accent', restaurant.primary_color || '#ea580c')
  }, [restaurant])

  return (
    <TenantContext.Provider value={{ restaurant, currentTable, setTable }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenant debe ser utilizado dentro de un TenantProvider')
  }
  return context
}
