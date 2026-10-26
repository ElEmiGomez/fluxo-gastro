import { NextRequest, NextResponse } from 'next/server'
import {
  isMasterPinValid,
  signFounderSession,
  verifyFounderRequest,
  CRM_FOUNDER_COOKIE,
  CRM_SESSION_MAX_AGE
} from '@/lib/auth/crm-auth'

// Almacén en memoria para defensa anti-fuerza bruta
const failedFounderAttempts = new Map<string, { count: number; lockedUntil: number; lastAttempt: number }>()

export async function GET(req: NextRequest) {
  const isAuth = verifyFounderRequest(req)
  return NextResponse.json({ authenticated: isAuth })
}

export async function POST(req: NextRequest) {
  const rawForwarded = req.headers.get('x-forwarded-for') || '127.0.0.1'
  const ip = rawForwarded.split(',')[0].trim()
  const now = Date.now()

  // 1. Blindaje Anti-Fuerza Bruta: Verificar bloqueo temporal
  const attemptInfo = failedFounderAttempts.get(ip)
  if (attemptInfo && attemptInfo.lockedUntil > now) {
    const waitSeconds = Math.ceil((attemptInfo.lockedUntil - now) / 1000)
    return NextResponse.json(
      { error: `Demasiados intentos fallidos. Acceso bloqueado por seguridad (${waitSeconds}s restantes).` },
      { status: 429 }
    )
  }

  // Limpiar intentos si ya venció la ventana de bloqueo o inactividad (15 min)
  if (
    attemptInfo &&
    ((attemptInfo.lockedUntil > 0 && attemptInfo.lockedUntil <= now) ||
     (now - attemptInfo.lastAttempt > 15 * 60 * 1000))
  ) {
    failedFounderAttempts.delete(ip)
  }

  try {
    const body = await req.json()
    const { pin } = body

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'Parámetros no válidos' }, { status: 400 })
    }

    // 2. Validación de PIN con comparación en tiempo constante
    if (!isMasterPinValid(pin)) {
      // Registrar intento fallido
      const current = failedFounderAttempts.get(ip) || { count: 0, lockedUntil: 0, lastAttempt: now }
      current.count += 1
      current.lastAttempt = now

      // Si supera 5 intentos fallidos, bloquear durante 15 minutos
      if (current.count >= 5) {
        current.lockedUntil = now + 15 * 60 * 1000
      }
      failedFounderAttempts.set(ip, current)

      // Retardo deliberado de 200ms para neutralizar ataques automatizados de temporización
      await new Promise((res) => setTimeout(res, 200))

      const remaining = Math.max(0, 5 - current.count)
      return NextResponse.json(
        {
          error: current.count >= 5
            ? 'Acceso bloqueado por 15 minutos debido a múltiples intentos erróneos.'
            : `PIN incorrecto. Intentos restantes antes del bloqueo: ${remaining}`
        },
        { status: 401 }
      )
    }

    // PIN correcto: Resetear intentos fallidos
    failedFounderAttempts.delete(ip)

    const userAgent = req.headers.get('user-agent')
    const token = signFounderSession(userAgent)
    const res = NextResponse.json({ success: true, token, message: 'Acceso autorizado como Fundador' })

    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https'

    res.cookies.set(CRM_FOUNDER_COOKIE, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: CRM_SESSION_MAX_AGE,
    })

    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error de procesamiento' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true, message: 'Sesión de Fundador cerrada' })
  res.cookies.set(CRM_FOUNDER_COOKIE, '', {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
