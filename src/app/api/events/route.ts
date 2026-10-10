import { NextRequest } from 'next/server'
import { registerSSEClient } from '@/lib/server-state'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // En producción serverless (Vercel), mantener streams de larga duración (SSE) consume
  // cuotas de Fluid Compute exponencialmente. La sincronización en producción es manejada
  // directamente por WebSockets de Supabase Realtime hacia el navegador del cliente.
  if (process.env.NODE_ENV === 'production') {
    return new Response(JSON.stringify({
      status: 'disabled',
      message: 'SSE streaming deshabilitado en producción serverless. Usar Supabase Realtime.',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Enviar evento inicial de conexión
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))

      const unregister = registerSSEClient((data: string) => {
        try {
          controller.enqueue(encoder.encode(data))
        } catch {
          // stream cerrado
        }
      })

      req.signal.addEventListener('abort', () => {
        unregister()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
