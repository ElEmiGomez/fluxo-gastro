'use client'

import React, { useState } from 'react'
import { ChevronDown, HelpCircle, Mail } from 'lucide-react'
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
      'El sistema está diseñado para que un camarero nuevo empiece a marchar comandas en menos de 5 minutos desde su propio móvil. Es tan intuitivo como usar una app de mensajería.',
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
  onOpenContact: () => void
}

export function FaqSection({ onOpenContact }: FaqSectionProps) {
  // 100% cerrado al inicio: ninguna FAQ abierta por defecto
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section id="faq" className="py-12 sm:py-20 bg-slate-50 border-t border-slate-200 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal distance={24}>
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-black uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Respuestas Claras</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Preguntas Frecuentes
            </h2>

            <p className="text-sm sm:text-base text-slate-600">
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
                      ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500/20'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                  >
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      «{faq.question}»
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                        isOpen
                          ? 'rotate-180 bg-blue-50 text-blue-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${index}`}
                      className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in duration-200"
                    >
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            )
          })}
        </div>

        {/* Contacto directo por dudas adicionales (100% correo electrónico) */}
        <div className="mt-12 text-center p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left space-y-1">
            <h4 className="font-extrabold text-slate-900 text-sm">¿Tienes una pregunta específica sobre tu local?</h4>
            <p className="text-xs text-slate-500">
              Envíanos tu consulta por correo y te respondemos en menos de 2 horas.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenContact}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition-all flex-shrink-0 cursor-pointer shadow-xs active:scale-95"
          >
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Consultar por Correo</span>
          </button>
        </div>

      </div>
    </section>
  )
}
