import { NextRequest, NextResponse } from 'next/server'
import {
  resolveSlugByDomain,
  normalizeHostname,
  isPlatformHost,
} from '@/lib/domain-resolver'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const pathname = url.pathname

  // 1. Obtención del host efectivo (soporta simulación por query ?domain=... o header x-custom-domain)
  const hostHeader = request.headers.get('x-custom-domain') || request.headers.get('host') || ''
  const domainQuery = url.searchParams.get('domain')
  const effectiveHost = domainQuery ? normalizeHostname(domainQuery) : normalizeHostname(hostHeader)

  // 2. Si es host nativo de la plataforma y NO hay parámetro de simulación, continuar sin reescribir
  if (!domainQuery && isPlatformHost(effectiveHost)) {
    return NextResponse.next()
  }

  // 3. Resolver el slug asociado al dominio personalizado
  const slug = await resolveSlugByDomain(effectiveHost)

  if (!slug) {
    return NextResponse.next()
  }

  // 4. Reescribir rutas manteniendo el dominio del restaurante en la barra de direcciones:
  // - '/' -> '/web/[slug]' (Web Home Cinemática)
  // - '/carta' o '/menu' -> '/p/[slug]' (Carta QR Interactiva)
  let rewriteUrl: URL | null = null

  if (pathname === '/' || pathname === '') {
    rewriteUrl = new URL(`/web/${slug}`, request.url)
  } else if (pathname === '/carta' || pathname === '/menu') {
    rewriteUrl = new URL(`/p/${slug}`, request.url)
  }

  if (rewriteUrl) {
    // Preservar parámetros de búsqueda si existen
    url.searchParams.forEach((val, key) => {
      if (key !== 'domain') {
        rewriteUrl!.searchParams.set(key, val)
      }
    })

    const response = NextResponse.rewrite(rewriteUrl)
    response.headers.set('x-fluxo-tenant', slug)
    response.headers.set('x-resolved-domain', effectiveHost)
    return response
  }

  const response = NextResponse.next()
  response.headers.set('x-fluxo-tenant', slug)
  return response
}

export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas excepto:
     * - api (rutas de backend)
     * - _next/static (archivos estáticos compilados)
     * - _next/image (optimización de imágenes)
     * - favicon.ico y recursos con extensiones estáticas
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
