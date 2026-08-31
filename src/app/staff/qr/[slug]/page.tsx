'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Printer, QrCode, ArrowLeft, Store, Sparkles, Check, Wifi, Smartphone, HelpCircle } from 'lucide-react'
import { TenantProvider } from '@/components/tenant/TenantProvider'
import { TenantHeader } from '@/components/tenant/TenantHeader'
import { Table, Restaurant } from '@/types/database.types'
import { createBrowserClient } from '@/lib/supabase/client'
import { MOCK_RESTAURANTS, MOCK_TABLES } from '@/lib/supabase/mock-fallback'

export default function TableQRGeneratorPage() {
  const params = useParams()
  const slug = (params?.slug as string) || 'burger-gourmet'

  const [restaurant, setRestaurant] = useState<Restaurant>(() => MOCK_RESTAURANTS[slug] || MOCK_RESTAURANTS['burger-gourmet'])
  const [tables, setTables] = useState<Table[]>(() => MOCK_TABLES[slug] || [])
  const [baseUrl, setBaseUrl] = useState<string>('')
  const [customTableCount, setCustomTableCount] = useState<number>(25)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Si estamos en localhost, sugerimos la IP local de Wi-Fi o el origen actual
      const currentOrigin = window.location.origin
      setBaseUrl(currentOrigin)
    }

    async function loadTables() {
      const supabase = createBrowserClient()
      if (supabase) {
        try {
          const { data: restData } = await supabase.from('restaurants').select('*').eq('slug', slug).single()
          if (restData) {
            setRestaurant(restData)
            const { data: tableData } = await supabase.from('tables').select('*').eq('restaurant_id', restData.id).order('table_number')
            if (tableData && tableData.length > 0) {
              setTables(tableData)
              setCustomTableCount(tableData.length)
            }
          }
        } catch (e) {
          console.log('Using mock tables:', e)
        }
      }
    }

    loadTables()
  }, [slug])

  const handlePrint = () => {
    window.print()
  }

  // Generar lista de mesas para imprimir
  const tablesToPrint = tables.length > 0
    ? tables
    : Array.from({ length: customTableCount }, (_, i) => ({
        id: `mock-table-${i + 1}`,
        restaurant_id: restaurant.id,
        table_number: i + 1,
      }))

  return (
    <TenantProvider restaurant={restaurant}>
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col print:bg-white print:text-black">
        
        {/* Header no visible en impresión */}
        <div className="print:hidden">
          <TenantHeader viewType="menu" />
          
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <Link
                href={`/`}
                className="p-2 rounded-2xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Generador de Códigos QR para Mesas
                </h2>
                <p className="text-xs text-slate-500">
                  Escaneá desde el celular o imprimí los carteles para el salón
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 rounded-2xl font-black text-xs bg-blue-900 hover:bg-blue-800 text-white shadow-md flex items-center gap-2 transition-transform active:scale-95 touch-press"
              >
                <Printer className="w-4 h-4" />
                <span>IMPRIMIR CARTELES (PDF)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Guía en pantalla para testear con el celular de otra persona en la misma red Wi-Fi */}
        <div className="max-w-6xl mx-auto px-4 py-6 w-full print:hidden space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm text-xs text-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900 font-extrabold text-sm">
                <Wifi className="w-4 h-4 text-blue-700" />
                <span>📱 Cómo Probar los QR con un Celular Real (Sin subir a la nube todavía)</span>
              </div>
            </div>
            
            <p className="text-slate-600 leading-relaxed">
              Para que otra persona (o tú desde tu propio teléfono) escanee el QR y abra el menú en su celular:
            </p>

            <ol className="list-decimal pl-4 space-y-1.5 text-slate-600">
              <li>Conecta el celular a la <strong>misma red Wi-Fi</strong> que tu computadora.</li>
              <li>Asegúrate de que la dirección base sea tu IP local de Wi-Fi (ejemplo: <strong className="text-blue-900">http://192.168.1.129:3000</strong>).</li>
              <li>Abre la <strong>cámara del celular</strong> y enfoca cualquiera de los códigos QR de abajo (por ejemplo la <strong>Mesa #4</strong>). ¡Se abrirá la carta automáticamente!</li>
            </ol>

            {/* Input para configurar la URL Base del QR */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <label className="font-bold text-slate-700 whitespace-nowrap">
                Dirección Base del Servidor:
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://192.168.1.129:3000"
                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(baseUrl)
                  setCopiedUrl('¡Copiado!')
                  setTimeout(() => setCopiedUrl(null), 2000)
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-900 text-white font-bold text-xs hover:bg-blue-800"
              >
                {copiedUrl || 'Copiar'}
              </button>
            </div>
          </div>
        </div>

        {/* PARRILLA DE CÓDIGOS QR PARA ESCANEAR O IMPRIMIR */}
        <main className="max-w-6xl mx-auto px-4 py-4 w-full flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 print:grid-cols-2 print:gap-8 print:m-0">
            {tablesToPrint.map((table) => {
              const tableUrl = `${baseUrl || 'http://localhost:3000'}/menu/${restaurant.slug}?table=${table.table_number}`
              const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=10&data=${encodeURIComponent(tableUrl)}`

              return (
                <div
                  key={table.id || table.table_number}
                  className="bg-white text-slate-900 rounded-3xl p-6 shadow-sm hover:shadow-md border-2 border-slate-200 flex flex-col items-center justify-between text-center transition-all print:border-2 print:shadow-none print:break-inside-avoid print:rounded-2xl"
                >
                  {/* Identidad del Restaurante */}
                  <div className="space-y-1">
                    <h3 className="font-black text-xl tracking-tight text-blue-900 uppercase">
                      {restaurant.name}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Carta Digital &middot; Auto-Pedido
                    </p>
                  </div>

                  {/* Número de Mesa */}
                  <div className="my-3 px-6 py-1.5 rounded-2xl text-white font-black text-base tracking-wider uppercase shadow-md bg-blue-900">
                    MESA #{table.table_number}
                  </div>

                  {/* Código QR de Alta Definición */}
                  <div className="relative w-48 h-48 my-2 p-2 bg-white rounded-2xl border-2 border-slate-200 shadow-inner flex items-center justify-center">
                    <img
                      src={qrApiUrl}
                      alt={`QR Mesa ${table.table_number}`}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Call To Action para el Comensal */}
                  <div className="mt-2 space-y-1">
                    <p className="font-black text-xs text-slate-800 uppercase tracking-wide">
                      📷 Escaneá con la cámara de tu celular
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight max-w-[220px]">
                      Mirá el menú en fotos, personalizá tu pedido y llamá al mozo al instante
                    </p>
                  </div>

                  {/* Enlace directo para abrir en el navegador */}
                  <div className="mt-3 pt-3 border-t border-slate-100 w-full print:hidden">
                    <a
                      href={tableUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-blue-800 font-bold hover:underline"
                    >
                      Abrir enlace directo &rarr;
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        </main>

      </div>
    </TenantProvider>
  )
}
