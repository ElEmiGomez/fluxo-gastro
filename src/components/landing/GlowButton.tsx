'use client'

import React from 'react'
import Link from 'next/link'

interface GlowButtonProps {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  href?: string
  className?: string
  icon?: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  external?: boolean
}

export function GlowButton({
  children,
  onClick,
  href,
  className = '',
  icon,
  type = 'button',
  external = false,
}: GlowButtonProps) {
  const content = (
    <>
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
        <span className="transition-transform duration-300 group-hover:translate-x-1 flex-shrink-0 inline-flex items-center">
          {icon || (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          )}
        </span>
      </span>
      {/* Micro-resplandor perimetral */}
      <div
        className="absolute inset-0 rounded-xl border border-white/20 ring-1 ring-sky-400/30 pointer-events-none"
        aria-hidden="true"
      />
      {/* Efecto de brillo de luz transversal al hacer hover */}
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full pointer-events-none"
        aria-hidden="true"
      />
    </>
  )

  const baseClasses =
    "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 bg-[length:200%_auto] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_25px_-5px_rgba(37,99,235,0.5)] transition-all duration-300 hover:bg-[right_center] hover:shadow-[0_0_35px_0_rgba(14,165,233,0.6)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"

  const combinedClasses = `${baseClasses} ${className}`.trim()

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedClasses}
        >
          {content}
        </a>
      )
    }
    return (
      <Link href={href} className={combinedClasses}>
        {content}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} className={combinedClasses}>
      {content}
    </button>
  )
}
