/**
 * Normaliza un nombre o slug comercial a formato URL-safe en minúsculas sin tildes.
 */
export function normalizeSlug(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
