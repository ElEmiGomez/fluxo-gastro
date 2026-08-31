/**
 * Utilidad para Haptic Feedback (Vibración táctil) en dispositivos móviles
 * Aporta sensación de aplicación nativa iOS / Android al interactuar con la PWA.
 */
export function triggerHaptic(pattern: number | number[] = 40) {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Los navegadores que no soportan o bloquean la vibración fallan silenciosamente
    }
  }
}

// Patrones predefinidos de vibración
export const HAPTIC_PATTERNS = {
  TAP: 30,             // Toque ligero (seleccionar píldora, botón simple)
  ADD_CART: 45,        // Añadir producto al carrito
  QUANTITY: 35,        // Cambiar cantidad + / -
  SUCCESS: [40, 60, 80], // Pedido enviado con éxito
  SERVICE_CALL: [60, 50, 60], // Mozo llamado
  WARNING: [80, 50, 80], // Alerta o error
}
