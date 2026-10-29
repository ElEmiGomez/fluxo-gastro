'use client'

import React, { useState } from 'react'
import {
  X,
  QrCode,
  Phone,
  Mail,
  Globe,
  Share2,
  Copy,
  CheckCircle2,
  Download,
  Sparkles,
  MapPin,
  MessageCircle
} from 'lucide-react'
import { FluxoLogo } from '@/components/common/FluxoLogo'

interface CRMContactCardModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CRMContactCardModal({ isOpen, onClose }: CRMContactCardModalProps) {
  if (!isOpen) return null

  const [copiedSpain, setCopiedSpain] = useState(false)
  const [copiedWA, setCopiedWA] = useState(false)

  const founderData = {
    name: 'Emiliano Gomez',
    role: 'Fundador & CEO',
    company: 'Fluxo — Gastronomic System',
    location: 'Noia, Galicia',
    phoneSpain: '+34 711 573 870',      // Llamadas directas en España (sin WhatsApp)
    whatsappArg: '+54 358 518 7430',    // WhatsApp
    rawWhatsappArg: '5493585187430',    // Formato wa.me oficial
    email: 'contactofluxosystem@gmail.com',
    web: 'https://fluxo-gastro.vercel.app/contacto',
  }

  // Formato vCard estándar para descarga .vcf con ambos teléfonos
  const vCardContent = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${founderData.name}`,
    `ORG:${founderData.company}`,
    `TITLE:${founderData.role}`,
    `item1.TEL:${founderData.phoneSpain}`,
    'item1.X-ABLabel:Llamadas (España)',
    `item2.TEL:+54 9 358 518-7430`,
    'item2.X-ABLabel:WhatsApp',
    `EMAIL:${founderData.email}`,
    `URL:https://fluxo-gastro.vercel.app/contacto`,
    'ADR;TYPE=WORK:;;Noia;A Coruña;;Galicia;España',
    `NOTE:CEO de Fluxo — Digitalización gastronómica. Tel España: ${founderData.phoneSpain} | WhatsApp: ${founderData.whatsappArg}`,
    'END:VCARD',
  ].join('\n')

  // El QR apunta a la página móvil /contacto para que el hostelero elija abrir WhatsApp o guardar
  const targetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/contacto`
    : 'https://fluxo-gastro.vercel.app/contacto'

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
    targetUrl
  )}`

  const handleCopySpain = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(founderData.phoneSpain)
      setCopiedSpain(true)
      setTimeout(() => setCopiedSpain(false), 2000)
    }
  }

  const handleCopyWA = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(founderData.whatsappArg)
      setCopiedWA(true)
      setTimeout(() => setCopiedWA(false), 2000)
    }
  }

  const handleDownloadVcf = () => {
    const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Emiliano_Gomez_Fluxo.vcf')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const whatsappUrl = `https://wa.me/${founderData.rawWhatsappArg}?text=${encodeURIComponent(
    'Hola Emiliano, te escribo tras escanear tu tarjeta de contacto de Fluxo en Noia. Me gustaría conocer más sobre la carta digital.'
  )}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-apple-fade-in select-none">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 text-white shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FluxoLogo size={32} />
            <div>
              <h3 className="font-bold text-sm text-white">Mi Tarjeta de Contacto</h3>
              <p className="text-[10px] text-blue-400 font-mono">Escaneo directo con la cámara</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo con Código QR */}
        <div className="p-5 flex flex-col items-center text-center space-y-3.5">
          {/* Identidad */}
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25 mb-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>CEO Fluxo</span>
            </div>
            <h4 className="font-bold text-base text-white">{founderData.name}</h4>
            <p className="text-xs text-blue-400 font-semibold">{founderData.role}</p>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 mt-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{founderData.location}</span>
            </div>
          </div>

          {/* Código QR con Marco de Alto Contraste */}
          <div className="relative p-2.5 rounded-2xl bg-white shadow-xl border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt="Código QR de contacto"
              className="w-44 h-44 object-contain rounded-lg"
            />
          </div>

          {/* Desglose de ambos números */}
          <div className="w-full p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs">📞</span>
                <div className="truncate">
                  <span className="text-[10px] text-slate-400 block">Llamadas (España)</span>
                  <span className="font-mono text-white text-xs font-semibold">{founderData.phoneSpain}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopySpain}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] font-bold border border-slate-700"
              >
                {copiedSpain ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>

            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs">💬</span>
                <div className="truncate">
                  <span className="text-[10px] text-emerald-400 block">WhatsApp (Emiliano)</span>
                  <span className="font-mono text-emerald-300 text-xs font-semibold">{founderData.whatsappArg}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyWA}
                className="px-2 py-0.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[10px] font-bold border border-emerald-500/30"
              >
                {copiedWA ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Acciones directas */}
          <div className="w-full space-y-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 shadow-md shadow-emerald-600/20"
            >
              <MessageCircle className="w-4 h-4 text-white" />
              <span>Abrir WhatsApp ({founderData.whatsappArg})</span>
            </a>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${founderData.phoneSpain}`}
                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Llamar (España)</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadVcf}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 active:scale-95 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Guardar .vcf</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
