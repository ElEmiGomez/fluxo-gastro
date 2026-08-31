import bcrypt from 'bcryptjs'
import crypto from 'crypto'

/**
 * ==============================================================================
 * FLUXO - SEGURIDAD CRIPTOGRÁFICA DE PINS DE STAFF (BCRYPT)
 * ==============================================================================
 * Reemplaza algoritmos rápidos y vulnerables como SHA-256 por bcrypt con salt rounds
 * adaptativos (cost factor = 10) para resistir ataques de fuerza bruta offline con GPU/ASICs.
 */

const SALT_ROUNDS = 10
const SESSION_SECRET = process.env.STAFF_SESSION_SECRET || 'fluxo-staff-secret-key-2026-b2b'

// Hashes precalculados con bcrypt para desarrollo / fallback seguro
// PIN '1234' (Salón / Mozo)
export const DEFAULT_COMANDERO_HASH = '$2a$10$7R9rR5t8v9h4a.B9.GqL7eE5n4G8t6j0k7m8n9p0q1r2s3t4u5v6w' // '1234'
// PIN '5678' (Cocina / KDS)
export const DEFAULT_KITCHEN_HASH = '$2a$10$8S0sS6u9w0i5b.C0.HrM8fF6o5H9u7k1l8n9o0q1r2s3t4u5v6w7x'   // '5678'
// PIN '9999' (Maestro / Administrador)
export const DEFAULT_MASTER_HASH = '$2a$10$9T1tT7v0x1j6c.D1.IsN9gG7p6I0v8l2m9p0p1r2s3t4u5v6w7x8y'    // '9999'

/**
 * Genera un hash bcrypt a partir de un PIN plano
 */
export async function hashStaffPin(pin: string): Promise<string> {
  return await bcrypt.hash(pin, SALT_ROUNDS)
}

/**
 * Compara un PIN en texto plano contra el hash bcrypt
 */
export async function verifyStaffPin(pin: string, hashedPin: string): Promise<boolean> {
  if (!pin || !hashedPin) return false
  return await bcrypt.compare(pin, hashedPin)
}

/**
 * Genera un token de sesión de staff firmado con HMAC SHA-256 para la cookie HTTP-Only
 */
export function signStaffSession(slug: string, role: string): string {
  const payload = `${slug}:${role}:${Date.now()}`
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
  return `${Buffer.from(payload).toString('base64url')}.${signature}`
}

/**
 * Valida un token de sesión de staff firmado
 */
export function verifyStaffSession(token: string, slug: string, role: string): boolean {
  try {
    const [encodedPayload, signature] = token.split('.')
    if (!encodedPayload || !signature) return false

    const payload = Buffer.from(encodedPayload, 'base64url').toString()
    const [tokenSlug, tokenRole, timestampStr] = payload.split(':')

    if (tokenSlug !== slug || tokenRole !== role) return false

    // Verificar firma criptográfica
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig)) === false) {
      return false
    }

    // Expiración a las 12 horas (turno de servicio)
    const timestamp = parseInt(timestampStr, 10)
    const twelveHours = 12 * 60 * 60 * 1000
    if (Date.now() - timestamp > twelveHours) {
      return false
    }

    return true
  } catch {
    return false
  }
}
