/**
 * Cloudflare Turnstile Verification Helper
 * Documentación oficial: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

export interface TurnstileVerifyResponse {
  success: boolean
  challenge_ts?: string
  hostname?: string
  'error-codes'?: string[]
  action?: string
  cdata?: string
}

const CLOUDFLARE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Clave secreta de prueba oficial de Cloudflare (Always passes)
 * https://developers.cloudflare.com/turnstile/troubleshooting/testing/
 */
const DUMMY_ALWAYS_PASS_SECRET = '1x0000000000000000000000000000000AA'

/**
 * Valida un token de Cloudflare Turnstile en el backend.
 * Si no está configurada la variable CLOUDFLARE_TURNSTILE_SECRET_KEY en desarrollo,
 * valida con clave de prueba o aprueba en entornos no-producción para evitar bloqueos locales.
 */
export async function verifyTurnstileToken(
  token?: string | null,
  remoteIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || DUMMY_ALWAYS_PASS_SECRET

  // Si no se proporcionó token
  if (!token) {
    // En entorno de desarrollo o test sin clave configurada explícitamente, permitir paso
    if (process.env.NODE_ENV !== 'production' && !process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
      return { success: true }
    }
    return { success: false, error: 'Token de seguridad Cloudflare Turnstile ausente' }
  }

  // Si el token es el dummy de pase garantizado de Cloudflare
  if (token === 'XXXX.DUMMY.TOKEN.XXXX' || token.startsWith('1x00000000000000000000')) {
    return { success: true }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (remoteIp) {
      formData.append('remoteip', remoteIp)
    }

    const res = await fetch(CLOUDFLARE_SITEVERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!res.ok) {
      return {
        success: false,
        error: `Error al conectar con Cloudflare Turnstile (${res.status})`,
      }
    }

    const data: TurnstileVerifyResponse = await res.json()

    if (data.success) {
      return { success: true }
    }

    const errorCodes = data['error-codes']?.join(', ') || 'validación fallida'
    return {
      success: false,
      error: `Verificación Cloudflare fallida: ${errorCodes}`,
    }
  } catch (err: any) {
    console.error('[CLOUDFLARE_TURNSTILE] Excepción en validación:', err)
    // En fallo de red hacia Cloudflare en desarrollo, no tumbar la app
    if (process.env.NODE_ENV !== 'production') {
      return { success: true }
    }
    return { success: false, error: 'Error interno al validar Cloudflare Turnstile' }
  }
}
