'use client'

import React, { useState } from 'react'
import {
  Phone,
  MessageCircle,
  Copy,
  CheckCircle2,
  Download,
  ExternalLink,
  Sparkles,
  MapPin,
  Mail,
  ShieldCheck,
  Globe
} from 'lucide-react'

export default function ContactoPage() {
  const [copied, setCopied] = useState(false)

  const founder = {
    name: 'Emiliano Gomez',
    role: 'Fundador & CEO',
    company: 'Fluxo — Gastronomic System',
    phone: '+34 711 573 870',
    rawPhone: '34711573870',
    email: 'contactofluxosystem@gmail.com',
    location: 'Noia, Galicia',
    web: 'https://fluxo-gastro.vercel.app',
  }

  const vCardContent = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${founder.name}`,
    `ORG:${founder.company}`,
    `TITLE:${founder.role}`,
    `TEL;TYPE=CELL:${founder.phone}`,
    `EMAIL:${founder.email}`,
    `URL:${founder.web}`,
    'ADR;TYPE=WORK:;;Noia;A Coruña;;Galicia;España',
    'NOTE:CEO de Fluxo — Digitalización gastronómica, cartas interactivas y comandero.',
    'END:VCARD',
  ].join('\n')

  const handleCopyNumber = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(founder.phone)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
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

  const whatsappUrl = `https://wa.me/${founder.rawPhone}?text=${encodeURIComponent(
    'Hola Emiliano, he escaneado tu tarjeta de contacto de Fluxo y me gustaría tener más información sobre el sistema para mi restaurante.'
  )}`

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in flex flex-col">
        {/* Cabecera de Identidad */}
        <div className="p-6 bg-gradient-to-br from-blue-900/50 via-indigo-900/30 to-slate-900 border-b border-slate-800 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Avatar / Isotipo */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-blue-500/20 mb-3 flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center">
              <span className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                EG
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Fundador & CEO</span>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight">{founder.name}</h1>
          <p className="text-xs font-semibold text-blue-400 mt-0.5">{founder.company}</p>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-2 font-medium">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>{founder.location}</span>
          </div>
        </div>

        {/* Acciones Rápidas Móviles */}
        <div className="p-6 space-y-3.5 flex-1">
          {/* 1. Botón Principal: WhatsApp directo */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 transition active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 text-white" />
            <span>Abrir WhatsApp con Emiliano</span>
          </a>

          {/* 2. Botón Copiar Número */}
          <button
            type="button"
            onClick={handleCopyNumber}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 font-semibold text-xs flex items-center justify-between transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-700/50 flex items-center justify-center text-blue-400">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400">Teléfono directo</p>
                <p className="font-mono text-white text-xs">{founder.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </div>
          </button>

          {/* 3. Guardar Contacto en la Agenda */}
          <button
            type="button"
            onClick={handleDownloadVcf}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/80 font-semibold text-xs flex items-center justify-between transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400">Agenda de contactos</p>
                <p className="text-white text-xs">Guardar en el Teléfono (.vcf)</p>
              </div>
            </div>

            <span className="text-[11px] text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-bold">
              Guardar
            </span>
          </button>

          {/* 4. Llamar directo */}
          <a
            href={`tel:${founder.phone}`}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/50 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>Llamar por teléfono directo</span>
          </a>

          {/* 5. Demo de Carta Digital */}
          <a
            href="/carta/demo"
            className="w-full py-3 px-4 rounded-2xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Ver Carta Digital Interactiva en Vivo</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
          </a>
        </div>

        {/* Pie */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Fluxo — Gastronomic System • Noia, Galicia</p>
        </div>
      </div>
    </main>
  )
}
