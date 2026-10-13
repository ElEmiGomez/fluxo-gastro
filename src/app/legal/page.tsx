'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Lock, FileText, Cookie, ArrowLeft, CheckCircle2, Sparkles, Building2 } from 'lucide-react'
import { FluxoLogo } from '@/components/common/FluxoLogo'

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<'notice' | 'privacy' | 'terms' | 'cookies'>('notice')

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
            <span className="hidden sm:inline">Cumplimiento LSSI-CE &amp; RGPD</span>
            <span className="sm:hidden">LSSI &amp; RGPD</span>
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
            Aviso Legal, Privacidad y Condiciones
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Conforme a la Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI-CE), Reglamento General de Protección de Datos (RGPD UE 2016/679) y Ley Orgánica 3/2018 (LOPD-GDD).
          </p>
        </div>

        {/* Pestañas con Estilo Landing */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs sm:text-sm font-black">
          <button
            onClick={() => setActiveTab('notice')}
            className={`py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'notice'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-bold'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Aviso Legal (LSSI-CE)</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-bold'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>2. Privacidad (RGPD)</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-bold'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>3. Términos de Servicio</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`py-3 px-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'cookies'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-bold'
            }`}
          >
            <Cookie className="w-4 h-4" />
            <span>4. Cookies Técnicas</span>
          </button>
        </div>

        {/* Cuerpo del Documento */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6 text-sm text-slate-300 leading-relaxed shadow-xl">
          {activeTab === 'notice' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-300 text-xs sm:text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Identificación Oficial y Cumplimiento Normativo:</strong> En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se exponen a continuación los datos identificativos y fiscales del titular de la plataforma.
                </div>
              </div>

              {/* Ficha Fiscal del Titular */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <span>Datos Identificativos del Titular (LSSI-CE)</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">Titular / Responsable:</span>
                    <span className="text-white font-bold block">Emiliano Gomez</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">Identificación Fiscal (NIF / NIE):</span>
                    <span className="text-cyan-400 font-mono font-bold block">Z5536581A</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">Denominación de la Plataforma:</span>
                    <span className="text-white font-bold block">Fluxo Gastronomic System</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">Correo Electrónico de Contacto:</span>
                    <a href="mailto:contactofluxosystem@gmail.com" className="text-cyan-400 font-mono font-bold hover:underline block">
                      contactofluxosystem@gmail.com
                    </a>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-slate-400 font-medium block">Domicilio a Efectos de Notificaciones:</span>
                    <span className="text-white font-bold block">Galicia, España</span>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-slate-400 font-medium block">Actividad Económica:</span>
                    <span className="text-slate-300 block leading-relaxed">
                      Desarrollo, explotación y provisión de software como servicio (SaaS) especializado en soporte operativo de hostelería: telecomanda de sala, cartas interactivas y monitores de cocina (KDS).
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">1</span>
                  Propiedad Intelectual e Industrial
                </h2>
                <p className="text-slate-400">
                  El diseño, código fuente, algoritmos, arquitectura de software, marcas, logotipos y demás elementos que integran Fluxo Gastronomic System pertenecen exclusivamente a su titular o a terceros licenciantes legítimos, quedando protegidos por los derechos de propiedad intelectual e industrial según el marco jurídico español y comunitario.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">2</span>
                  Condiciones de Uso y Exención de Responsabilidad
                </h2>
                <p className="text-slate-400">
                  El acceso y utilización de la plataforma atribuye la condición de usuario e implica la aceptación plena de las presentes condiciones. El titular no se responsabiliza del mal uso que los establecimientos o comensales puedan hacer del software, ni de interrupciones del servicio derivadas de fallos de conectividad ajenos al sistema.
                </p>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">3</span>
                  Legislación Aplicable y Fuero Judicial
                </h2>
                <p className="text-slate-400">
                  Para la resolución de cualquier controversia o cuestión litigiosa relativa a este sitio web o las actividades en él desarrolladas, será de aplicación la legislación española, siendo competentes los Juzgados y Tribunales competentes conforme a la normativa vigente.
                </p>
              </div>
            </div>
          )}

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
                  El titular de la plataforma tecnológica Fluxo es <strong>Emiliano Gomez</strong> (NIE Z5536581A, <a href="mailto:contactofluxosystem@gmail.com" className="text-cyan-400 hover:underline font-mono">contactofluxosystem@gmail.com</a>). El responsable del tratamiento de los datos operativos derivados del consumo en sala es el establecimiento gastronómico cliente donde se realiza el servicio.
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
                  Ejercicio de Derechos RGPD y Contacto
                </h2>
                <p className="text-slate-400">
                  Los comensales y clientes pueden ejercer sus derechos de acceso, rectificación y supresión dirigiéndose directamente al responsable del establecimiento físico o comunicándose con el soporte técnico de la plataforma en <a href="mailto:contactofluxosystem@gmail.com" className="text-cyan-400 hover:underline font-mono">contactofluxosystem@gmail.com</a>.
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

              <div className="space-y-3 pt-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">5</span>
                  Ley Antifraude y Régimen Veri*Factu (Ley 11/2021 &amp; RD 1007/2023)
                </h2>
                <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-2.5">
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    <strong className="text-cyan-400">Delimitación Funcional y Exención de Certificación SIF:</strong> Fluxo Gastronomic System actúa exclusiva y estrictamente como software de soporte operativo de sala, visualización de cartas digitales interactivas y canal de telecomanda interna entre mesas, camareros y cocina.
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Fluxo <strong>NO constituye un Sistema Informático de Facturación (SIF)</strong> con arreglo al artículo 29.2.j de la Ley 58/2003 (General Tributaria), la Ley 11/2021 de medidas de prevención y lucha contra el fraude fiscal y el Real Decreto 1007/2023 (Reglamento Veri*Factu). Las vistas previas de cuenta o simulaciones de ticket de mesa son notas informativas de servicio interno. La expedición obligatoria de la factura simplificada o ticket fiscal oficial legalmente vinculante recae única y exclusivamente en el titular del establecimiento hostelero a través de su TPV homologado en el instante del cobro.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 inline-flex items-center justify-center text-xs">6</span>
                  Atención Comercial y Notificaciones de Plataforma
                </h2>
                <p className="text-slate-400">
                  Para cualquier consulta comercial, solicitud de piloto o notificación formal dirigida al titular de Fluxo (Emiliano Gomez, NIE Z5536581A), los interesados pueden escribir a <a href="mailto:contactofluxosystem@gmail.com" className="text-cyan-400 hover:underline font-mono">contactofluxosystem@gmail.com</a>.
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
