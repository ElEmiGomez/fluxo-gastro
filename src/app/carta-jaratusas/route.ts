import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

/**
 * Ruta pública de la Carta Digital Fija de Bar Jaratusas (/carta-jaratusas).
 * Sirve el HTML completo y autónomo con la identidad oficial y selección gastronómica.
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'jaratusas.html')
    const htmlContent = fs.readFileSync(filePath, 'utf-8')

    return new Response(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Error cargando carta de Bar Jaratusas', details: err?.message },
      { status: 500 }
    )
  }
}
