import { NextRequest, NextResponse } from 'next/server'
import {
  isMasterPinValid,
  signFounderSession,
  verifyFounderRequest,
  CRM_FOUNDER_COOKIE,
  CRM_SESSION_MAX_AGE
} from '@/lib/auth/crm-auth'

export async function GET(req: NextRequest) {
  const isAuth = verifyFounderRequest(req)
  return NextResponse.json({ authenticated: isAuth })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pin } = body

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN requerido' }, { status: 400 })
    }

    if (!isMasterPinValid(pin)) {
      return NextResponse.json({ error: 'PIN de Fundador incorrecto' }, { status: 401 })
    }

    const token = signFounderSession()
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
