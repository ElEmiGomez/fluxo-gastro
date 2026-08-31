'use client'

import React, { useState } from 'react'
import { X, ShieldCheck, Lock, FileText, Cookie, Check } from 'lucide-react'

interface LegalModalProps {
  isOpen: boolean
  onClose: () => void
  restaurantName?: string
}

export function LegalModal({ isOpen, onClose, restaurantName = 'Establecimiento Gastronómico' }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'cookies'>('privacy')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[85vh] max-h-[85dvh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
                Aviso Legal y Privacidad
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Conforme al RGPD (UE 2016/679) &middot; LOPD-GDD &middot; LSSI España
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacidad (RGPD)</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'terms'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Condiciones de Uso</span>
          </button>

          <button
            onClick={() => setActiveTab('cookies')}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'cookies'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cookie className="w-3.5 h-3.5" />
            <span>Política de Cookies</span>
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          {activeTab === 'privacy' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 font-medium text-xs">
                🔒 <strong>Compromiso con tu privacidad:</strong> Esta carta digital no solicita tu nombre, teléfono ni correo para ver el menú ni para ordenar desde la mesa.
              </div>

              <h4 className="font-bold text-slate-900 text-sm">1. Responsable del Tratamiento</h4>
              <p>
                El responsable del tratamiento de los datos operativos generados durante el pedido en sala es <strong>{restaurantName}</strong>, con domicilio en el propio establecimiento físico.
              </p>

              <h4 className="font-bold text-slate-900 text-sm">2. Finalidad del Tratamiento</h4>
              <p>
                Los datos técnicos procesados (número de mesa asignado, productos seleccionados, solicitudes de servicio o comanda) se utilizan exclusivamente para:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Transmitir la comanda en tiempo real al personal de sala y cocina.</li>
                <li>Atender llamadas de servicio (solicitud de cuenta, agua, hielo, etc.).</li>
                <li>Garantizar la correcta facturación y liquidación del consumo en sala.</li>
              </ul>

              <h4 className="font-bold text-slate-900 text-sm">3. Conservación y No Cesión</h4>
              <p>
                Los datos de la mesa son efímeros y se resetean automáticamente una vez que el personal libera la mesa tras el pago. <strong>No se comercializan ni ceden datos a terceros bajo ninguna circunstancia.</strong>
              </p>

              <h4 className="font-bold text-slate-900 text-sm">4. Derechos RGPD</h4>
              <p>
                Conforme a la normativa europea (RGPD UE 2016/679) y española (Ley Orgánica 3/2018), los usuarios pueden ejercer sus derechos de acceso, rectificación y supresión ante la dirección del establecimiento.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3.5">
              <h4 className="font-bold text-slate-900 text-sm">1. Servicio de Carta Digital Interactiva</h4>
              <p>
                Este servicio permite a los comensales visualizar la carta actualizada con fotografías, alérgenos y precios oficiales del local, así como gestionar pedidos directamente desde su mesa mediante código QR.
              </p>

              <h4 className="font-bold text-slate-900 text-sm">2. Precios e Impuestos</h4>
              <p>
                Todos los precios mostrados en la carta digital incluyen el Impuesto sobre el Valor Añadido (IVA) conforme a la legislación española vigente.
              </p>

              <h4 className="font-bold text-slate-900 text-sm">3. Alérgenos y Dietas</h4>
              <p>
                La información sobre alérgenos (Reglamento UE 1169/2011) se proporciona a título informativo. Si tienes alergias o intolerancias graves, te rogamos comunicarlo directamente al personal de sala antes de confirmar tu pedido.
              </p>

              <h4 className="font-bold text-slate-900 text-sm">4. Métodos de Pago</h4>
              <p>
                La selección de método de pago en la aplicación notifica al personal para cobrar en mesa mediante tarjeta (TPV bancario) o efectivo. No se procesan ni almacenan números de tarjeta en esta aplicación.
              </p>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-3.5">
              <h4 className="font-bold text-slate-900 text-sm">1. ¿Qué tipo de cookies o almacenamiento usamos?</h4>
              <p>
                Esta aplicación web cumple con el <strong>Artículo 22.2 de la LSSI-CE</strong>. Emplea exclusivamente almacenamiento local técnico (localStorage y cookies técnicas esenciales):
              </p>
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block text-xs">Cookies Técnicas / localStorage (Estrictamente Necesarias)</span>
                  <span className="text-xs text-slate-500">
                    Permiten mantener los platos agregados a tu carrito temporal, recordar tu idioma seleccionado (Galego / Español / English) y mantener la sesión de la mesa activa durante tu estancia.
                  </span>
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-sm">2. Ausencia de Cookies Publicitarias</h4>
              <p>
                No empleamos cookies publicitarias, de seguimiento entre sitios ni de perfiles comerciales de terceros. Al abandonar el local o cerrar la sesión de mesa, la información se cancela automáticamente.
              </p>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Fluxo &middot; Cumplimiento Certificado
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold shadow-sm hover:bg-blue-800 transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Entendido y Aceptar</span>
          </button>
        </div>

      </div>
    </div>
  )
}
