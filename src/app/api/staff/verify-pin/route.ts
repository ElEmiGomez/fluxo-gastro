import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signStaffSession, verifyStaffSession } from '@/lib/auth/pin-security'

// Almacén de intentos para protección anti-fuerza bruta
const failedAttempts = new Map<string, { count: number; lockedUntil: number; lastAttempt: number }>()

export async function POST(req: NextRequest) {
  try {
    const rawForwarded = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const ip = rawForwarded.split(',')[0].trim()
    const now = Date.now()

    const body = await req.json()
    const { role, slug, pin } = body

    const VALID_ROLES = ['admin', 'kitchen', 'comandero']
    if (!role || !VALID_ROLES.includes(role) || !slug || !pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const cleanPin = pin.trim()

    // 1. Blindaje Anti-Fuerza Bruta: Verificar bloqueo ANTES de validar cualquier PIN
    let attemptInfo = failedAttempts.get(ip)
    if (attemptInfo && attemptInfo.lockedUntil > now) {
      const waitSeconds = Math.ceil((attemptInfo.lockedUntil - now) / 1000)
      return NextResponse.json(
        { error: `Demasiados intentos fallidos. Bloqueado temporalmente por ${waitSeconds} segundos.` },
        { status: 429 }
      )
    }

    // Si el tiempo de bloqueo ya expiró o transcurrió la ventana de inactividad (15 min), limpiar intentos
    const INACTIVITY_WINDOW_MS = 15 * 60 * 1000
    if (
      attemptInfo &&
      ((attemptInfo.lockedUntil > 0 && attemptInfo.lockedUntil <= now) ||
       (now - attemptInfo.lastAttempt > INACTIVITY_WINDOW_MS))
    ) {
      failedAttempts.delete(ip)
      attemptInfo = undefined
    }

    // 2. Validación de PIN según rol asignado (con soporte de Master PINs)
    const isPinAuthorized = (
      cleanPin === '4154928' ||
      cleanPin === '9999' ||
      (role === 'admin' && cleanPin === '1234') ||
      (role === 'kitchen' && cleanPin === '5678') ||
      (role === 'comandero' && cleanPin === '1234')
    )

    if (isPinAuthorized) {
      failedAttempts.delete(ip)
      const sessionToken = signStaffSession(slug, role)
      const response = NextResponse.json({ success: true, message: 'Autenticación exitosa', token: sessionToken })
      response.cookies.set(`staff_session_${slug}_${role}`, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 12 * 60 * 60, // 12 horas de turno
      })
      response.cookies.set('flusso_staff_auth', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 12 * 60 * 60,
      })
      return response
    }

    // Limpieza preventiva de memoria si el mapa crece en exceso
    if (failedAttempts.size > 2000) {
      failedAttempts.forEach((val, key) => {
        if ((val.lockedUntil > 0 && val.lockedUntil <= now) || (now - val.lastAttempt > INACTIVITY_WINDOW_MS)) {
          failedAttempts.delete(key)
        }
      })
    }

    // 3. Si el PIN fue incorrecto para el rol solicitado, incrementar contador y bloquear si alcanza el umbral
    const current = attemptInfo ? attemptInfo.count : 0
    const nextCount = current + 1
    const isLocked = nextCount >= 5
    failedAttempts.set(ip, {
      count: nextCount,
      lockedUntil: isLocked ? now + 60 * 1000 : 0, // 1 minuto de bloqueo tras 5 fallos
      lastAttempt: now,
    })

    return NextResponse.json(
      { error: 'PIN incorrecto. Intenta nuevamente.', remaining: Math.max(0, 5 - nextCount) },
      { status: 401 }
    )
  } catch (err: any) {
    console.error('Error en verificación de PIN:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET() {
  // Siempre requiere ingresar el PIN explícitamente en cada acceso
  return NextResponse.json({ authenticated: false }, { status: 401 })
}
