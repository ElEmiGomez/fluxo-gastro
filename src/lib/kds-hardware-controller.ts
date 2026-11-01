// ============================================================================
// Fluxo KDS - Hardware & Push-to-Talk Controller (Spacebar / USB Pedal / STT)
// ============================================================================

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  playAckBeep,
  playDoneBeep,
  playUndoBeep,
  parseVoiceCommand,
} from '@/lib/kds-audio-engine'

export interface UndoBufferItem {
  tableNumber: string | number
  orderIds: string[]
  completedAt: number
  expiresAt: number
}

interface UseKdsHardwareProps {
  fifoTableNumbers: (string | number)[]
  onCompleteTable: (tableNumber: string | number) => Promise<void> | void
  onPrepareTable: (tableNumber: string | number) => Promise<void> | void
  onRestoreTable: (tableNumber: string | number, orderIds: string[]) => Promise<void> | void
}

export function useKdsHardwareController({
  fifoTableNumbers,
  onCompleteTable,
  onPrepareTable,
  onRestoreTable,
}: UseKdsHardwareProps) {
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false)
  const [lastTranscript, setLastTranscript] = useState<string | null>(null)
  const [undoItem, setUndoItem] = useState<UndoBufferItem | null>(null)
  const [undoProgressPct, setUndoProgressPct] = useState(100)

  const lastSpacePressTimeRef = useRef<number>(0)
  const recognitionRef = useRef<any>(null)
  const undoItemRef = useRef<UndoBufferItem | null>(null)
  const isHoldingVRef = useRef(false)

  undoItemRef.current = undoItem

  // 1. Deshacer el ticket archivado
  const executeUndo = useCallback(() => {
    const current = undoItemRef.current
    if (!current) return
    if (Date.now() > current.expiresAt) {
      setUndoItem(null)
      return
    }

    playUndoBeep()
    onRestoreTable(current.tableNumber, current.orderIds)
    setUndoItem(null)
  }, [onRestoreTable])

  // 2. Archivar ticket más antiguo en FIFO (Primero de la izquierda)
  const completeOldestTable = useCallback(() => {
    if (fifoTableNumbers.length === 0) return

    const targetTable = fifoTableNumbers[0]
    playDoneBeep()

    // Abrir ventana de recuperación de 10 segundos
    const now = Date.now()
    const buffer: UndoBufferItem = {
      tableNumber: targetTable,
      orderIds: [], // El backend o estado lo resuelve por mesa
      completedAt: now,
      expiresAt: now + 10000,
    }
    setUndoItem(buffer)

    onCompleteTable(targetTable)
  }, [fifoTableNumbers, onCompleteTable])

  // Temporizador de barra de progreso del Undo (10 segundos)
  useEffect(() => {
    if (!undoItem) {
      setUndoProgressPct(100)
      return
    }

    const interval = setInterval(() => {
      const remainingMs = undoItem.expiresAt - Date.now()
      if (remainingMs <= 0) {
        setUndoItem(null)
        setUndoProgressPct(0)
        clearInterval(interval)
      } else {
        setUndoProgressPct(Math.max(0, (remainingMs / 10000) * 100))
      }
    }, 100)

    return () => clearInterval(interval)
  }, [undoItem])

  // 3. Inicializar SpeechRecognition para Push-to-Talk con tecla V
  useEffect(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass()
        recognition.continuous = true
        recognition.interimResults = false
        recognition.lang = 'es-ES'

        recognition.onresult = (event: any) => {
          const results = event.results
          const lastResult = results[results.length - 1]
          if (lastResult && lastResult[0]) {
            const transcript = lastResult[0].transcript
            setLastTranscript(transcript)
            const cmd = parseVoiceCommand(transcript)

            if (cmd.type === 'oido' && cmd.tableNumber) {
              playAckBeep()
              onPrepareTable(cmd.tableNumber)
            } else if (cmd.type === 'listo' && cmd.tableNumber) {
              playDoneBeep()
              onCompleteTable(cmd.tableNumber)
            }
          }
        }

        recognition.onerror = (e: any) => {
          if (e.error !== 'no-speech') {
            console.warn('[KdsSTT] Recognition error:', e.error)
          }
        }

        recognitionRef.current = recognition
      } catch (e) {
        console.warn('[KdsSTT] Failed to initialize SpeechRecognition:', e)
      }
    }
  }, [onPrepareTable, onCompleteTable])

  const startVoiceInput = useCallback(() => {
    if (isPushToTalkActive) return
    setIsPushToTalkActive(true)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch {
        // Ya iniciado
      }
    }
  }, [isPushToTalkActive])

  const stopVoiceInput = useCallback(() => {
    setIsPushToTalkActive(false)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignorar
      }
    }
  }, [])

  // 4. Escucha de teclado global para Barra Espaciadora / Pedal USB, Ctrl+Z y Tecla V
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input o textarea
      const targetTag = (e.target as HTMLElement)?.tagName
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return
      }

      // Deshacer con Ctrl + Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        executeUndo()
        return
      }

      // Push-to-Talk con tecla V (mantener pulsada)
      if ((e.key === 'v' || e.key === 'V') && !e.repeat && !isHoldingVRef.current) {
        isHoldingVRef.current = true
        startVoiceInput()
        return
      }

      // Barra Espaciadora / Pedal USB
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault() // Prevenir scroll nativo de la pantalla
        if (e.repeat) return // Ignorar eventos de repetición por tecla retenida

        const now = Date.now()
        const diff = now - lastSpacePressTimeRef.current

        // Doble pulsación rápida de Espacio (< 350ms): Deshacer
        if (diff < 350 && undoItemRef.current) {
          executeUndo()
          lastSpacePressTimeRef.current = 0
          return
        }

        lastSpacePressTimeRef.current = now
        completeOldestTable()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'v' || e.key === 'V') {
        isHoldingVRef.current = false
        stopVoiceInput()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [completeOldestTable, executeUndo, startVoiceInput, stopVoiceInput])

  return {
    isPushToTalkActive,
    startVoiceInput,
    stopVoiceInput,
    lastTranscript,
    undoItem,
    undoProgressPct,
    executeUndo,
    completeOldestTable,
  }
}
