// ============================================================================
// Fluxo KDS - Native Audio, Beep & Speech Engine (AudioContext + TTS + STT)
// ============================================================================

import { Order } from '@/types/database.types'
import { isDrinkItem, getItemCourse } from '@/lib/course-utils'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

/**
 * 1. playAckBeep(): 880 Hz durante 120ms al reconocer un comando válido
 */
export function playAckBeep() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.12)
  } catch (err) {
    console.warn('[KdsAudio] Ack beep prevented:', err)
  }
}

/**
 * 2. playDoneBeep(): Doble pulso (880 Hz -> 1174 Hz) al completar mesa
 */
export function playDoneBeep() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Pulso 1: 880 Hz
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'triangle'
    osc1.frequency.setValueAtTime(880, now)
    gain1.gain.setValueAtTime(0.25, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.1)

    // Pulso 2: 1174 Hz
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(1174, now + 0.12)
    gain2.gain.setValueAtTime(0.3, now + 0.12)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.12)
    osc2.stop(now + 0.28)
  } catch (err) {
    console.warn('[KdsAudio] Done beep prevented:', err)
  }
}

/**
 * 3. playUndoBeep(): Pulso inverso (600 Hz -> 900 Hz) al deshacer
 */
export function playUndoBeep() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.18)

    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.18)
  } catch (err) {
    console.warn('[KdsAudio] Undo beep prevented:', err)
  }
}

/**
 * 4. announceIncomingOrder(order): Filtro Acústico Selectivo (TTS en español)
 * Ignora todas las bebidas (estación 'bar') y locuta exclusivamente platos de cocina.
 */
export function announceIncomingOrder(order: Order, forceTest = false) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  // Filtrar estrictamente: solo ítems de cocina
  const kitchenItems = (order.order_items || []).filter(item => {
    if (isDrinkItem(item) || getItemCourse(item) === 'drink') return false
    return true
  })

  // Si no hay comida (solo bebidas), se silencia en cocina (se enruta a barra)
  if (kitchenItems.length === 0 && !forceTest) {
    return { announced: false, reason: 'Solo bebidas - silenciado en cocina' }
  }

  try {
    window.speechSynthesis.cancel() // Limpiar cola previa

    const tableNum = order.table?.table_number ?? order.table_number ?? '1'
    const itemsSummary = kitchenItems
      .slice(0, 3)
      .map(i => `${i.quantity || 1} ${(i.product?.name || (i as any).name || 'plato')}`)
      .join(', ')

    const text = `Comanda mesa ${tableNum}. ${itemsSummary}`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'
    utterance.rate = 1.05
    utterance.pitch = 1.0
    utterance.volume = 1.0

    window.speechSynthesis.speak(utterance)
    return { announced: true, text }
  } catch (err) {
    console.warn('[KdsTTS] Speech synthesis error:', err)
    return { announced: false, error: err }
  }
}

/**
 * Diccionario de números en español a dígitos numéricos
 */
const SPANISH_NUMBERS: Record<string, string> = {
  uno: '1',
  una: '1',
  un: '1',
  dos: '2',
  tres: '3',
  cuatro: '4',
  cinco: '5',
  seis: '6',
  siete: '7',
  ocho: '8',
  nueve: '9',
  diez: '10',
  once: '11',
  doce: '12',
  trece: '13',
  catorce: '14',
  quince: '15',
  dieciséis: '16',
  diecisiete: '17',
  dieciocho: '18',
  diecinueve: '19',
  veinte: '20',
  veintiuno: '21',
  veintidós: '22',
  veintitrés: '23',
  veinticuatro: '24',
  veinticinco: '25',
}

/**
 * Normaliza un texto de voz y extrae el comando y número de mesa:
 * - "oído mesa 4" / "oído mesa cuatro"
 * - "listo mesa 4" / "listo mesa cuatro"
 */
export function parseVoiceCommand(transcript: string): {
  type: 'oido' | 'listo' | null
  tableNumber: string | null
  raw: string
} {
  let normalized = transcript.toLowerCase().trim()
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar tildes

  // Reemplazar números en texto por dígitos
  Object.entries(SPANISH_NUMBERS).forEach(([word, digit]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'g')
    normalized = normalized.replace(regex, digit)
  })

  // Evaluar "oido mesa X" o "listo mesa X"
  const oidoMatch = normalized.match(/\b(?:oido|odo|enterado|marchando)\s+mesa\s+(\d+|terraza\s*\d+|barra\s*\d+)\b/i)
  if (oidoMatch) {
    return {
      type: 'oido',
      tableNumber: oidoMatch[1].replace(/\s+/g, ''),
      raw: transcript,
    }
  }

  const listoMatch = normalized.match(/\b(?:listo|pase|terminado|completado)\s+mesa\s+(\d+|terraza\s*\d+|barra\s*\d+)\b/i)
  if (listoMatch) {
    return {
      type: 'listo',
      tableNumber: listoMatch[1].replace(/\s+/g, ''),
      raw: transcript,
    }
  }

  return { type: null, tableNumber: null, raw: transcript }
}
