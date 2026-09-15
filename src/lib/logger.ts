import fs from 'fs'
import path from 'path'

export interface ServiceCallLogContext {
  slug?: string
  table_number?: number | string
  call_type?: string
  table_session_id?: string
  endpoint?: string
  clientIp?: string
}

/**
 * Registra errores en la creación o gestión de alertas de servicio (service_calls)
 * generando un archivo diario único por fecha: logs/service-calls-YYYY-MM-DD.log
 */
export function logServiceCallError(
  error: any,
  context: ServiceCallLogContext = {}
): void {
  try {
    const logsDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true })
    }

    const today = new Date().toISOString().split('T')[0]
    const logFilePath = path.join(logsDir, `service-calls-${today}.log`)

    const timestamp = new Date().toISOString()
    const errorCode = error?.code || error?.status || 'UNKNOWN'
    const errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error))
    const errorDetails = error?.details || error?.hint || ''
    const stackTrace = error?.stack || new Error().stack || 'No stack trace available'

    const entryLines = [
      `[${timestamp}] ERROR [ServiceCall:Create]`,
      `Slug: ${context.slug || 'unknown'} | Table: ${context.table_number ?? 'N/A'} | Type: ${context.call_type || 'N/A'}${context.table_session_id ? ` | Session: ${context.table_session_id}` : ''}`,
      `Code: ${errorCode} | Message: ${errorMessage}`,
    ]

    if (errorDetails) {
      entryLines.push(`Details: ${errorDetails}`)
    }

    entryLines.push('Stacktrace:', stackTrace)
    entryLines.push('--------------------------------------------------------------------------------\n')

    fs.appendFileSync(logFilePath, entryLines.join('\n'), 'utf8')
  } catch (logErr) {
    console.error('Failed writing to service call log file:', logErr)
  }
}
