'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Lock, FileText, Cookie, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react'
import { FluxoLogo } from '@/components/common/FluxoLogo'

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'cookies'>('privacy')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans">
      
      {/* Header con Estética Landing */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <FluxoLogo size="md" />
            </Link>
            <div className="hidden sm:block h-5 w-px bg-slate-800" />
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 text-xs font-bold transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Volver al Inicio</span>
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Cumplimiento RGPD &amp; UE</span>
            <span className="sm:hidden">RGPD</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-8">
        
        {/* Cabecera de Página */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Marco Normativo Gastronomía España &amp; Unión Europea</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Aviso Legal, Privacidad y Cookies
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Conforme al Reglamento General de Protección de Datos (RGPD UE 2016/679), Ley Orgánica 3/2018 (LOPD-GDD) y Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI-CE).
          </p>
        </div>

        {/* Pestañas con Estilo Landing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm font-black">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-bold'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>1. Política de Privacidad</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-bold'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>2. Términos de Servicio</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'cookies'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-bold'
            }`}
          >
            <Cookie className="w-4 h-4" />
            <span>3. Cookies Técnicas</span>
          </button>
        </div>

        {/* Cuerpo del Documento */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 text-sm text-slate-300 leading-relaxed shadow-xl">
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs sm:text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Privacidad por Diseño (Data Minimization):</strong> Fluxo opera bajo el principio estricto de minimización de datos. No solicitamos registro previo, correo electrónico, número telefónico ni datos personales para acceder a la carta digital ni para ordenar desde la mesa.
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">1</span>
                  Responsable del Tratamiento
                </h2>
                <p className="text-slate-400">
                  El responsable del tratamiento de los datos operativos derivados del servicio en sala es el establecimiento gastronómico titular de la cuenta en Fluxo donde se realiza la consumición.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">2</span>
                  Datos Procesados y Finalidad
                </h2>
                <p className="text-slate-400">
                  Los únicos datos gestionados de manera estrictamente temporal son técnicos y contextuales al servicio de hostelería:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                  <li>Número de mesa físico donde se escanea el código QR interactivo.</li>
                  <li>Platos, bebidas y modificadores de cocina seleccionados para la preparación en comandero y KDS.</li>
                  <li>Avisos de servicio en sala (solicitud de cuenta, agua, hielo o llamada al mozo).</li>
                  <li>Método de pago seleccionado (efectivo o datáfono bancario físico).</li>
                </ul>
                <p className="text-xs text-cyan-400 font-semibold pt-1">
                  Base legal: Ejecución de la relación contractual de consumo en el local (Art. 6.1.b RGPD).
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">3</span>
                  Conservación y Destrucción
                </h2>
                <p className="text-slate-400">
                  Las comandas de mesa son efímeras y se archivan de inmediato una vez que el personal de sala libera la mesa tras el cobro del servicio. No se elaboran perfiles publicitarios ni se ceden datos a empresas terceras.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">4</span>
                  Ejercicio de Derechos RGPD
                </h2>
                <p className="text-slate-400">
                  Los comensales y clientes pueden ejercer sus derechos de acceso, rectificación y supresión dirigiéndose directamente al responsable del establecimiento físico en cualquier momento.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">1</span>
                  Objeto del Servicio Gastronómico
                </h2>
                <p className="text-slate-400">
                  Fluxo es una plataforma web progresiva (PWA) de soporte para restauración que facilita la consulta de cartas digitales interactivas, la autogestión de comandas en mesa y la sincronización con cocina (KDS o impresoras térmicas ESC/POS) y comandero de sala.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">2</span>
                  Transparencia de Precios e Impuestos
                </h2>
                <p className="text-slate-400">
                  Conforme a la normativa de consumo española y europea, todos los precios mostrados en las cartas digitales para el comensal incluyen obligatoriamente el Impuesto sobre el Valor Añadido (IVA).
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">3</span>
                  Información sobre Alérgenos e Intolerancias
                </h2>
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-300 text-xs sm:text-sm">
                  En estricto cumplimiento del <strong>Reglamento (UE) Nº 1169/2011</strong> sobre información alimentaria facilitada al consumidor, los platos disponen de información gráfica y escrita sobre los 14 alérgenos principales. Si padece una alergia severa, se recomienda comunicarlo personalmente al camarero.
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">4</span>
                  Transacciones y Métodos de Cobro
                </h2>
                <p className="text-slate-400">
                  La plataforma no almacena números de tarjeta bancaria ni credenciales financieras sensibles. El cobro final se realiza mediante los datáfonos oficiales (TPV bancario) del restaurante o en efectivo.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">1</span>
                  Información de Cookies Técnicas según LSSI-CE
                </h2>
                <p className="text-slate-400">
                  En cumplimiento del artículo 22.2 de la Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI-CE), este sitio web emplea exclusivamente <strong>almacenamiento técnico esencial</strong> (cookies técnicas y Web Storage) para el funcionamiento operativo:
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="font-black text-cyan-400 text-xs block font-mono">gastro_cart_*</span>
                  <span className="text-xs text-slate-400 block">
                    Guarda en el navegador local los platos y bebidas añadidos temporalmente a la mesa para no perder el pedido si se refresca la pantalla.
                  </span>
                </div>
                <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-1.5">
                  <span className="font-black text-emerald-400 text-xs block font-mono">gastro_cookie_consent</span>
                  <span className="text-xs text-slate-400 block">
                    Registra que el usuario ha visualizado y aceptado el aviso de privacidad y sesión técnica.
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs sm:text-sm">
                🛡️ <strong>Ausencia Total de Rastreo Publicitario:</strong> No instalamos cookies de Google Analytics, Meta Pixel ni rastreadores publicitarios comerciales. Tu navegación es completamente privada.
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Footer con Estética Landing */}
      <footer className="border-t border-slate-800/80 py-8 px-4 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-white">FLUXO</span>
            <span>&middot;</span>
            <span>Cumplimiento Normativo, RGPD &amp; Hostelería Segura</span>
          </div>
          <Link href="/" className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
            Volver a la Página Principal →
          </Link>
        </div>
      </footer>

    </div>
  )
}
