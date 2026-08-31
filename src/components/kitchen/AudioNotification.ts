/**
 * Sistema de Notificación Sonora para Cocina (KDS)
 * Utiliza Web Audio API para generar un sonido de campana/timbre de cocina claro y agradable
 * sin requerir dependencias de archivos externos ni problemas de carga de red en PWA.
 */

class AudioNotificationService {
  private audioCtx: AudioContext | null = null
  private unlocked = false

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        if (!this.unlocked) {
          const ctx = this.getAudioContext()
          if (ctx && ctx.state === 'suspended') {
            ctx.resume()
          }
          this.unlocked = true
        }
      }

      window.addEventListener('click', unlock, { once: true, passive: true })
      window.addEventListener('touchstart', unlock, { once: true, passive: true })
      window.addEventListener('keydown', unlock, { once: true, passive: true })
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass()
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {})
    }

    return this.audioCtx
  }

  /**
   * Reproduce el timbre característico de nueva comanda entrante (Ding-Dong de dos tonos)
   */
  public playNewOrderChime() {
    try {
      const ctx = this.getAudioContext()
      if (!ctx) return

      const now = ctx.currentTime

      // Tono 1 (Alto - 880 Hz / Nota La5)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()

      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(880, now)
      gain1.gain.setValueAtTime(0.3, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

      osc1.connect(gain1)
      gain1.connect(ctx.destination)

      osc1.start(now)
      osc1.stop(now + 0.45)

      // Tono 2 (Medio armónico - 1174.66 Hz / Nota Re6)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()

      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(1174.66, now + 0.15)
      gain2.gain.setValueAtTime(0.35, now + 0.15)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8)

      osc2.connect(gain2)
      gain2.connect(ctx.destination)

      osc2.start(now + 0.15)
      osc2.stop(now + 0.8)

    } catch (err) {
      console.warn('Audio notification prevented or not supported:', err)
    }
  }
}

export const kitchenAudio = new AudioNotificationService()

export function playKitchenChime() {
  kitchenAudio.playNewOrderChime()
}
