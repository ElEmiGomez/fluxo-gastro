import { redirect } from 'next/navigation'

/**
 * Ruta maestra de la demo comercial de Fluxo (destino del QR del Kit de Calle
 * físico). Redirige a la Carta Prototipo pública (/carta-prototipo).
 */
export default function DemoPage() {
  redirect('/carta-prototipo')
}
