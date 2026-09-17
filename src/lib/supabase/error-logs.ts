import { createServerClient } from './server'
import { isSupabaseConfigured } from './client'
import { SystemErrorLog } from '../../types/database.types'

export interface RecordSystemErrorLogParams {
  restaurant_slug?: string | null
  slug?: string | null
  table_number?: number | string | null
  service_type?: string | null
  call_type?: string | null
  error_code?: string | null
  message?: string | null
  error_message?: string | null
  stacktrace?: string | null
  stack_trace?: string | null
  metadata?: Record<string, any> | null
  restaurant_id?: string | null
  timestamp?: string | null
  created_at?: string | null
}

const MOCK_RESTAURANT_IDS = new Set([
  'a1111111-1111-1111-1111-111111111111',
  'b2222222-2222-2222-2222-222222222222',
  'c3333333-3333-3333-3333-333333333333',
  'd4444444-4444-4444-4444-444444444444',
])

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Sanitiza cualquier objeto de metadatos eliminando ciclos y convirtiendo BigInt/Symbol/Funciones
 * e instancias de Error para evitar que PostgREST/JSON.stringify falle al insertar, preservando DAGs.
 */
function sanitizeMetadata(meta: any): Record<string, any> {
  if (!meta || typeof meta !== 'object') return {}
  if (Array.isArray(meta)) return { items: meta }
  const stack: any[] = []
  try {
    const serialized = JSON.stringify(meta, function (key, value) {
      if (typeof value === 'bigint') return value.toString()
      if (typeof value === 'symbol') return value.toString()
      if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`
      if (typeof value === 'object' && value !== null) {
        while (stack.length > 0 && stack[stack.length - 1] !== this) {
          stack.pop()
        }
        if (stack.includes(value)) {
          return '[Circular]'
        }
        stack.push(value)

        if (value instanceof Error) {
          const errObj: Record<string, any> = {
            ...(value as any),
            name: value.name,
            message: value.message,
            stack: value.stack,
            code: (value as any).code,
            details: (value as any).details,
            hint: (value as any).hint,
          }
          if ((value as any).cause !== undefined) {
            errObj.cause = (value as any).cause
          }
          if ((value as any).status !== undefined) {
            errObj.status = (value as any).status
          }
          if ((value as any).statusCode !== undefined) {
            errObj.statusCode = (value as any).statusCode
          }
          stack.push(errObj)
          return errObj
        }
      }
      return value
    })
    return JSON.parse(serialized)
  } catch {
    return { sanitized_warning: 'Unable to serialize raw metadata' }
  }
}

/**
 * Normaliza cualquier entrada a un string ISO-8601 válido para columnas PostgreSQL timestamp with time zone (previene error 22007)
 */
function safeIsoTimestamp(val: any): string {
  if (val) {
    if (typeof val === 'number' && Number.isFinite(val)) {
      try {
        const d = new Date(val)
        if (!isNaN(d.getTime())) return d.toISOString()
      } catch {}
    } else if (typeof val === 'string') {
      try {
        const d = new Date(val)
        if (!isNaN(d.getTime())) return d.toISOString()
      } catch {}
    } else if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toISOString()
    }
  }
  return new Date().toISOString()
}

/**
 * Garantiza que el valor sea un string seguro para evitar fallos de casteo de tipos en PostgreSQL,
 * tolerando estructuras cíclicas sin degradar a [object Object].
 */
function safeString(val: any, fallback: string = ''): string {
  if (typeof val === 'string') return val
  if (val === null || val === undefined) return fallback
  if (typeof val === 'object') {
    try {
      return JSON.stringify(sanitizeMetadata(val))
    } catch {
      return String(val)
    }
  }
  return String(val)
}

/**
 * Persiste de forma asíncrona un registro de error del sistema en Supabase (system_error_logs)
 * garantizando aislamiento de errores para nunca bloquear o tumbar peticiones de clientes.
 */
export async function recordSystemErrorLog(
  params: RecordSystemErrorLogParams
): Promise<SystemErrorLog | null> {
  try {
    const supabase = createServerClient()
    if (!supabase || !isSupabaseConfigured()) {
      return null
    }

    const cleanMetadata = sanitizeMetadata(params.metadata)

    const now = safeIsoTimestamp(params.timestamp || params.created_at)
    if (params.timestamp && typeof params.timestamp !== 'string') {
      cleanMetadata.raw_timestamp = params.timestamp
    }

    const rawSlug = params.restaurant_slug || params.slug
    const slug = typeof rawSlug === 'string' ? rawSlug : (rawSlug ? safeString(rawSlug) : null)
    const serviceType = safeString(params.service_type || params.call_type, 'service_call')
    const callType = safeString(params.call_type || params.service_type, 'service_call')
    const errorCode = safeString(params.error_code, 'UNKNOWN')
    const message = safeString(params.message || params.error_message, 'Unknown system error')
    const stacktrace = safeString(params.stacktrace || params.stack_trace, '')

    let tableNumber: number | null = null
    if (params.table_number !== undefined && params.table_number !== null) {
      if (typeof params.table_number === 'number' && Number.isFinite(params.table_number)) {
        tableNumber = Math.round(params.table_number)
      } else if (typeof params.table_number === 'string') {
        const parsed = parseInt(params.table_number, 10)
        tableNumber = isNaN(parsed) ? null : parsed
      }
    }

    // Aislamiento de rango integer Postgres (-2147483648 a 2147483647) para prevenir error 22003
    if (tableNumber !== null && (tableNumber > 2147483647 || tableNumber < -2147483648)) {
      cleanMetadata.overflow_table_number = params.table_number
      tableNumber = null
    }

    // Aislamiento de restaurant_id: solo usar UUIDs válidos que no sean mocks para evitar errores 22P02
    let restaurantId: string | null = null
    const candidateId = typeof params.restaurant_id === 'string' ? params.restaurant_id.trim() : null
    if (candidateId && UUID_REGEX.test(candidateId) && !MOCK_RESTAURANT_IDS.has(candidateId)) {
      restaurantId = candidateId
    }

    if (candidateId && candidateId !== restaurantId) {
      cleanMetadata.raw_restaurant_id = candidateId
    }

    const record = {
      timestamp: now,
      created_at: now,
      restaurant_id: restaurantId,
      restaurant_slug: slug,
      slug: slug,
      table_number: tableNumber,
      service_type: serviceType,
      call_type: callType,
      error_code: errorCode,
      message: message,
      error_message: message,
      stacktrace: stacktrace,
      stack_trace: stacktrace,
      metadata: {
        ...cleanMetadata,
        raw_table_number: params.table_number,
      },
    }

    let { data, error } = await supabase
      .from('system_error_logs')
      .insert(record)
      .select('*')
      .single()

    // Si falló por restricción de clave foránea (código Postgres 23503), reintentar sin restaurant_id
    if (error && error.code === '23503' && restaurantId !== null) {
      const fallbackRecord = {
        ...record,
        restaurant_id: null,
        metadata: {
          ...cleanMetadata,
          raw_table_number: params.table_number,
          fk_violation_restaurant_id: restaurantId,
        },
      }
      const retryResult = await supabase
        .from('system_error_logs')
        .insert(fallbackRecord)
        .select('*')
        .single()

      if (!retryResult.error && retryResult.data) {
        return (retryResult.data as SystemErrorLog) || null
      }
    }

    if (error) {
      return null
    }

    return (data as SystemErrorLog) || null
  } catch {
    // Aislamiento completo ante desconexión o fallo de esquema
    return null
  }
}

export const insertSystemErrorLog = recordSystemErrorLog
