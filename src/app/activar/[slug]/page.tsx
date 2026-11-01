'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck,
  Sparkles,
  Calendar,
  CreditCard,
  QrCode,
  FileText,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Download,
  MessageCircle,
  Copy,
  Check,
  Lock,
  ArrowRight,
  Flame,
  Info,
  Clock,
  Building2,
  RefreshCw,
  FileCheck,
} from 'lucide-react'

import {
  PlanType,
  PaymentMethod,
  PLAN_CONFIG,
  FOUNDER_SLOTS_MAX,
  FOUNDER_PRICE_EUR,
  FOUNDER_GRADUATED_PRICE_EUR,
  LocalBilling,
} from '@/lib/billing/billing-calculations'
import { loadBillingLocales, DEMO_LOCALES } from '@/lib/billing/crm-demo-seed'
import {
  buildReceiptData,
  drawReceipt,
  downloadCanvasPng,
} from '@/lib/billing/receipt-canvas-renderer'
import { createBrowserClient } from '@/lib/supabase/client'

const IVA_RATE = 0.21

export default function ActivarSlugPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const slug = (params?.slug as string) || 'casa-mar-da-vila'

  // Estados de datos
  const [loading, setLoading] = useState(true)
  const [restaurantName, setRestaurantName] = useState('Restaurante')
  const [restaurantData, setRestaurantData] = useState<LocalBilling | null>(null)
  const [occupiedFounderSlots, setOccupiedFounderSlots] = useState(1)

  // Selección de compra
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('full_fundador')
  const [billingDay, setBillingDay] = useState<number>(1)
  const [founderCommitment, setFounderCommitment] = useState(false)

  // Método de pago (dual)
  const [paymentTab, setPaymentTab] = useState<'stripe' | 'manual'>('stripe')
  const [manualMethod, setManualMethod] = useState<'bizum' | 'transfer' | 'cash'>('bizum')

  // Subida de comprobante
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofStoragePath, setProofStoragePath] = useState<string | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Procesamiento y Confirmación
  const [submitting, setSubmitting] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [confirmedPaymentInfo, setConfirmedPaymentInfo] = useState<{
    plan: PlanType
    billingDay: number
    method: string
    base: number
    iva: number
    total: number
    status: string
    isManual: boolean
  } | null>(null)

  // Copiado al portapapeles
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Canvas oculto para descarga de recibo
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Cargar datos del restaurante y plazas fundador
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const supabase = createBrowserClient()

        let localInfo: Partial<LocalBilling> | null = null
        let slotsCount = 1

        if (supabase) {
          // 1. Obtener restaurante de Supabase
          const { data: rest } = await supabase
            .from('restaurants')
            .select('*')
            .eq('slug', slug)
            .maybeSingle()

          if (rest) {
            localInfo = {
              id: rest.id,
              slug: rest.slug,
              nombre: rest.name,
              plan_type: (rest.plan_type as PlanType) || 'full_fundador',
              monthly_price_eur: rest.monthly_price_eur || 50,
              is_founder_slot: rest.is_founder_slot ?? true,
              founder_started_at: rest.founder_started_at,
              founder_commitment_accepted: rest.founder_commitment_accepted ?? false,
              billing_day: rest.billing_day || 2,
              payment_status: rest.payment_status || 'pending',
              payment_method: rest.payment_method || 'stripe_card',
              has_payment_proof: rest.has_payment_proof ?? false,
              pause_level: rest.pause_level || 0,
              owner_email: rest.owner_email || 'contacto@fluxosystem.es',
              owner_phone: rest.owner_phone || '34600111001',
            }
          }

          // 2. Contar plazas fundador ocupadas
          const { data: founderLocales } = await supabase
            .from('restaurants')
            .select('id')
            .eq('is_founder_slot', true)

          if (founderLocales && founderLocales.length > 0) {
            slotsCount = founderLocales.length
          }
        }

        // Fallback a demo seed si no se encuentra en Supabase
        if (!localInfo) {
          const storedLocales = loadBillingLocales()
          const matched = storedLocales.find((l) => l.slug === slug)
          if (matched) {
            localInfo = matched
            slotsCount = storedLocales.filter((l) => l.is_founder_slot).length
          } else {
            // Local genérico para la demo
            const cleanTitle = slug
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')
            localInfo = {
              id: `demo-${slug}`,
              slug,
              nombre: cleanTitle,
              plan_type: 'full_fundador',
              monthly_price_eur: 50,
              is_founder_slot: true,
              founder_started_at: null,
              founder_commitment_accepted: false,
              billing_day: 1,
              payment_status: 'pending',
              payment_method: 'stripe_card',
              has_payment_proof: false,
              pause_level: 0,
              owner_email: `contacto@${slug}.es`,
              owner_phone: '34600111001',
            }
          }
        }

        setRestaurantName(localInfo.nombre || 'Restaurante')
        setRestaurantData(localInfo as LocalBilling)
        setOccupiedFounderSlots(slotsCount)
        setBillingDay(localInfo.billing_day || 1)

        // Si las plazas están llenas y este local no tiene plaza previa, forzar plan full
        if (slotsCount >= FOUNDER_SLOTS_MAX && !localInfo.is_founder_slot) {
          setSelectedPlan('full')
        } else {
          setSelectedPlan(localInfo.plan_type || 'full_fundador')
        }

        if (localInfo.founder_commitment_accepted) {
          setFounderCommitment(true)
        }
      } catch (err) {
        console.warn('Error cargando datos de facturación:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [slug])

  // Detección de retorno exitoso desde Stripe Checkout
  useEffect(() => {
    const isSuccess = searchParams.get('success') === 'true'
    const sessionId = searchParams.get('session_id')
    const queryPlan = (searchParams.get('plan') as PlanType) || 'full_fundador'
    const queryDay = parseInt(searchParams.get('day') || '1', 10)

    if (isSuccess && sessionId) {
      const base = PLAN_CONFIG[queryPlan]?.basePriceEur || 50
      const iva = Math.round(base * IVA_RATE * 100) / 100
      const total = Math.round((base + iva) * 100) / 100

      setPaymentSuccess(true)
      setConfirmedPaymentInfo({
        plan: queryPlan,
        billingDay: queryDay,
        method: 'Stripe · Tarjeta / Apple Pay / SEPA',
        base,
        iva,
        total,
        status: 'Pagado y Activado',
        isManual: false,
      })
    }
  }, [searchParams])

  // Cálculos en vivo
  const currentPlanConfig = PLAN_CONFIG[selectedPlan]
  const basePrice = currentPlanConfig.basePriceEur
  const ivaAmount = Math.round(basePrice * IVA_RATE * 100) / 100
  const totalAmount = Math.round((basePrice + ivaAmount) * 100) / 100

  const founderSlotsRemaining = Math.max(0, FOUNDER_SLOTS_MAX - occupiedFounderSlots)
  const isFounderAvailable =
    founderSlotsRemaining > 0 || (restaurantData?.is_founder_slot && selectedPlan === 'full_fundador')

  // Manejador de subida de comprobante
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setUploadingProof(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('slug', slug)

      const res = await fetch('/api/billing/upload-proof', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Fallo al subir el archivo.')
      }

      setProofFile(file)
      setProofStoragePath(data.storage_path)
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir el comprobante.')
      setProofFile(null)
      setProofStoragePath(null)
    } finally {
      setUploadingProof(false)
    }
  }

  // Enviar Pago Manual Asistido (Bizum, Transferencia, Efectivo)
  async function handleManualSubmit() {
    if (!proofStoragePath) {
      setUploadError('REGLA ESTRICTA: Debes adjuntar el comprobante para solicitar la activación.')
      return
    }

    if (selectedPlan === 'full_fundador' && !founderCommitment) {
      setUploadError('Debes aceptar el Pacto Fundador para continuar.')
      return
    }

    setSubmitting(true)
    setUploadError(null)

    try {
      const res = await fetch('/api/billing/manual-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          plan_type: selectedPlan,
          billing_day: billingDay,
          payment_method: manualMethod,
          proof_storage_path: proofStoragePath,
          founder_commitment_accepted: selectedPlan === 'full_fundador' ? founderCommitment : false,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar el pago manual.')
      }

      setPaymentSuccess(true)
      setConfirmedPaymentInfo({
        plan: selectedPlan,
        billingDay,
        method:
          manualMethod === 'bizum'
            ? 'Bizum (+34 711 573 870)'
            : manualMethod === 'transfer'
              ? 'Transferencia Bancaria'
              : 'Efectivo en mano',
        base: basePrice,
        iva: ivaAmount,
        total: totalAmount,
        status: 'Comprobante en revisión (Activación en curso)',
        isManual: true,
      })
    } catch (err: any) {
      setUploadError(err.message || 'Ocurrió un error al enviar el comprobante.')
    } finally {
      setSubmitting(false)
    }
  }

  // Iniciar Pago con Stripe
  async function handleStripeCheckout() {
    if (selectedPlan === 'full_fundador' && !founderCommitment) {
      setUploadError('Debes aceptar el Pacto Fundador para continuar con la suscripción bonificada.')
      return
    }

    setSubmitting(true)
    setUploadError(null)

    try {
      const res = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          plan_type: selectedPlan,
          billing_day: billingDay,
          founder_commitment_accepted: selectedPlan === 'full_fundador' ? founderCommitment : false,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar Stripe Checkout.')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error al conectar con la pasarela de Stripe.')
      setSubmitting(false)
    }
  }

  // Descarga de recibo digital PNG
  function handleDownloadReceipt() {
    if (!canvasRef.current) return
    const fakeBilling: LocalBilling = {
      id: restaurantData?.id || `loc-${slug}`,
      slug,
      nombre: restaurantName,
      plan_type: confirmedPaymentInfo?.plan || selectedPlan,
      monthly_price_eur: confirmedPaymentInfo?.base || basePrice,
      is_founder_slot: (confirmedPaymentInfo?.plan || selectedPlan) === 'full_fundador',
      founder_started_at: new Date().toISOString(),
      founder_commitment_accepted: founderCommitment,
      billing_day: confirmedPaymentInfo?.billingDay || billingDay,
      payment_status: confirmedPaymentInfo?.isManual ? 'proof_pending' : 'paid',
      payment_method: (confirmedPaymentInfo?.isManual
        ? manualMethod
        : 'stripe_card') as PaymentMethod,
      has_payment_proof: true,
      pause_level: 0,
      owner_email: restaurantData?.owner_email || 'contacto@fluxosystem.es',
      owner_phone: restaurantData?.owner_phone || '34600111001',
    }

    const receiptData = buildReceiptData(fakeBilling, new Date())
    drawReceipt(canvasRef.current, receiptData)
    downloadCanvasPng(canvasRef.current, `Recibo-Oficial-${slug}-${receiptData.receiptNumber}.png`)
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide text-slate-400">Cargando pasarela de activación...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-x-hidden pb-24 selection:bg-blue-600 selection:text-white">
      {/* Canvas invisible para generar recibo oficial PNG */}
      <canvas ref={canvasRef} className="hidden" width={1200} height={1600} />

      {/* Luces y brillos de fondo estilo VisionOS */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 relative z-10">
        {/* LOGO SUPERIOR Y RETORNO */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
              F
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                FLUXO
              </span>
              <span className="block text-[11px] font-medium text-blue-400 uppercase tracking-widest">
                Pasarela Oficial de Activación
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Conexión Cifrada SSL 256-bit</span>
          </div>
        </div>

        {paymentSuccess ? (
          /* ==============================================================================
             5. PANTALLA DE CONFIRMACIÓN Y DESPACHO
             ============================================================================== */
          <div className="backdrop-blur-2xl bg-slate-900/70 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              {confirmedPaymentInfo?.isManual ? 'Comprobante Registrado' : 'Suscripción Activada con Éxito'}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              ¡Enhorabuena, {restaurantName}!
            </h1>
            <p className="text-slate-300 text-base leading-relaxed mb-8 max-w-2xl">
              {confirmedPaymentInfo?.isManual
                ? 'Hemos recibido tu comprobante de pago. Tu restaurante ya está marcado en el Semáforo del CRM Fundador y el equipo técnico validará tu activación en menos de 2 horas laborables.'
                : 'Tu suscripción ha sido confirmada y procesada a través de Stripe. Tu ecosistema Fluxo está 100% activo y blindado.'}
            </p>

            {/* Resumen del Plan Confirmado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-white/[0.04] border border-white/10 mb-8 backdrop-blur-md">
              <div>
                <span className="text-xs text-slate-400 block mb-1">Plan Contratado</span>
                <span className="font-bold text-white text-base">
                  {PLAN_CONFIG[confirmedPaymentInfo?.plan || selectedPlan].label}
                </span>
                <span className="text-xs text-blue-400 block mt-0.5">+ IVA mensual</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Día Mensual de Cobro</span>
                <span className="font-bold text-emerald-400 text-base">
                  Día {confirmedPaymentInfo?.billingDay || billingDay} de cada mes
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">Ventana de cobro protegida</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-1">Total Facturado</span>
                <span className="font-extrabold text-white text-base">
                  {confirmedPaymentInfo?.total.toFixed(2)} € / mes
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">
                  ({confirmedPaymentInfo?.base.toFixed(2)} € + {confirmedPaymentInfo?.iva.toFixed(2)} € IVA)
                </span>
              </div>
            </div>

            {/* Acciones: Descarga de Recibo Oficial y WhatsApp */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleDownloadReceipt}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-5 h-5" />
                Descargar Recibo Oficial PNG
              </button>

              <a
                href={`https://wa.me/34711573870?text=${encodeURIComponent(
                  `Hola equipo Fluxo, acabo de tramitar la activación de ${restaurantName} (Plan: ${
                    PLAN_CONFIG[confirmedPaymentInfo?.plan || selectedPlan].label
                  }, Día de cobro: ${confirmedPaymentInfo?.billingDay || billingDay}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5 text-emerald-400" />
                Avisar al Equipo por WhatsApp
              </a>

              <Link
                href={`/casamar-da-vila`}
                className="w-full sm:w-auto sm:ml-auto px-5 py-3.5 rounded-xl text-slate-400 hover:text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Ver Carta Digital</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* ==============================================================================
               1. CABECERA DE RESUMEN DEL PILOTO Y TRANSPARENCIA FISCAL (+ IVA)
               ============================================================================== */}
            <div className="backdrop-blur-2xl bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Piloto de 14 Días Finalizado
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                    <Building2 className="w-7 h-7 text-blue-400" />
                    {restaurantName}
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">
                    Activa la versión definitiva de tu sistema gastronómico con garantía de servicio continuo.
                  </p>
                </div>

                {/* Transparencia Fiscal en Tiempo Real (+ IVA) */}
                <div className="sm:text-right bg-white/[0.03] sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-white/5 sm:border-0">
                  <span className="text-xs text-slate-400 uppercase tracking-wider block font-medium">
                    Desglose Fiscal Mensual
                  </span>
                  <div className="flex sm:justify-end items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                      {totalAmount.toFixed(2)} €
                    </span>
                    <span className="text-sm font-bold text-slate-400">/ mes</span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1 space-x-1">
                    <span className="text-slate-300 font-semibold">{basePrice.toFixed(2)} € base</span>
                    <span>+</span>
                    <span className="text-blue-400 font-semibold">21% IVA ({ivaAmount.toFixed(2)} €)</span>
                  </div>
                  <span className="inline-block text-[10px] font-bold text-amber-400/90 tracking-wide mt-1 uppercase">
                    Exclusivamente cuota mensual · Sin permanencia oculta
                  </span>
                </div>
              </div>

              {/* Banner de Garantía y SLA */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Soporte técnico directo por WhatsApp</span>
                </div>
                <div className="flex items-center gap-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Carta QR y Lonja en tiempo real</span>
                </div>
                <div className="flex items-center gap-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Recibo mensual deducible en IRPF / IVA</span>
                </div>
              </div>
            </div>

            {/* ==============================================================================
               2. SELECTOR DE PLANES CON CONTROL EN VIVO DE LAS 5 PLAZAS FUNDADOR
               ============================================================================== */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <span>1. Elige tu Plan Mensual</span>
                    <span className="text-xs font-normal text-slate-400">(Precios siempre + IVA)</span>
                  </h2>
                </div>

                {/* Badge en vivo de Plazas Fundador */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-lg shadow-amber-500/10">
                  <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                  <span>
                    {founderSlotsRemaining > 0
                      ? `🔥 Quedan ${founderSlotsRemaining} de ${FOUNDER_SLOTS_MAX} Plazas Fundador en Noia`
                      : '❌ 5 de 5 Plazas Fundador Ocupadas'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Plan Carta QR */}
                <div
                  onClick={() => setSelectedPlan('carta')}
                  className={`cursor-pointer rounded-2xl p-5 transition-all relative backdrop-blur-xl border flex flex-col justify-between ${
                    selectedPlan === 'carta'
                      ? 'bg-blue-600/15 border-blue-500 shadow-xl shadow-blue-500/15 scale-[1.02]'
                      : 'bg-slate-900/50 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Plan Básico</span>
                      {selectedPlan === 'carta' && (
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-white text-lg mb-1">Carta QR</h3>
                    <div className="mb-3">
                      <span className="text-2xl font-black text-white">39 €</span>
                      <span className="text-xs font-bold text-blue-400 ml-1">/ mes + IVA</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Carta interactiva multi-idioma, filtros de alérgenos y actualización de precios y lonja al instante.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-blue-400" />
                    <span>Autónomo para comensales</span>
                  </div>
                </div>

                {/* 2. Plan Sala */}
                <div
                  onClick={() => setSelectedPlan('sala')}
                  className={`cursor-pointer rounded-2xl p-5 transition-all relative backdrop-blur-xl border flex flex-col justify-between ${
                    selectedPlan === 'sala'
                      ? 'bg-blue-600/15 border-blue-500 shadow-xl shadow-blue-500/15 scale-[1.02]'
                      : 'bg-slate-900/50 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Plan Sala</span>
                      {selectedPlan === 'sala' && (
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-white text-lg mb-1">Sala</h3>
                    <div className="mb-3">
                      <span className="text-2xl font-black text-white">69 €</span>
                      <span className="text-xs font-bold text-blue-400 ml-1">/ mes + IVA</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Carta QR + Comandero móvil para camareros en sala y control de estado de mesas (sin KDS de cocina).
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Mozo y gestión de mesas</span>
                  </div>
                </div>

                {/* 3. Plan Full Fundador (Destacado con control de cupo) */}
                <div
                  onClick={() => {
                    if (isFounderAvailable) {
                      setSelectedPlan('full_fundador')
                    }
                  }}
                  className={`relative rounded-2xl p-5 transition-all backdrop-blur-xl border flex flex-col justify-between ${
                    !isFounderAvailable
                      ? 'opacity-40 cursor-not-allowed bg-slate-900/20 border-white/5'
                      : selectedPlan === 'full_fundador'
                        ? 'bg-gradient-to-b from-amber-500/20 to-orange-500/10 border-amber-500/80 shadow-2xl shadow-amber-500/20 scale-[1.02] cursor-pointer ring-1 ring-amber-500/50'
                        : 'bg-slate-900/50 border-amber-500/30 hover:border-amber-500/60 cursor-pointer'
                  }`}
                >
                  {/* Badge Exclusivo */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap">
                    Pacto Fundador
                  </div>

                  <div>
                    <div className="flex justify-between items-start mb-3 pt-1">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        Bonificado
                      </span>
                      {selectedPlan === 'full_fundador' && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-white text-lg mb-1">Full Fundador</h3>
                    <div className="mb-1">
                      <span className="text-2xl font-black text-amber-300">{FOUNDER_PRICE_EUR} €</span>
                      <span className="text-xs font-bold text-amber-400 ml-1">/ mes + IVA</span>
                    </div>
                    <span className="text-[11px] text-amber-300/80 font-medium block mb-2">
                      Primeros 12 meses (luego 99 €/mes + IVA)
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Ecosistema completo: Carta QR + Comandero Sala + KDS Cocina + CRM Fidelización.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ahorro de 588 € el primer año</span>
                  </div>
                </div>

                {/* 4. Plan Full Estándar */}
                <div
                  onClick={() => setSelectedPlan('full')}
                  className={`cursor-pointer rounded-2xl p-5 transition-all relative backdrop-blur-xl border flex flex-col justify-between ${
                    selectedPlan === 'full'
                      ? 'bg-blue-600/15 border-blue-500 shadow-xl shadow-blue-500/15 scale-[1.02]'
                      : 'bg-slate-900/50 border-white/10 hover:border-white/20 hover:bg-slate-900/80'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Sin Cupo</span>
                      {selectedPlan === 'full' && (
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-white text-lg mb-1">Full Estándar</h3>
                    <div className="mb-3">
                      <span className="text-2xl font-black text-white">99 €</span>
                      <span className="text-xs font-bold text-blue-400 ml-1">/ mes + IVA</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Ecosistema íntegro sin requisitos de feedback: Carta QR, Comandero, Pantalla KDS y CRM de Clientes.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Suite gastronómica completa</span>
                  </div>
                </div>
              </div>

              {/* Casilla de Compromiso Obligatoria para Plan Full Fundador */}
              {selectedPlan === 'full_fundador' && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md animate-in fade-in duration-200">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={founderCommitment}
                      onChange={(e) => setFounderCommitment(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-amber-500/40 text-amber-500 focus:ring-amber-500 bg-slate-900/80"
                    />
                    <div className="text-xs text-amber-200/90 leading-relaxed">
                      <span className="font-bold text-amber-300 block mb-0.5">
                        Casilla de Compromiso Obligatoria — Pacto Fundador Noia:
                      </span>
                      &quot;Acepto el Pacto Fundador (50 €/mes + IVA durante 12 meses) y me comprometo a dar feedback
                      quincenal de uso y un testimonio/caso de éxito para Fluxo.&quot;
                    </div>
                  </label>
                </div>
              )}

              {/* Enlace secundario: Modo Hibernación */}
              <div className="mt-4 flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>
                    ¿Tu local es de temporada o cierra en invierno? Consulta el{' '}
                    <strong className="text-white">Modo Hibernación (9 €/mes + IVA)</strong> para conservar carta, QR e
                    historial.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlan('hibernacion')}
                  className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${
                    selectedPlan === 'hibernacion'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'text-slate-300 hover:text-white border-white/10 hover:bg-white/5'
                  }`}
                >
                  {selectedPlan === 'hibernacion' ? 'Seleccionado (9 €/mes + IVA)' : 'Elegir Hibernación'}
                </button>
              </div>
            </div>

            {/* ==============================================================================
               3. SELECTOR OBLIGATORIO DE DÍA DE COBRO (billing_day: Días 1 al 5)
               ============================================================================== */}
            <div className="backdrop-blur-2xl bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span>2. Elige tu Día Mensual de Cobro (Día 1 al 5)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Elige qué día entre el 1 y el 5 prefieres que se procese tu cuota mensual. Se asociará a tu cuenta
                    como fecha de cobro recurrente garantizada.
                  </p>
                </div>

                <div className="hidden sm:block text-right">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    Día Seleccionado: {billingDay}
                  </span>
                </div>
              </div>

              {/* Selector de Píldoras 1 al 5 */}
              <div className="grid grid-cols-5 gap-2 sm:gap-4 mt-3">
                {[1, 2, 3, 4, 5].map((day) => {
                  const isSelected = billingDay === day
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setBillingDay(day)}
                      className={`py-3 sm:py-4 px-2 rounded-2xl font-bold text-sm sm:text-base flex flex-col items-center justify-center transition-all border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-105 ring-2 ring-blue-400/50'
                          : 'bg-white/[0.03] text-slate-300 border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className="text-xs uppercase tracking-wider opacity-75 font-normal">Día</span>
                      <span className="text-xl sm:text-2xl font-black mt-0.5">{day}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span>
                  Tu factura con desglose de IVA oficial se emitirá y enviará por correo el día {billingDay} de cada mes.
                </span>
              </div>
            </div>

            {/* ==============================================================================
               4. MOTOR DE PAGO DUAL (AUTOMÁTICO CON STRIPE + MANUAL CON COMPROBANTE)
               ============================================================================== */}
            <div className="backdrop-blur-2xl bg-slate-900/60 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>3. Modalidad de Pago</span>
              </h2>

              {/* Pestañas Duales */}
              <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-950/80 border border-white/10 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentTab('stripe')}
                  className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    paymentTab === 'stripe'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pago Automático (Stripe)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTab('manual')}
                  className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                    paymentTab === 'manual'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Pago Manual (Bizum / Transfer)</span>
                </button>
              </div>

              {/* Mensajes de error globales */}
              {uploadError && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {paymentTab === 'stripe' ? (
                /* ==============================================================================
                   PESTAÑA A: PAGO AUTOMÁTICO INSTANTÁNEO (STRIPE)
                   ============================================================================== */
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                    <div className="flex items-center gap-3 text-slate-300 text-xs">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Soporta <strong>Tarjeta de Débito/Crédito</strong> (Visa, Mastercard, Amex)</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-xs">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>Soporta <strong>Apple Pay</strong> y Google Pay en un toque</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-xs">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span>Soporta <strong>Domiciliación Bancaria SEPA</strong> para cobros recurrentes sin fricción</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold block text-white mb-0.5">Total a abonar en el primer mes:</span>
                      <span>
                        {basePrice.toFixed(2)} € base + 21% IVA ({ivaAmount.toFixed(2)} €) = <strong>{totalAmount.toFixed(2)} €</strong>
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-blue-300 bg-blue-500/20 px-2 py-1 rounded-md">
                      Día de cobro: {billingDay}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleStripeCheckout}
                    disabled={submitting || (selectedPlan === 'full_fundador' && !founderCommitment)}
                    className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide text-white flex items-center justify-center gap-2.5 shadow-xl transition-all ${
                      submitting || (selectedPlan === 'full_fundador' && !founderCommitment)
                        ? 'opacity-50 cursor-not-allowed bg-slate-800'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/30 hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Conectando con Stripe Seguro...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Pagar {totalAmount.toFixed(2)} € con Stripe y Activar en Vivo</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* ==============================================================================
                   PESTAÑA B: PAGO MANUAL ASISTIDO (BIZUM, TRANSFERENCIA, EFECTIVO)
                   ============================================================================== */
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Selector de Método Manual */}
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setManualMethod('bizum')}
                      className={`p-3.5 rounded-2xl text-xs font-bold border transition-all ${
                        manualMethod === 'bizum'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                          : 'bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10'
                      }`}
                    >
                      Bizum Inmediato
                    </button>

                    <button
                      type="button"
                      onClick={() => setManualMethod('transfer')}
                      className={`p-3.5 rounded-2xl text-xs font-bold border transition-all ${
                        manualMethod === 'transfer'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                          : 'bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10'
                      }`}
                    >
                      Transferencia IBAN
                    </button>

                    <button
                      type="button"
                      onClick={() => setManualMethod('cash')}
                      className={`p-3.5 rounded-2xl text-xs font-bold border transition-all ${
                        manualMethod === 'cash'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                          : 'bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10'
                      }`}
                    >
                      Efectivo en Mano
                    </button>
                  </div>

                  {/* Instrucciones según método manual */}
                  {manualMethod === 'bizum' && (
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Teléfono Oficial Bizum:</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('+34 711 573 870', 'bizum')}
                          className="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
                        >
                          {copiedKey === 'bizum' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>+34 711 573 870</span>
                        </button>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        Envía <strong>{totalAmount.toFixed(2)} €</strong> (IVA incluido) indicando en el concepto exacto:{' '}
                        <strong className="text-white font-mono">{restaurantName} - Mes</strong>.
                      </div>
                    </div>
                  )}

                  {manualMethod === 'transfer' && (
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Cuenta IBAN España:</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('ES91 2100 0418 4502 0005 1332', 'iban')}
                          className="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
                        >
                          {copiedKey === 'iban' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>ES91 2100 0418 4502 0005 1332</span>
                        </button>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed">
                        Beneficiario: <strong>Fluxo Gastronomic System</strong>. Concepto:{' '}
                        <strong className="text-white font-mono">{restaurantName} - Cuota Mensual</strong>. Importe:{' '}
                        <strong>{totalAmount.toFixed(2)} €</strong>.
                      </div>
                    </div>
                  )}

                  {manualMethod === 'cash' && (
                    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                      <span className="text-xs text-slate-400 font-semibold block">Entrega Presencial:</span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Entrega presencial acordada con el agente de Noia. Se emitirá el recibo digital de inmediato.
                        Importe exacto: <strong>{totalAmount.toFixed(2)} €</strong> (IVA 21% incluido).
                      </p>
                    </div>
                  )}

                  {/* REGLA ESTRICTA DE BLOQUEO: Subida obligatoria de comprobante */}
                  <div className="p-5 rounded-2xl bg-slate-950/70 border border-emerald-500/30 relative">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                      Comprobante de Pago Obligatorio (Foto o PDF)
                    </span>
                    <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                      Para prevenir activaciones ficticias, sube la captura de pantalla de Bizum, el justificante bancario
                      o el acuse de recibo. Se almacenará en el bucket seguro de Supabase y pasará al Semáforo del CRM.
                    </p>

                    <label
                      htmlFor="proof-upload"
                      className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        proofStoragePath
                          ? 'border-emerald-500/60 bg-emerald-500/10'
                          : 'border-white/10 hover:border-emerald-500/40 bg-white/[0.01]'
                      }`}
                    >
                      <input
                        id="proof-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      {uploadingProof ? (
                        <div className="flex flex-col items-center gap-2">
                          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                          <span className="text-xs text-slate-300">Subiendo comprobante a Supabase Storage...</span>
                        </div>
                      ) : proofStoragePath ? (
                        <div className="flex flex-col items-center gap-2 text-center">
                          <FileCheck className="w-8 h-8 text-emerald-400" />
                          <span className="text-xs font-bold text-white">{proofFile?.name}</span>
                          <span className="text-[11px] text-emerald-400 font-mono">
                            ✓ Comprobante subido correctamente a Supabase
                          </span>
                          <span className="text-[10px] text-slate-400 underline mt-1">Haz clic para reemplazar</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-center">
                          <UploadCloud className="w-8 h-8 text-slate-400" />
                          <span className="text-xs font-semibold text-slate-200">
                            Arrastra o haz clic para subir tu comprobante
                          </span>
                          <span className="text-[11px] text-slate-500">PNG, JPG, WebP o PDF (máx. 10 MB)</span>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Botón con bloqueo estricto */}
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={
                      !proofStoragePath ||
                      submitting ||
                      (selectedPlan === 'full_fundador' && !founderCommitment)
                    }
                    className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide text-white flex items-center justify-center gap-2.5 shadow-xl transition-all ${
                      !proofStoragePath ||
                      submitting ||
                      (selectedPlan === 'full_fundador' && !founderCommitment)
                        ? 'opacity-40 cursor-not-allowed bg-slate-800'
                        : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Validando comprobante...</span>
                      </>
                    ) : !proofStoragePath ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Adjunta el Comprobante para Habilitar Activación</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Enviar Comprobante y Solicitar Activación ({totalAmount.toFixed(2)} €)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PIE DE PÁGINA TRANSPARENTE */}
        <div className="mt-12 text-center text-xs text-slate-500 space-y-1">
          <p>Fluxo — Gastronomic System · Noia, Galicia · contactofluxosystem@gmail.com</p>
          <p>Todos los precios se facturan en euros (+ IVA 21%) conforme al Régimen General Tributario de España.</p>
        </div>
      </div>
    </div>
  )
}
