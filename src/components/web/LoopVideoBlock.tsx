'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'

export interface LoopVideoBlockProps {
  posterSrc: string
  frames?: string[]
  videoMp4Url?: string
  videoWebmUrl?: string
  alt: string
  aspectClass?: string
  className?: string
  priorityPoster?: boolean
}

const SLIDE_DURATION_MS = 5200
const CROSSFADE_MS = 1400

function smoothstep(edge: number): number {
  const t = Math.min(Math.max(edge, 0), 1)
  return t * t * (3 - 2 * t)
}

function drawCoverFrame(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number,
  zoom: number,
  panX: number,
  panY: number
) {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  if (!iw || !ih || !cw || !ch) return

  const baseScale = Math.max(cw / iw, ch / ih)
  const drawW = iw * baseScale * zoom
  const drawH = ih * baseScale * zoom
  const extraX = Math.max(0, drawW - cw)
  const extraY = Math.max(0, drawH - ch)

  const dx = -extraX * 0.5 + panX * (extraX * 0.42)
  const dy = -extraY * 0.5 + panY * (extraY * 0.42)

  ctx.drawImage(img, dx, dy, drawW, drawH)
}

export function LoopVideoBlock({
  posterSrc,
  frames,
  videoMp4Url,
  videoWebmUrl,
  alt,
  aspectClass = 'aspect-video w-full',
  className = '',
  priorityPoster = false,
}: LoopVideoBlockProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)

  const sourceList = useMemo(() => {
    const raw = [posterSrc, ...(frames || [])].filter(Boolean)
    return Array.from(new Set(raw))
  }, [posterSrc, frames])

  const hasVideoStream = Boolean((videoMp4Url || videoWebmUrl) && !videoFailed)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (hasVideoStream && !prefersReducedMotion) return
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas || sourceList.length === 0) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let isDisposed = false
    let rafId = 0
    let isVisible = true
    let startTime = 0
    let cw = 0
    let ch = 0
    let readyNotified = false

    const loadedImages: (HTMLImageElement | null)[] = new Array(sourceList.length).fill(null)

    const markReady = () => {
      if (!readyNotified) {
        readyNotified = true
        setCanvasReady(true)
      }
    }

    const paintFrame = (elapsedMs: number) => {
      if (!cw || !ch) return
      const primary = loadedImages[0]
      if (!primary || !primary.complete || primary.naturalWidth === 0) return

      ctx.globalAlpha = 1

      if (prefersReducedMotion || sourceList.length === 1) {
        const t = prefersReducedMotion ? 0 : elapsedMs
        const zoom = prefersReducedMotion
          ? 1
          : 1.035 + 0.035 * Math.sin(t * 0.00055 - Math.PI / 2)
        const panX = prefersReducedMotion ? 0 : Math.sin(t * 0.00038)
        const panY = prefersReducedMotion ? 0 : Math.cos(t * 0.00031)
        drawCoverFrame(ctx, primary, cw, ch, zoom, panX, panY)
        markReady()
        return
      }

      const count = sourceList.length
      const cycleDuration = count * SLIDE_DURATION_MS
      const cycleTime = elapsedMs % cycleDuration
      const currIdx = Math.floor(cycleTime / SLIDE_DURATION_MS)
      const nextIdx = (currIdx + 1) % count
      const slideElapsed = cycleTime - currIdx * SLIDE_DURATION_MS
      const slideProgress = slideElapsed / SLIDE_DURATION_MS

      const currImg = loadedImages[currIdx] || primary
      const nextImg = loadedImages[nextIdx]

      const easedZoomCurr = 1 + 0.07 * (0.5 - 0.5 * Math.cos(Math.PI * slideProgress))
      const dirCurr = currIdx % 2 === 0 ? 1 : -1
      const panXCurr = dirCurr * Math.sin((slideProgress - 0.5) * Math.PI * 0.85)
      const panYCurr = -dirCurr * 0.45 * Math.cos(slideProgress * Math.PI)

      drawCoverFrame(ctx, currImg, cw, ch, easedZoomCurr, panXCurr, panYCurr)

      const fadeStart = SLIDE_DURATION_MS - CROSSFADE_MS
      if (
        slideElapsed > fadeStart &&
        nextImg &&
        nextImg.complete &&
        nextImg.naturalWidth > 0 &&
        nextIdx !== currIdx
      ) {
        const alpha = smoothstep((slideElapsed - fadeStart) / CROSSFADE_MS)
        const dirNext = nextIdx % 2 === 0 ? 1 : -1
        const nextWarmup = (slideElapsed - fadeStart) / SLIDE_DURATION_MS
        const nextZoom = 1 + 0.07 * (0.5 - 0.5 * Math.cos(Math.PI * nextWarmup))
        const nextPanX = dirNext * Math.sin((nextWarmup - 0.5) * Math.PI * 0.85)
        const nextPanY = -dirNext * 0.45 * Math.cos(nextWarmup * Math.PI)

        ctx.globalAlpha = alpha
        drawCoverFrame(ctx, nextImg, cw, ch, nextZoom, nextPanX, nextPanY)
        ctx.globalAlpha = 1
      }

      markReady()
    }

    const syncSize = () => {
      const rect = wrapper.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const nextW = Math.max(1, Math.round(rect.width * dpr))
      const nextH = Math.max(1, Math.round(rect.height * dpr))
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW
        canvas.height = nextH
      }
      cw = nextW
      ch = nextH
      paintFrame(startTime ? performance.now() - startTime : 0)
    }

    const tick = (now: number) => {
      if (isDisposed) return
      if (!startTime) startTime = now
      if (isVisible) {
        paintFrame(now - startTime)
      }
      if (!prefersReducedMotion && isVisible) {
        rafId = window.requestAnimationFrame(tick)
      } else {
        rafId = 0
      }
    }

    const ensureAnimating = () => {
      if (isDisposed || prefersReducedMotion || !isVisible || rafId) return
      rafId = window.requestAnimationFrame(tick)
    }

    sourceList.forEach((src, idx) => {
      const img = new window.Image()
      img.decoding = 'async'
      img.onload = () => {
        if (isDisposed) return
        loadedImages[idx] = img
        if (idx === 0) {
          syncSize()
          ensureAnimating()
        }
      }
      img.src = src
      if (img.complete && img.naturalWidth > 0) {
        loadedImages[idx] = img
      }
    })

    syncSize()

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncSize) : null
    if (resizeObserver) resizeObserver.observe(wrapper)

    const intersectionObserver =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              const visible = entries.some((entry) => entry.isIntersecting)
              isVisible = visible
              if (visible) {
                paintFrame(startTime ? performance.now() - startTime : 0)
                ensureAnimating()
              } else if (rafId) {
                window.cancelAnimationFrame(rafId)
                rafId = 0
              }
            },
            { rootMargin: '200px' }
          )
        : null
    if (intersectionObserver) intersectionObserver.observe(wrapper)

    ensureAnimating()

    return () => {
      isDisposed = true
      if (rafId) window.cancelAnimationFrame(rafId)
      if (resizeObserver) resizeObserver.disconnect()
      if (intersectionObserver) intersectionObserver.disconnect()
    }
  }, [hasVideoStream, prefersReducedMotion, sourceList])

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden bg-slate-900 ${aspectClass} ${className}`}
    >
      {/* Póster inmediato para LCP garantizado y fallback limpio */}
      <Image
        src={posterSrc}
        alt={alt}
        fill
        priority={priorityPoster}
        fetchPriority={priorityPoster ? 'high' : undefined}
        sizes={priorityPoster ? '100vw' : '(max-width: 768px) 100vw, 55vw'}
        className="object-cover object-center"
      />

      {hasVideoStream && !prefersReducedMotion ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={posterSrc}
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 w-full h-full object-cover"
        >
          {videoWebmUrl && <source src={videoWebmUrl} type="video/webm" />}
          {videoMp4Url && <source src={videoMp4Url} type="video/mp4" />}
        </video>
      ) : (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full block transition-opacity duration-500 ${
            canvasReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}
