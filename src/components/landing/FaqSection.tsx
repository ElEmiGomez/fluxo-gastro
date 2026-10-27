'use client'

import React, { useState } from 'react'
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react'
import { ScrollReveal } from './ScrollReveal'

interface FaqItem {
  question: string
  answer: string
}

const FAQS: FaqItem[] = [
  {
    question: '¿Tengo que comprar pantallas o TPVs nuevos?',
    answer:
      'No. Fluxo corre desde cualquier navegador web moderno en cualquier teléfono Android/iPhone, tablet o Smart TV que ya tengas en el local. Cero inversión en hardware propietario.',
  },
  {
    question: '¿Cuánto tarda el personal en aprender a usarlo?',
    answer:
      'El sistema está diseñado para que un camarero nuevo empiece a marchar comandas en menos de 5 minutos desde su propio móvil. Es tan intuitivo como usar WhatsApp.',
  },
  {
    question: '¿Qué pasa si un día se cae la conexión a internet?',
    answer:
      'El sistema mantiene el estado local activo en sala y sincroniza las órdenes en cuanto recupera señal, evitando perder comandas o bloquear el servicio del local.',
  },
  {
    question: '¿Hay permanencia obligatoria?',
    answer:
      'Ninguna. No creemos en atar a los hosteleros con contratos anuales ni penalizaciones. Puedes darte de baja en cualquier momento con un clic desde tu panel.',
  },
  {
    question: '¿Cómo se sube mi carta de platos?',
    answer:
      'Nos envías una foto o PDF de tu carta actual y nosotros te entregamos el menú configurado con fotos, precios y alérgenos en 24 horas durante tu piloto gratuito.',
  },
]

interface FaqSectionProps {
  whatsAppUrl: string
}

export function FaqSection({ whatsAppUrl }: FaqSectionProps) {
  // Primer FAQ abierto por defecto para fomentar lectura
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section id="faq" className="py-20 bg-slate-900/80 border-t border-slate-800 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal distance={24}>
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-black uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Respuestas Claras</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Preguntas Frecuentes
            </h2>

            <p className="text-sm sm:text-base text-slate-400">
              Resolvemos las dudas habituales de los hosteleros antes de empezar el piloto gratuito.
            </p>
          </div>
        </ScrollReveal>

        {/* Acordeón de FAQs */}
        <div className="space-y-3.5">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <ScrollReveal key={index} delay={index * 50} distance={16}>
                <div
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-slate-800/90 border-blue-500/50 shadow-lg shadow-blue-500/5'
                      : 'bg-slate-800/40 hover:bg-slate-800/70 border-slate-700/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span className="text-base sm:text-lg font-black text-white">
                      «{faq.question}»
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                        isOpen
                          ? 'rotate-180 bg-blue-500/20 text-blue-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${index}`}
                      className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-slate-300 leading-relaxed border-t border-slate-700/50 pt-3 animate-in fade-in duration-200"
                    >
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            )
          })}
        </div>

        {/* Contacto directo por dudas adicionales */}
        <div className="mt-12 text-center p-6 rounded-2xl bg-slate-800/30 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h4 className="font-extrabold text-white text-sm">¿Tienes una pregunta específica sobre tu local?</h4>
            <p className="text-xs text-slate-400">
              Escríbenos directamente por WhatsApp y te respondemos en menos de 15 minutos.
            </p>
          </div>

          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all flex-shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Consultar por WhatsApp</span>
          </a>
        </div>

      </div>
    </section>
  )
}
