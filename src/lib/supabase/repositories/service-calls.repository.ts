import { createServerClient } from '../server'
import { isSupabaseConfigured } from '../client'
import { ServiceCall } from '@/types/database.types'
import { broadcastEvent } from '@/lib/server-state'
import { logServiceCallError } from '@/lib/logger'
import { getTargetRestaurantId } from './restaurants.repository'

/**
 * 7. LLAMADAS DE SERVICIO: Crear llamada (mozo, cuenta, etc.)
 */
export async function createServiceCall(
  restaurantId: string,
  slug: string,
  callData: {
    table_number: number
    call_type: string
    table_session_id?: string
  }
): Promise<ServiceCall> {
  const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('service_calls')
        .insert({
          restaurant_id: targetRestaurantId,
          table_number: callData.table_number,
          call_type: callData.call_type,
          status: 'pending',
        })
        .select('*')
        .single()

      if (!error && data) {
        broadcastEvent({ type: 'service_call', slug, call: data })
        return data as ServiceCall
      }
      if (error) {
        const dbErr: any = new Error(error.message || 'Error al insertar llamada de servicio en Supabase')
        dbErr.code = error.code
        dbErr.details = error.details
        dbErr.hint = error.hint
        throw dbErr
      }
    } catch (e: any) {
      logServiceCallError(e, {
        slug,
        restaurant_id: targetRestaurantId,
        table_number: callData.table_number,
        call_type: callData.call_type,
        table_session_id: callData.table_session_id,
      })
      throw e
    }
  }

  const unconfiguredErr = new Error('Base de datos Supabase no configurada para registrar alertas de servicio')
  logServiceCallError(unconfiguredErr, {
    slug,
    restaurant_id: targetRestaurantId,
    table_number: callData.table_number,
    call_type: callData.call_type,
    table_session_id: callData.table_session_id,
  })
  throw unconfiguredErr
}

/**
 * 7.1 LLAMADAS DE SERVICIO: Obtener llamadas activas del restaurante (Exclusivamente Supabase SSOT)
 */
export async function getRestaurantServiceCalls(restaurantId: string, slug: string): Promise<ServiceCall[]> {
  const targetRestaurantId = getTargetRestaurantId(restaurantId, slug)
  const supabase = createServerClient()
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('service_calls')
        .select('*')
        .eq('restaurant_id', targetRestaurantId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (!error && data) {
        return data as ServiceCall[]
      }
      if (error) {
        console.warn('Supabase service_calls select error:', error)
      }
    } catch (e) {
      console.warn('Error fetching service calls from Supabase:', e)
    }
  }

  return []
}

/**
 * 8. LLAMADAS DE SERVICIO: Atender llamada
 */
export async function attendServiceCall(
  slug: string,
  callId: string
): Promise<void> {
  const supabase = createServerClient()
  let attendedCall: any = null

  if (supabase && isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from('service_calls')
        .update({ status: 'attended' })
        .eq('id', callId)
        .select('*')
        .maybeSingle()

      if (data) {
        attendedCall = data
      }
    } catch (e) {
      console.warn('Error attending service call in Supabase:', e)
    }
  }

  // Si no se obtuvo de Supabase, intentar de server-state / memoria
  if (!attendedCall) {
    try {
      const { attendServerServiceCall } = await import('@/lib/server-state')
      attendServerServiceCall(slug, callId)
      return
    } catch {
      // ignore
    }
  }

  broadcastEvent({
    type: 'service_call_attended',
    slug,
    callId,
    call: attendedCall,
    table_number: attendedCall?.table_number,
    is_bill: attendedCall?.call_type ? attendedCall.call_type.startsWith('bill_') : false,
  })

  // Si la llamada atendida era de cobro / cuenta, emitir table_bill_paid y marcar órdenes de mesa como paid
  if (attendedCall && attendedCall.call_type && attendedCall.call_type.startsWith('bill_')) {
    const tableNum = Number(attendedCall.table_number)
    broadcastEvent({
      type: 'table_bill_paid',
      slug,
      table_number: tableNum,
      callId,
    })

    if (supabase && isSupabaseConfigured() && tableNum) {
      try {
        const targetRestaurantId = attendedCall.restaurant_id
        if (targetRestaurantId) {
          await supabase
            .from('orders')
            .update({ status: 'paid' })
            .eq('restaurant_id', targetRestaurantId)
            .eq('table_number', tableNum)
            .neq('status', 'cancelled')
        }
      } catch (err) {
        console.warn('Error marking table orders as paid on bill attended:', err)
      }
    }
  }
}
