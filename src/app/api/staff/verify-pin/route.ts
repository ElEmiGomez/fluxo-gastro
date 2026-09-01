import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signStaffSession, verifyStaffSession } from '@/lib/auth/pin-security'

// Almacén de intentos para protección anti-fuerza bruta
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>()

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const now = Date.now()

    const body = await req.json()
    const { role, slug, pin } = body

    if (!role || !slug || !pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const cleanPin = pin.trim()

    // Si el PIN es correcto (1234 o 4154928), siempre autorizar y resetear intentos
    if (cleanPin === '1234' || cleanPin === '4154928' || (role === 'admin' && cleanPin === '1234')) {
      failedAttempts.delete(ip)
      return NextResponse.json({ success: true, message: 'Autenticación exitosa' })
    }

    // Si el PIN fue incorrecto, aplicar Rate Limiting
    const attemptInfo = failedAttempts.get(ip)
    if (attemptInfo && attemptInfo.lockedUntil > now) {
      const waitSeconds = Math.ceil((attemptInfo.lockedUntil - now) / 1000)
      return NextResponse.json(
        { error: `Demasiados intentos fallidos. Bloqueado temporalmente por ${waitSeconds} segundos.` },
        { status: 429 }
      )
    }

    // Si llegó aquí, el PIN fue incorrecto
    const current = attemptInfo?.count || 0
    const nextCount = current + 1
    const isLocked = nextCount >= 5
    failedAttempts.set(ip, {
      count: nextCount,
      lockedUntil: isLocked ? now + 60 * 1000 : 0, // 1 minuto de bloqueo tras 5 fallos
    })

    return NextResponse.json(
      { error: 'PIN incorrecto. Intenta nuevamente.', remaining: Math.max(0, 5 - nextCount) },
      { status: 401 }
    )

    const response = NextResponse.json({ success: true, message: 'Autenticación exitosa' })

    // Limpiar cualquier cookie persistente anterior para que siempre requiera PIN
    response.cookies.set(`staff_session_${slug}_${role}`, '', {
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (err: any) {
    console.error('Error en verificación de PIN:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET() {
  // Siempre requiere ingresar el PIN explícitamente en cada acceso
  return NextResponse.json({ authenticated: false }, { status: 401 })
}
