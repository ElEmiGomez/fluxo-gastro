import fs from 'fs'
import path from 'path'
import { recordSystemErrorLog } from './supabase/error-logs'

export interface ServiceCallLogContext {
  slug?: string
  restaurant_slug?: string
  table_number?: number | string
  call_type?: string
  service_type?: string
  table_session_id?: string
  endpoint?: string
  clientIp?: string
  [key: string]: any
}

export interface StructuredServiceErrorLog {
  level: 'error'
  type: string
  timestamp: string
  service: string
  restaurant_slug: string
  table_number: number | string | null
  service_type: string
  call_type: string
  error_code: string
  message: string
  details?: string
  stacktrace?: string
  context: ServiceCallLogContext
  environment: string
}

/**
 * Serializa de forma segura cualquier estructura a JSON tolerando referencias circulares, BigInt, Symbol, funciones
 * e instancias de Error, preservando grafos acíclicos dirigidos (DAGs) y propiedades críticas de errores.
 */
export function safeJsonStringify(obj: any, indent?: number): string {
  const stack: any[] = []
  try {
    return JSON.stringify(
      obj,
      function (key, value) {
        if (typeof value === 'bigint') {
          return value.toString()
        }
        if (typeof value === 'symbol') {
          return value.toString()
        }
        if (typeof value === 'function') {
          return `[Function: ${value.name || 'anonymous'}]`
        }
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
      },
      indent
    )
  } catch {
    try {
      return String(obj)
    } catch {
      return '[Unserializable Payload]'
    }
  }
}

/**
 * Normaliza la información de un error capturado de forma resiliente contra referencias circulares y tipos arbitrarios
 */
export function extractErrorInfo(error: any): {
  code: string
  message: string
  details: string
  stack: string
} {
  if (error === null || error === undefined) {
    return {
      code: 'UNKNOWN',
      message: 'Unknown Error (null or undefined)',
      details: '',
      stack: new Error().stack || 'No stack trace available',
    }
  }

  let code = 'UNKNOWN'
  if (error?.code !== undefined && error?.code !== null) {
    const rawCode = typeof error.code === 'string'
      ? error.code
      : (typeof error.code === 'object' ? safeJsonStringify(error.code) : String(error.code))
    code = rawCode.trim().length > 0 ? rawCode.trim() : 'UNKNOWN'
  } else if (error?.status !== undefined && error?.status !== null) {
    const rawStatus = String(error.status).trim()
    code = rawStatus.length > 0 ? rawStatus : 'UNKNOWN'
  } else if (error?.statusCode !== undefined && error?.statusCode !== null) {
    const rawStatusCode = String(error.statusCode).trim()
    code = rawStatusCode.length > 0 ? rawStatusCode : 'UNKNOWN'
  }

  let message = ''
  if (typeof error?.message === 'string' && error.message.trim().length > 0) {
    message = error.message
  } else if (typeof error?.message === 'object' && error.message !== null) {
    message = safeJsonStringify(error.message)
  } else if (typeof error === 'string' && error.trim().length > 0) {
    message = error
  } else if (error instanceof Error && error.name) {
    message = error.message && error.message.trim().length > 0 ? error.message : error.name
  } else {
    try {
      const stringified = safeJsonStringify(error)
      message = stringified !== '{}' ? stringified : (error?.name || String(error))
    } catch {
      message = String(error)
    }
  }

  const rawDetails = error?.details !== undefined && error?.details !== null
    ? (typeof error.details === 'string' ? error.details : safeJsonStringify(error.details))
    : ''
  const rawHint = error?.hint !== undefined && error?.hint !== null
    ? (typeof error.hint === 'string' ? error.hint : safeJsonStringify(error.hint))
    : ''

  let details = ''
  if (rawDetails && rawHint) {
    details = `${rawDetails} (Hint: ${rawHint})`
  } else {
    details = rawDetails || rawHint || ''
  }

  let stack = 'No stack trace available'
  if (typeof error?.stack === 'string') {
    stack = error.stack
  } else if (error?.stack) {
    stack = safeJsonStringify(error.stack)
  } else {
    stack = new Error().stack || 'No stack trace available'
  }

  return { code, message, details, stack }
}

/**
 * Comprueba si el entorno de ejecución actual corresponde a producción o Vercel Serverless
 */
export function isServerlessOrProduction(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.VERCEL_ENV) ||
    Boolean(process.env.VERCEL_REGION) ||
    Boolean(process.env.NOW_REGION) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT)
  )
}

/**
 * Escribe log en disco local de forma resiliente única y exclusivamente en desarrollo local.
 */
export function writeLocalDiskLogFallback(
  timestamp: string,
  restaurantSlug: string,
  tableNumber: number | string | null,
  serviceType: string,
  code: string,
  message: string,
  details: string,
  stack: string,
  tableSessionId?: string
): void {
  if (isServerlessOrProduction() || process.env.NODE_ENV !== 'development') {
    return
  }

  try {
    const logsDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }

    const today = timestamp.split('T')[0]
    const logFilePath = path.join(logsDir, `service-calls-${today}.log`)

    const entryLines = [
      `[${timestamp}] ERROR [ServiceCall:Create]`,
      `Slug: ${restaurantSlug} | Table: ${tableNumber ?? 'N/A'} | Type: ${serviceType}${tableSessionId ? ` | Session: ${tableSessionId}` : ''}`,
      `Code: ${code} | Message: ${message}`,
    ]

    if (details) {
      entryLines.push(`Details: ${details}`)
    }

    entryLines.push('Stacktrace:', stack)
    entryLines.push('--------------------------------------------------------------------------------\n')

    fs.appendFileSync(logFilePath, entryLines.join('\n'), 'utf8')
  } catch {
    // Ignora silenciosamente si el filesystem es de solo lectura o no editable
  }
}

