import { redirect } from 'next/navigation'

/**
 * Ruta maestra de la demo comercial de Fluxo (destino del QR del Kit de Calle
 * físico). Redirige al prototipo público de Casa Mar Da Vila.
 */
export default function DemoPage() {
  redirect('/casamar-da-vila')
}
