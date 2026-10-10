import { createServerClient } from '../server'
import { isSupabaseConfigured } from '../client'
import { TableSession } from '@/types/database.types'
import {
  broadcastEvent,
  setTableOccupied,
  freeTableSession as memoryFreeTableSession,
  getOrCreateTableSession as memoryGetOrCreateSession,
  validateTableSession as memoryValidateSession,
} from '@/lib/server-state'
import { getTargetRestaurantId } from './restaurants.repository'

/**
 * 1. SEGURIDAD DE SESIÓN: Iniciar u obtener sesión activa con UUID por visita
 */
export async function createOrGetActiveSession(
  restaurantId: string,
  slug: string,
  tableNumber: number
): Promise<TableSession> {
  const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      // Buscar sesión activa existente
      const { data: existing, error: searchErr } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('restaurant_id', targetRestaurantId)
        .eq('table_number', tableNumber)
        .eq('status', 'active')
        .maybeSingle()

      if (!searchErr && existing) {
        setTableOccupied(slug, tableNumber, existing.session_token)
        return existing as TableSession
      }

      // Si no existe, crear nueva sesión con UUID
      const { data: newSession, error: createErr } = await supabase
        .from('table_sessions')
        .insert({
          restaurant_id: targetRestaurantId,
          table_number: tableNumber,
          status: 'active',
        })
        .select('*')
        .single()

      if (!createErr && newSession) {
        setTableOccupied(slug, tableNumber, newSession.session_token)
        broadcastEvent({
          type: 'table_session_updated',
          slug,
          tableNumber,
          session: newSession,
        })
        return newSession as TableSession
      }
    } catch (e) {
      console.warn('Error with Supabase table_sessions, falling back to memory:', e)
    }
  }

  // Fallback en memoria resiliente con UUID v4
  const session = memoryGetOrCreateSession(slug, tableNumber)
  return {
    ...session,
    session_token: session.session_id,
    restaurant_id: restaurantId,
    status: 'active',
  }
}

/**
 * 2. SEGURIDAD DE SESIÓN: Validar token UUID de comensal
 */
export async function validateSessionToken(
  restaurantId: string,
  slug: string,
  tableNumber: number,
  sessionToken?: string
): Promise<{ valid: boolean; session?: TableSession; reason?: string; status?: number }> {
  if (!sessionToken) {
    return { valid: true, session: { table_number: tableNumber, session_token: `sess-${tableNumber}-${Date.now()}`, status: 'active' } }
  }

  const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data: session, error } = await supabase
        .from('table_sessions')
        .select('*')
        .eq('restaurant_id', targetRestaurantId)
        .eq('table_number', tableNumber)
        .eq('session_token', sessionToken)
        .maybeSingle()

      if (session) {
        if (session.status !== 'active') {
          return { valid: false, reason: 'SESSION_EXPIRED', status: 403 }
        }
        setTableOccupied(slug, tableNumber, session.session_token)
        return { valid: true, session: session as TableSession }
      }

      // Si no se encontró en Supabase pero existe en memoria activa
      const memCheck = memoryValidateSession(slug, tableNumber, sessionToken)
      if (memCheck.valid) {
        return {
          valid: true,
          session: {
            table_number: tableNumber,
            session_token: memCheck.currentSessionId,
            status: 'active',
          },
        }
      }

      return { valid: false, reason: 'SESSION_EXPIRED', status: 403 }
    } catch (e) {
      console.warn('Error validating session in Supabase:', e)
    }
  }

  // Validación en memoria
  const memCheck = memoryValidateSession(slug, tableNumber, sessionToken)
  if (!memCheck.valid) {
    return { valid: false, reason: memCheck.reason || 'SESSION_EXPIRED', status: memCheck.status || 403 }
  }
  return {
    valid: true,
    session: {
      table_number: tableNumber,
      session_token: memCheck.currentSessionId,
      status: 'active',
    },
  }
}

/**
 * 3. SEGURIDAD DE SESIÓN: Cerrar e invalidar sesión de mesa (Liberar Mesa)
 */
export async function closeTableSession(
  restaurantId: string,
  slug: string,
  tableNumber: number
): Promise<void> {
  const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      // Invocación a función SQL atómica o update directo
      await supabase
        .from('table_sessions')
        .update({ status: 'closed', closed_at: new Date().toISOString() })
        .eq('restaurant_id', targetRestaurantId)
        .eq('table_number', tableNumber)
        .eq('status', 'active')

      // Marcar órdenes no canceladas de esta mesa como paid en Supabase para preservar el historial
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('restaurant_id', targetRestaurantId)
        .eq('table_number', tableNumber)
        .neq('status', 'cancelled')

      // Marcar llamadas pendientes como atendidas
      await supabase
        .from('service_calls')
        .update({ status: 'attended' })
        .eq('restaurant_id', targetRestaurantId)
        .eq('table_number', tableNumber)
        .eq('status', 'pending')
    } catch (e) {
      console.warn('Error closing session in Supabase:', e)
    }
  }

  // Sincronizar en memoria y emitir evento SSE
  memoryFreeTableSession(slug, tableNumber)
}