/**
 * Registra errores en la creación o gestión de alertas de servicio (service_calls):
 * 1. Emite JSON estructurado nativo en console.error para el Log Viewer de Vercel (eliminando fallos EROFS).
 * 2. Persiste asíncronamente en Supabase (system_error_logs) sin bloquear las respuestas a clientes.
 * 3. En desarrollo local (NODE_ENV === 'development'), mantiene append en archivo de disco si es editable.
 * 4. En producción/Vercel, NO ejecuta fs.appendFileSync en filesystems de solo lectura.
 */
export function logServiceCallError(
  error: any,
  context: ServiceCallLogContext = {}
): void {
  try {
    const timestamp = new Date().toISOString()
    const { code, message, details, stack } = extractErrorInfo(error)

    const restaurantSlug = context.slug || context.restaurant_slug || 'unknown'
    const serviceType = context.call_type || context.service_type || 'service_call'
    const tableNumber = context.table_number !== undefined && context.table_number !== null ? context.table_number : null

    // =========================================================================
    // 1. VERCEL NATIVE STRUCTURED RUNTIME LOGGING (STREAM TO STDERR)
    // =========================================================================
    const structuredPayload: StructuredServiceErrorLog = {
      level: 'error',
      type: 'ServiceCallError',
      timestamp,
      service: 'fluxo-service-calls',
      restaurant_slug: restaurantSlug,
      table_number: tableNumber,
      service_type: serviceType,
      call_type: context.call_type || serviceType,
      error_code: code,
      message,
      details: details || undefined,
      stacktrace: stack,
      context: {
        ...context,
        slug: restaurantSlug,
      },
      environment: process.env.NODE_ENV || 'development',
    }

    // Salida en formato JSON parseable para Vercel Runtime Logs con tolerancia circular y DAGs
    console.error(safeJsonStringify(structuredPayload))

    // =========================================================================
    // 2. DUAL-ENVIRONMENT: LOCAL DISK FALLBACK (SOLO EN DESARROLLO LOCAL)
    // =========================================================================
    writeLocalDiskLogFallback(
      timestamp,
      restaurantSlug,
      tableNumber,
      serviceType,
      code,
      message,
      details,
      stack,
      context.table_session_id
    )

    // =========================================================================
    // 3. PERSISTENCIA EN CLOUD (SUPABASE system_error_logs) ASÍNCRONA Y NO BLOQUEANTE
    // =========================================================================
    // Se despacha en segundo plano con aislamiento total de excepciones
    recordSystemErrorLog({
      restaurant_id: context.restaurant_id,
      restaurant_slug: restaurantSlug,
      slug: restaurantSlug,
      table_number: context.table_number,
      service_type: serviceType,
      call_type: context.call_type || serviceType,
      error_code: code,
      message,
      error_message: message,
      stacktrace: stack,
      stack_trace: stack,
      metadata: {
        ...context,
        error_details: details,
      },
      timestamp,
      created_at: timestamp,
    }).catch((dbErr) => {
      // Si la persistencia en base de datos falla, el flujo de cliente y runtime logs quedan intactos
      console.warn('[Logger] Persistencia asíncrona en system_error_logs falló:', dbErr?.message || dbErr)
    })
  } catch (fatalLoggerErr) {
    // Aislamiento total: el logger nunca debe derribar la ejecución de una petición
    console.error('CRITICAL: Fallo interno en subsistema de logging:', fatalLoggerErr)
  }
}

/**
 * Helper asíncrono para casos de prueba o invocaciones donde se desee esperar la inserción en DB
 */
export async function logServiceCallErrorAsync(
  error: any,
  context: ServiceCallLogContext = {}
): Promise<any> {
  try {
    const timestamp = new Date().toISOString()
    const { code, message, details, stack } = extractErrorInfo(error)

    const restaurantSlug = context.slug || context.restaurant_slug || 'unknown'
    const serviceType = context.call_type || context.service_type || 'service_call'
    const tableNumber = context.table_number !== undefined && context.table_number !== null ? context.table_number : null

    const structuredPayload: StructuredServiceErrorLog = {
      level: 'error',
      type: 'ServiceCallError',
      timestamp,
      service: 'fluxo-service-calls',
      restaurant_slug: restaurantSlug,
      table_number: tableNumber,
      service_type: serviceType,
      call_type: context.call_type || serviceType,
      error_code: code,
      message,
      details: details || undefined,
      stacktrace: stack,
      context: {
        ...context,
        slug: restaurantSlug,
      },
      environment: process.env.NODE_ENV || 'development',
    }

    console.error(safeJsonStringify(structuredPayload))

    // Paridad dual-environment: también registra en disco local si está en desarrollo
    writeLocalDiskLogFallback(
      timestamp,
      restaurantSlug,
      tableNumber,
      serviceType,
      code,
      message,
      details,
      stack,
      context.table_session_id
    )

    return await recordSystemErrorLog({
      restaurant_id: context.restaurant_id,
      restaurant_slug: restaurantSlug,
      slug: restaurantSlug,
      table_number: context.table_number,
      service_type: serviceType,
      call_type: context.call_type || serviceType,
      error_code: code,
      message,
      error_message: message,
      stacktrace: stack,
      stack_trace: stack,
      metadata: {
        ...context,
        error_details: details,
      },
      timestamp,
      created_at: timestamp,
    })
  } catch {
    return null
  }
}
