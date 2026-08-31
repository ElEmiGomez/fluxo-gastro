'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Lock, FileText, Cookie, ArrowLeft } from 'lucide-react'

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'cookies'>('privacy')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-extrabold text-white">Cumplimiento Legal & RGPD</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-orange-400">
            Marco Normativo Gastronomía & Restauración España & UE
          </span>
          <h1 className="text-3xl font-black text-white">
            Aviso Legal, Privacidad y Cookies
          </h1>
          <p className="text-xs text-slate-400">
            Conforme al Reglamento General de Protección de Datos (RGPD UE 2016/679), Ley Orgánica 3/2018 (LOPD-GDD) y Ley 34/2002 (LSSI-CE).
          </p>
        </div>

        {/* Pestañas */}
        <div className="flex border border-slate-800 rounded-2xl bg-slate-900 p-1 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Política de Privacidad</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'terms'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Condiciones de Servicio</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'cookies'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Política de Cookies</span>
          </button>
        </div>

        {/* Document Body */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-sm text-slate-300 leading-relaxed">
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-xs">
                🔒 <strong>Privacidad por Diseño:</strong> Fluxo opera bajo el principio de minimización de datos. No solicitamos registro previo, correo electrónico, número telefónico ni datos personales para acceder a la carta digital ni para ordenar desde la mesa.
              </div>

              <h2 className="text-lg font-bold text-white">1. Responsable del Tratamiento</h2>
              <p>
                El responsable del tratamiento de los datos operativos derivados del servicio en sala es el establecimiento gastronómico titular de la cuenta en Fluxo.
              </p>

              <h2 className="text-lg font-bold text-white">2. Datos Procesados y Finalidad</h2>
              <p>
                Los únicos datos gestionados de manera temporal son técnicos y contextuales:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Número de mesa físico donde se escanea el código QR.</li>
                <li>Platos y bebidas seleccionadas para la preparación en cocina.</li>
                <li>Avisos de servicio (solicitud de cuenta, agua, hielo o llamada al personal).</li>
                <li>Método de pago seleccionado (efectivo o TPV físico).</li>
              </ul>
              <p>
                La base legal es la ejecución de la relación contractual de consumo en el local (Art. 6.1.b RGPD).
              </p>

              <h2 className="text-lg font-bold text-white">3. Conservación y Destrucción</h2>
              <p>
                Las comandas de mesa son efímeras y se archivan una vez que el personal libera la mesa tras el cobro del servicio. No se elaboran perfiles publicitarios ni se ceden datos a empresas terceras.
              </p>

              <h2 className="text-lg font-bold text-white">4. Ejercicio de Derechos</h2>
              <p>
                Los usuarios pueden ejercer sus derechos de acceso, rectificación y supresión dirigiéndose al responsable del local físico en cualquier momento.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">1. Objeto del Servicio</h2>
              <p>
                Fluxo es una plataforma web progresiva (PWA) de soporte para restauración que facilita la consulta de cartas digitales interactivas, la autogestión de comandas en mesa y la sincronización con cocina y sala.
              </p>

              <h2 className="text-lg font-bold text-white">2. Transparencia de Precios e Impuestos</h2>
              <p>
                Conforme a la normativa de consumo española, todos los precios mostrados en las cartas digitales incluyen el Impuesto sobre el Valor Añadido (IVA).
              </p>

              <h2 className="text-lg font-bold text-white">3. Información sobre Alérgenos e Intolerancias</h2>
              <p>
                En estricto cumplimiento del Reglamento (UE) Nº 1169/2011 sobre información alimentaria facilitada al consumidor, los platos disponen de información gráfica y escrita sobre alérgenos. Si padece una alergia severa, se recomienda encarecidamente comunicarlo personalmente al camarero.
              </p>

              <h2 className="text-lg font-bold text-white">4. Transacciones y Pagos</h2>
              <p>
                La plataforma no almacena números de tarjeta bancaria ni credenciales financieras. El cobro final se realiza mediante los datáfonos oficiales (TPV bancario) del restaurante o en efectivo.
              </p>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">1. Información de Cookies según LSSI-CE</h2>
              <p>
                En cumplimiento del artículo 22.2 de la Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI-CE), le informamos que este sitio web emplea exclusivamente <strong>almacenamiento técnico esencial</strong> (cookies técnicas y Web Storage):
              </p>
              
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="font-bold text-white text-xs block">gastro_cart_*:</span>
                  <span className="text-xs text-slate-400">Guarda en tu navegador los productos añadidos temporalmente a tu mesa para no perder tu selección si se refresca la pantalla.</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="font-bold text-white text-xs block">gastro_cookie_consent:</span>
                  <span className="text-xs text-slate-400">Registra que has visualizado y aceptado el aviso de privacidad.</span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-white">2. Ausencia de Rastreo de Terceros</h2>
              <p>
                No instalamos cookies de Google Analytics, Meta Pixel ni redes publicitarias. Tu navegación es completamente privada.
              </p>
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-4 text-center text-xs text-slate-500">
        Fluxo &middot; Cumplimiento normativo y seguridad en gastronomía.
      </footer>

    </div>
  )
}
