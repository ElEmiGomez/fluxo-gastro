import crypto from 'crypto'
import type { NextRequest } from 'next/server'

const SESSION_SECRET = process.env.STAFF_SESSION_SECRET || 'fluxo-staff-secret-key-2026-b2b'
export const CRM_FOUNDER_COOKIE = 'fluxo_founder_session'
export const CRM_SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 días en segundos

const getMasterPins = (): string[] => {
  const customMaster = process.env.MASTER_ADMIN_PIN
  const base = ['9999', '4154928']
  if (customMaster && !base.includes(customMaster)) {
    base.push(customMaster)
  }
  return base
}

/**
 * Valida si un PIN corresponde al fundador/master
 */
export function isMasterPinValid(pin: string): boolean {
  if (!pin) return false
  const clean = pin.trim()
  return getMasterPins().includes(clean)
}

/**
 * Firma un token de sesión de 30 días para el fundador
 */
export function signFounderSession(): string {
  const payload = `founder:crm:${Date.now()}`
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64url')}.${signature}`
}

/**
 * Verifica la validez y expiración del token de sesión del fundador
 */
export function verifyFounderSession(token: string): boolean {
  try {
    if (!token || typeof token !== 'string') return false
    const [encodedPayload, signature] = token.split('.')
    if (!encodedPayload || !signature) return false

    const payload = Buffer.from(encodedPayload, 'base64url').toString()
    const [role, scope, timestampStr] = payload.split(':')

    if (role !== 'founder' || scope !== 'crm') return false

    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig)) === false) {
      return false
    }

    const timestamp = parseInt(timestampStr, 10)
    if (isNaN(timestamp)) return false

    // 30 días de duración
    const thirtyDaysMs = CRM_SESSION_MAX_AGE * 1000
    if (Date.now() - timestamp > thirtyDaysMs) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Valida si una petición entrante al API tiene autorización de fundador
 */
export function verifyFounderRequest(req: NextRequest | { cookies: { get: (name: string) => { value: string } | undefined }; headers: { get: (name: string) => string | null } }): boolean {
  // 1. PIN directo en header (para scripts, tests y bypass inmediato)
  const pinHeader = req.headers.get('x-founder-pin')
  if (pinHeader && isMasterPinValid(pinHeader)) {
    return true
  }

  // 2. Cookie de sesión de 30 días
  const cookieVal = req.cookies.get(CRM_FOUNDER_COOKIE)?.value
  if (cookieVal && verifyFounderSession(cookieVal)) {
    return true
  }

  // 3. Header Authorization Bearer
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim()
    if (verifyFounderSession(bearerToken)) {
      return true
    }
  }

  return false
}
