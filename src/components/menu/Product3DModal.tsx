'use client'

import React from 'react'
import { X, Box, Smartphone, Sparkles, AlertCircle } from 'lucide-react'
import { Product } from '@/types/database.types'

interface Product3DModalProps {
  product: Product | null
  onClose: () => void
}

export function Product3DModal({ product, onClose }: Product3DModalProps) {
  if (!product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-xl text-white shadow-sm"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            >
              <Box className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Vista 3D & Realidad Aumentada
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-[220px]">
                {product.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Canvas / Viewer Area */}
        <div className="relative h-72 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center border-b border-slate-800">
          {/* Animación de wireframe 3D interactivo */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ backgroundColor: 'var(--brand-primary)' }}
            />
            <div
              className="w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center shadow-lg animate-bounce"
              style={{
                borderColor: 'var(--brand-primary)',
                backgroundColor: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)',
              }}
            >
              <Box className="w-12 h-12 text-slate-200" />
            </div>
          </div>

          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Modelo 3D Listo para Renderizado AR
            </span>
            <p className="text-xs text-slate-400 mt-2">
              Recurso conectado:{' '}
              <code className="text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">
                {product.model_3d_url ? 'Model GLB/USDZ detectado' : 'Placeholder 3D Activo'}
              </code>
            </p>
          </div>
        </div>

        {/* Botones de interacción AR */}
        <div className="p-4 bg-slate-900/90 space-y-3">
          <button
            onClick={() => {
              alert('Activando cámara AR del dispositivo (soporte WebXR / QuickLook iOS)...')
            }}
            className="w-full py-3 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            <Smartphone className="w-5 h-5" />
            Ver en tu Mesa con Realidad Aumentada (AR)
          </button>

          <div className="flex items-start gap-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 text-[11px] text-slate-300">
            <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              Arquitectura escalable: el campo <code className="text-amber-300">model_3d_url</code> permite cargar archivos <code className="text-slate-200">.glb</code> para Android y <code className="text-slate-200">.usdz</code> para iOS.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
