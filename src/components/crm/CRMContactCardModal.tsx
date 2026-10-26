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
  MapPin
} from 'lucide-react'

interface CRMContactCardModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CRMContactCardModal({ isOpen, onClose }: CRMContactCardModalProps) {
  if (!isOpen) return null

  const [copied, setCopied] = useState(false)

  const founderData = {
    name: 'Emilio Gómez',
    role: 'Fundador & Director de Operaciones',
    company: 'Fluxo — Gastronomic System',
    location: 'Noia, Galicia',
    phone: '+34 600 000 000',
    whatsapp: '34600000000',
    email: 'contactofluxosystem@gmail.com',
    web: 'https://fluxo-gastro.vercel.app',
  }

  // Formato vCard estándar para que el móvil reconozca "Guardar Contacto" al escanear
  const vCardContent = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${founderData.name}`,
    `ORG:${founderData.company}`,
    `TITLE:${founderData.role}`,
    `TEL;TYPE=CELL:${founderData.phone}`,
    `EMAIL:${founderData.email}`,
    `URL:${founderData.web}`,
    'ADR;TYPE=WORK:;;Noia;A Coruña;;Galicia;España',
    'NOTE:Plataforma de digitalización gastronómica y cartas interactivas para hostelería.',
    'END:VCARD',
  ].join('\n')

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
    vCardContent
  )}`

  const handleCopyDetails = () => {
    const text = `${founderData.name} — ${founderData.role}\n${founderData.company}\nTel: ${founderData.phone}\nEmail: ${founderData.email}\nWeb: ${founderData.web}`
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadVcf = () => {
    const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Emilio_Gomez_Fluxo.vcf')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in select-none">
      <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 text-white shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
              <QrCode className="w-4 h-4" />
            </div>
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
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          {/* Tarjeta de Identidad */}
          <div>
            <h4 className="font-bold text-base text-white">{founderData.name}</h4>
            <p className="text-xs text-blue-400 font-semibold">{founderData.role}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{founderData.company}</p>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 mt-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{founderData.location}</span>
            </div>
          </div>

          {/* Código QR con Marco de Alto Contraste */}
          <div className="relative p-3 rounded-2xl bg-white shadow-xl border border-slate-200">
            <img
              src={qrImageUrl}
              alt="Código QR de contacto"
              className="w-48 h-48 object-contain rounded-lg"
            />
          </div>

          <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
            Acerca la cámara del móvil del hostelero a este código para que guarde tu contacto directamente en su agenda sin tarjetas de papel.
          </p>

          {/* Botones de Acción */}
          <div className="w-full grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleDownloadVcf}
              className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-blue-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Guardar .VCF</span>
            </button>

            <button
              type="button"
              onClick={handleCopyDetails}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? '¡Copiado!' : 'Copiar Datos'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
