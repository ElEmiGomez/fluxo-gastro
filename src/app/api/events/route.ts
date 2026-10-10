import { NextRequest } from 'next/server'
import { registerSSEClient } from '@/lib/server-state'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // En producción (Vercel) un stream abierto mantiene la función activa y consume cuota.
  // La sincronización en producción la hace Supabase Realtime directamente desde el navegador.
  // Al responder con JSON (no text/event-stream), el EventSource del cliente se cierra y no reconecta.
  if (process.env.NODE_ENV === 'production') {
    return new Response(JSON.stringify({ status: 'disabled' }), {
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
