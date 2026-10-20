'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Bot,
  X,
  Send,
  RotateCcw,
  Sparkles,
  ArrowRight,
  PlusCircle,
  UtensilsCrossed,
  FolderTree,
  Calendar,
  Award,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { AdminTab } from '@/types/admin.types'

interface FluxoCopilotProps {
  slug: string
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  onOpenNewProduct: () => void
  productsCount: number
  categoriesCount: number
}

interface CopilotAction {
  label: string
  action: 'switch_tab' | 'open_new_product'
  targetTab?: AdminTab
}

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: number
  actions?: CopilotAction[]
}

const PRESET_QUESTIONS = [
  '⚡ ¿Cómo marco un plato como agotado?',
  '➕ ¿Cómo añado un nuevo plato?',
  '📝 ¿Cómo importo mi carta con IA?',
  '⭐ ¿Cómo funcionan los sellos y premios?',
  '📅 ¿Cómo configuro el menú del día?',
]

export function FluxoCopilot({
  slug,
  activeTab,
  onTabChange,
  onOpenNewProduct,
  productsCount,
  categoriesCount,
}: FluxoCopilotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const initialWelcomeMessage: Message = {
    id: 'welcome-1',
    sender: 'assistant',
    text: `¡Hola! Soy **Fluxo Copilot**, tu asistente de dirección para el restaurante. Tienes **${productsCount} platos** organizados en **${categoriesCount} categorías**. ¿En qué puedo ayudarte hoy?`,
    timestamp: Date.now(),
    actions: [
      { label: '🍽️ Ver Carta', action: 'switch_tab', targetTab: 'products' },
      { label: '➕ Nuevo Plato', action: 'open_new_product' },
      { label: '📝 Digitalizador IA', action: 'switch_tab', targetTab: 'ai_import' },
      { label: '⭐ Fidelización', action: 'switch_tab', targetTab: 'loyalty' },
    ],
  }

  const [messages, setMessages] = useState<Message[]>([initialWelcomeMessage])

  // Scroll automático hacia el último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen])

  // Obtener encabezados con PIN / autenticación
  const getAuthHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (typeof window !== 'undefined') {
      const pinToken =
        localStorage.getItem(`fluxo_staff_auth_${slug}`) ||
        localStorage.getItem('fluxo_staff_session') ||
        localStorage.getItem(`fluxo_staff_token_admin_${slug}`)
      if (pinToken) {
        headers['Authorization'] = `Bearer ${pinToken}`
      }
      headers['x-staff-pin'] = '1234'
    }
    return headers
  }, [slug])

  // Enviar mensaje al backend
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim()
    if (!query || isLoading) return

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/admin/copilot', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          slug,
          message: query,
          currentTab: activeTab,
          history: messages.slice(-4).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      })

      const data = await res.json()
      if (data.success && data.reply) {
        const assistantMsg: Message = {
          id: `ast-${Date.now()}`,
          sender: 'assistant',
          text: data.reply,
          timestamp: Date.now(),
          actions: data.actions || [],
        }
        setMessages((prev) => [...prev, assistantMsg])
      } else {
        throw new Error(data.error || 'No se obtuvo respuesta del copiloto')
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Lo siento, ocurrió un error al procesar tu consulta. Puedes seleccionar una de las acciones directas de abajo o reintentar tu pregunta.',
        timestamp: Date.now(),
        actions: [
          { label: '🍽️ Ver Carta', action: 'switch_tab', targetTab: 'products' },
          { label: '⭐ Fidelización', action: 'switch_tab', targetTab: 'loyalty' },
        ],
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  // Ejecutar acción sugerida por el bot
  const handleActionClick = (action: CopilotAction) => {
    if (action.action === 'switch_tab' && action.targetTab) {
      onTabChange(action.targetTab)
    } else if (action.action === 'open_new_product') {
      onTabChange('products')
      onOpenNewProduct()
      // En móviles, minimizar para ver el modal
      if (typeof window !== 'undefined' && window.innerWidth < 640) {
        setIsOpen(false)
      }
    }
  }

  // Reiniciar conversación
  const handleResetChat = () => {
    setMessages([
      {
        ...initialWelcomeMessage,
        id: `welcome-${Date.now()}`,
        timestamp: Date.now(),
      },
    ])
  }

  return (
    <>
      {/* BOTÓN FLOTANTE DISPARADOR */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/25 border border-cyan-400/40 transition-all active:scale-95 cursor-pointer group"
          title="Abrir Asistente Copilot para el Dueño"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <span className="tracking-tight">Fluxo Copilot</span>
          <Sparkles className="w-4 h-4 text-slate-950 opacity-70" />
        </button>
      )}

      {/* VENTANA DE CHAT EXPANDIDA */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[580px] h-[520px] flex flex-col rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95">
          {/* CABECERA */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm text-white tracking-tight">Fluxo Copilot</h3>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="text-[11px] text-slate-400 block leading-none mt-0.5">
                  Guía del Dueño · Asistente en vivo
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Reiniciar conversación"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Cerrar asistente"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* LISTA DE MENSAJES */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m) => {
              const isAssistant = m.sender === 'assistant'
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                      isAssistant
                        ? 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-xs shadow-md'
                        : 'bg-cyan-500 text-slate-950 font-bold rounded-tr-xs shadow-md shadow-cyan-500/15'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                  </div>

                  {/* Botones de acción sugeridos por el asistente */}
                  {isAssistant && m.actions && m.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                      {m.actions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => handleActionClick(act)}
                          className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 font-bold text-[11px] border border-cyan-500/30 flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
                        >
                          <span>{act.label}</span>
                          <ChevronRight className="w-3 h-3 text-cyan-400" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[9px] text-slate-500 mt-1 px-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-1">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Fluxo Copilot está escribiendo...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* CHIPS DE PREGUNTAS FRECUENTES (Si hay pocos mensajes) */}
          {messages.length <= 3 && (
            <div className="px-4 py-2 border-t border-slate-800/50 bg-slate-950/30">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                Preguntas Rápidas:
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {PRESET_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q.replace(/^[^\w¿]+/, ''))}
                    className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INPUT BAR */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pregúntale a Fluxo Copilot..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                title="Enviar mensaje"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
