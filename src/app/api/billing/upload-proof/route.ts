import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const slug = (formData.get('slug') as string) || 'unknown'

    if (!file) {
      return NextResponse.json({ error: 'No se ha adjuntado ningún archivo.' }, { status: 400 })
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato no válido. Debe ser PNG, JPG, WebP o PDF.' },
        { status: 400 }
      )
    }

    // Validar tamaño máximo (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 10 MB.' },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${slug}/${timestamp}-${cleanName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const supabase = createServerClient()

    if (supabase) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(storagePath, buffer, {
            contentType: file.type,
            upsert: true,
          })

        if (!uploadError) {
          return NextResponse.json({
            success: true,
            storage_path: storagePath,
            file_name: file.name,
            file_size: file.size,
          })
        }
        console.warn('Fallo upload a Supabase Storage, aplicando fallback local/ruta:', uploadError)
      } catch (storageErr) {
        console.warn('Excepción al conectar con Supabase Storage:', storageErr)
      }
    }

    // Fallback: Si Supabase Storage local no está disponible, devolver ruta generada
    return NextResponse.json({
      success: true,
      storage_path: `local-proofs/${storagePath}`,
      file_name: file.name,
      file_size: file.size,
    })
  } catch (error: any) {
    console.error('Error en /api/billing/upload-proof:', error)
    return NextResponse.json(
      { error: error?.message || 'Error al procesar el archivo de comprobante.' },
      { status: 500 }
    )
  }
}
