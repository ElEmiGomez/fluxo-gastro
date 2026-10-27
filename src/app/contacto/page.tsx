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
import { FluxoLogo } from '@/components/common/FluxoLogo'

export default function ContactoPage() {
  const [copiedPhoneSpain, setCopiedPhoneSpain] = useState(false)
  const [copiedWhatsappArg, setCopiedWhatsappArg] = useState(false)

  const founder = {
    name: 'Emiliano Gomez',
    role: 'Fundador & CEO',
    company: 'Fluxo — Gastronomic System',
    phoneSpain: '+34 711 573 870',      // Para llamadas directas en España (sin WhatsApp)
    rawPhoneSpain: '34711573870',
    whatsappArg: '+54 358 518 7430',    // Para WhatsApp
    rawWhatsappArg: '5493585187430',    // Formato internacional oficial para wa.me en Argentina
    email: 'contactofluxosystem@gmail.com',
    location: 'Noia, Galicia',
    web: 'https://fluxo-gastro.vercel.app',
  }

  // Formato vCard estándar para guardar ambos números en la libreta del teléfono
  const vCardContent = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${founder.name}`,
    `ORG:${founder.company}`,
    `TITLE:${founder.role}`,
    `item1.TEL:${founder.phoneSpain}`,
    'item1.X-ABLabel:Llamadas (España)',
    `item2.TEL:+54 9 358 518-7430`,
    'item2.X-ABLabel:WhatsApp',
    `EMAIL:${founder.email}`,
    `URL:${founder.web}`,
    'ADR;TYPE=WORK:;;Noia;A Coruña;;Galicia;España',
    `NOTE:CEO de Fluxo — Digitalización gastronómica. Tel llamadas España: ${founder.phoneSpain} | WhatsApp: ${founder.whatsappArg}`,
    'END:VCARD',
  ].join('\n')

  const handleCopySpain = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(founder.phoneSpain)
      setCopiedPhoneSpain(true)
      setTimeout(() => setCopiedPhoneSpain(false), 2200)
    }
  }

  const handleCopyWhatsapp = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(founder.whatsappArg)
      setCopiedWhatsappArg(true)
      setTimeout(() => setCopiedWhatsappArg(false), 2200)
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

  const whatsappUrl = `https://wa.me/${founder.rawWhatsappArg}?text=${encodeURIComponent(
    'Hola Emiliano, he escaneado tu tarjeta de contacto de Fluxo y me gustaría tener más información sobre el sistema para mi restaurante.'
  )}`

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in flex flex-col">
        {/* Cabecera de Identidad */}
        <div className="p-6 bg-gradient-to-br from-blue-900/50 via-indigo-900/30 to-slate-900 border-b border-slate-800 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Logo Oficial de Fluxo */}
          <div className="flex justify-center mb-3">
            <FluxoLogo size={48} />
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
        <div className="p-6 space-y-3 flex-1">
          {/* 1. Botón Principal: WhatsApp directo (Argentina) */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 transition active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 text-white" />
            <div className="text-left">
              <p className="leading-tight">Abrir WhatsApp con Emiliano</p>
              <p className="text-[10px] text-emerald-200 font-mono font-normal">{founder.whatsappArg}</p>
            </div>
          </a>

          {/* 2. Botón Llamar Teléfono Directo (España) */}
          <a
            href={`tel:${founder.phoneSpain}`}
            className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md shadow-blue-600/20 transition active:scale-[0.98]"
          >
            <Phone className="w-4 h-4 text-white" />
            <div className="text-left">
              <p className="leading-tight">Llamar por Teléfono (España)</p>
              <p className="text-[10px] text-blue-200 font-mono font-normal">{founder.phoneSpain}</p>
            </div>
          </a>

          {/* 3. Bloque Copiar Números con 1 Toque */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs">📞</span>
                <div>
                  <p className="text-[10px] text-slate-400">Teléfono España (Llamadas)</p>
                  <p className="font-mono text-white text-xs font-semibold">{founder.phoneSpain}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopySpain}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 transition"
              >
                {copiedPhoneSpain ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-xs">💬</span>
                <div>
                  <p className="text-[10px] text-slate-400">WhatsApp (Emiliano)</p>
                  <p className="font-mono text-emerald-400 text-xs font-semibold">{founder.whatsappArg}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyWhatsapp}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 transition"
              >
                {copiedWhatsappArg ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* 4. Guardar Ambos Contactos en la Agenda */}
          <button
            type="button"
            onClick={handleDownloadVcf}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-between transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Download className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400">Agenda de contactos</p>
                <p className="text-white text-xs">Guardar Ficha en el Teléfono (.vcf)</p>
              </div>
            </div>

            <span className="text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 font-bold">
              Guardar
            </span>
          </button>

          {/* 5. Demo de Carta Digital */}
          <a
            href="/carta/demo"
            className="w-full py-2.5 px-4 rounded-2xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition"
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
