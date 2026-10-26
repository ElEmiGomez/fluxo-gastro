import crypto from 'crypto'
import type { NextRequest } from 'next/server'

const SESSION_SECRET = process.env.STAFF_SESSION_SECRET || 'fluxo-staff-secret-key-2026-b2b'
export const CRM_FOUNDER_COOKIE = 'fluxo_founder_session'
export const CRM_SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 días en segundos

const getMasterPins = (): string[] => {
  const customMaster = process.env.MASTER_ADMIN_PIN
  const base = ['4154928']
  if (customMaster && !base.includes(customMaster)) {
    base.push(customMaster)
  }
  return base
}

/**
 * Valida si un PIN corresponde al fundador mediante comparación criptográfica
 * en tiempo constante (timingSafeEqual) para inmunidad contra ataques de temporización.
 */
export function isMasterPinValid(pin: string): boolean {
  if (!pin || typeof pin !== 'string') return false
  const clean = pin.trim()
  if (clean.length < 4 || clean.length > 20) return false

  const pinHash = crypto.createHash('sha256').update(clean).digest()
  const authorizedPins = getMasterPins()

  for (const master of authorizedPins) {
    const masterHash = crypto.createHash('sha256').update(master).digest()
    if (crypto.timingSafeEqual(pinHash, masterHash)) {
      return true
    }
  }

  return false
}

/**
 * Genera una huella digital a partir del User-Agent para ligar la sesión al dispositivo del fundador
 */
function getDeviceFingerprint(userAgent?: string | null): string {
  if (!userAgent) return 'generic'
  return crypto.createHash('sha256').update(userAgent).digest('hex').slice(0, 16)
}

/**
 * Firma un token de sesión de 30 días ligado criptográficamente al dispositivo
 */
export function signFounderSession(userAgent?: string | null): string {
  const fp = getDeviceFingerprint(userAgent)
  const payload = `founder:crm:${Date.now()}:${fp}`
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64url')}.${signature}`
}

/**
 * Verifica la firma, expiración y coincidencia de huella de dispositivo del token
 */
export function verifyFounderSession(token: string, userAgent?: string | null): boolean {
  try {
    if (!token || typeof token !== 'string') return false
    const [encodedPayload, signature] = token.split('.')
    if (!encodedPayload || !signature) return false

    const payload = Buffer.from(encodedPayload, 'base64url').toString()
    const [role, scope, timestampStr, tokenFp] = payload.split(':')

    if (role !== 'founder' || scope !== 'crm') return false

    // 1. Verificación de firma criptográfica HMAC en tiempo constante
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig)) === false) {
      return false
    }

    // 2. Verificación de expiración
    const timestamp = parseInt(timestampStr, 10)
    if (isNaN(timestamp)) return false

    const thirtyDaysMs = CRM_SESSION_MAX_AGE * 1000
    if (Date.now() - timestamp > thirtyDaysMs) {
      return false
    }

    // 3. Verificación de huella de dispositivo (si está disponible)
    if (userAgent && tokenFp && tokenFp !== 'generic') {
      const currentFp = getDeviceFingerprint(userAgent)
      if (currentFp !== tokenFp) {
        return false // Bloqueado: Token extraído o usado desde un dispositivo distinto
      }
    }

    return true
  } catch {
    return false
  }
}

/**
 * Valida si una petición entrante al API tiene autorización estricta de fundador
 */
export function verifyFounderRequest(req: NextRequest | { cookies: { get: (name: string) => { value: string } | undefined }; headers: { get: (name: string) => string | null } }): boolean {
  const userAgent = req.headers.get('user-agent')

  // 1. PIN directo en header (para scripts de test autorizados)
  const pinHeader = req.headers.get('x-founder-pin')
  if (pinHeader && isMasterPinValid(pinHeader)) {
    return true
  }

  // 2. Cookie de sesión de 30 días
  const cookieVal = req.cookies.get(CRM_FOUNDER_COOKIE)?.value
  if (cookieVal && verifyFounderSession(cookieVal, userAgent)) {
    return true
  }

  // 3. Header Authorization Bearer
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim()
    if (verifyFounderSession(bearerToken, userAgent)) {
      return true
    }
  }

  return false
}
