#!/usr/bin/env node
/**
 * Sincronización bidireccional Fluxo CRM <-> Google Sheets ("Negocios a visitar")
 *
 * - Crea y mantiene únicamente las pestañas:
 *     - "CRM - Santiago, España" (city: Santiago de Compostela)
 *     - "CRM - Noia, España"     (city: Noia)
 * - NUNCA modifica ni borra las pestañas originales ("000_Leeme", "Elena, Cba, Arg", "Noia, España").
 *
 * Uso:
 *   node scripts/sync_crm_gsheets.mjs                  # sync bidireccional (pull + push + formato)
 *   node scripts/sync_crm_gsheets.mjs --mode=pull      # solo traer cambios del Sheet al CRM
 *   node scripts/sync_crm_gsheets.mjs --mode=push      # solo volcar CRM al Sheet
 *   node scripts/sync_crm_gsheets.mjs --skip-format    # omitir reformateo visual
 */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'

const DEFAULT_SPREADSHEET_ID = '1iCneUNSWVTfjgq0Zaja6px6dH2t-t_XigM7ZpCPLipU'
const CRM_BACKUP_FILE = path.join(process.cwd(), '.fluxo-data', 'crm_leads.json')

const MANAGED_TABS = [
  { title: 'CRM - Santiago, España', city: 'Santiago de Compostela' },
  { title: 'CRM - Noia, España', city: 'Noia' },
]

const HEADERS = [
  'Nombre',
  'URL Reseña Google Maps',
  'Dirección física',
  'Visitado (Si/No)',
  'Comentarios',
  'WhatsApp / Teléfono',
  'Zona',
  'Rating Google',
  'Carta Online',
  'Estado CRM',
  'CRM_ID',
]

const STATUS_TO_LABEL = {
  lead_por_visitar: 'Por visitar',
  contactado: 'Contactado',
  piloto_14_dias: 'Piloto 14 días',
  en_negociacion: 'En negociación',
  ganado: 'Ganado',
  perdido: 'Perdido',
}

const LABEL_TO_STATUS = {
  'por visitar': 'lead_por_visitar',
  contactado: 'contactado',
  visitado: 'contactado',
  'piloto 14 días': 'piloto_14_dias',
  'piloto 14 dias': 'piloto_14_dias',
  'en negociación': 'en_negociacion',
  'en negociacion': 'en_negociacion',
  interesado: 'en_negociacion',
  ganado: 'ganado',
  'cliente activo': 'ganado',
  perdido: 'perdido',
  descartado: 'perdido',
}

const MENU_STATUS_TO_LABEL = {
  none: 'Sin carta online',
  pdf: 'Carta en PDF',
  web_interactive: 'Carta web',
  unknown: 'Sin verificar',
}

function parseArgs(argv) {
  const opts = {
    mode: 'sync',
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    skipFormat: false,
  }
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--mode=')) opts.mode = arg.split('=')[1]
    else if (arg.startsWith('--sheet-id=')) opts.spreadsheetId = arg.split('=')[1]
    else if (arg === '--skip-format') opts.skipFormat = true
  }
  return opts
}

function quoteWinArg(arg) {
  const s = String(arg)
  if (!/[\s"&|<>^(),;!]/.test(s)) return s
  return `"${s.replace(/"/g, '\\"')}"`
}

function runGsheets(args, { expectJson = false } = {}) {
  const finalArgs = expectJson ? [...args, '--json'] : args
  const isWin = process.platform === 'win32'
  const out = isWin
    ? execFileSync('gsheets.cmd', finalArgs.map(quoteWinArg), {
        encoding: 'utf8',
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 25 * 1024 * 1024,
      })
    : execFileSync('gsheets', finalArgs, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 25 * 1024 * 1024,
      })
  return expectJson ? JSON.parse(out) : out
}

function loadLocalLeads() {
  if (!fs.existsSync(CRM_BACKUP_FILE)) {
    throw new Error(`No se encontró ${CRM_BACKUP_FILE}`)
  }
  const raw = fs.readFileSync(CRM_BACKUP_FILE, 'utf8')
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) {
    throw new Error('El archivo crm_leads.json no contiene un array válido.')
  }
  return parsed
}

function saveLocalLeads(leads) {
  const dir = path.dirname(CRM_BACKUP_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const tmp = `${CRM_BACKUP_FILE}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(tmp, JSON.stringify(leads, null, 2), 'utf8')
  fs.renameSync(tmp, CRM_BACKUP_FILE)
}

function listSheets(spreadsheetId) {
  const data = runGsheets(['readonly', 'list-sheets', spreadsheetId], { expectJson: true })
  if (Array.isArray(data)) return data
  if (Array.isArray(data.sheets)) return data.sheets
  return []
}

function getSheetIdByTitle(sheets, title) {
  const found = sheets.find(
    (s) => (s.title || s.Title || s.properties?.title) === title
  )
  if (!found) return null
  const id = found.id ?? found.ID ?? found.sheetId ?? found.properties?.sheetId
  return typeof id === 'number' ? id : Number(id)
}

function ensureManagedTabs(spreadsheetId) {
  let sheets = listSheets(spreadsheetId)
  const created = []
  for (const tab of MANAGED_TABS) {
    if (getSheetIdByTitle(sheets, tab.title) === null) {
      runGsheets(['mutate', 'add-sheet', spreadsheetId, '--title', tab.title])
      created.push(tab.title)
    }
  }
  if (created.length > 0) {
    sheets = listSheets(spreadsheetId)
  }
  return { sheets, created }
}

function readTabRows(spreadsheetId, title) {
  try {
    const res = runGsheets(['readonly', 'read', spreadsheetId, `'${title}'!A1:K1000`], {
      expectJson: true,
    })
    if (Array.isArray(res)) return res
    if (Array.isArray(res.values)) return res.values
    if (Array.isArray(res.rows)) return res.rows
    if (Array.isArray(res.data)) return res.data
    return []
  } catch {
    return []
  }
}

function normalizeCity(lead) {
  const c = (lead.city || '').toLowerCase()
  if (c.includes('santiago')) return 'Santiago de Compostela'
  if (c.includes('noia')) return 'Noia'
  const addr = (lead.address || '').toLowerCase()
  if (addr.includes('santiago')) return 'Santiago de Compostela'
  return 'Noia'
}

function getPriorityValue(lead) {
  if (typeof lead.lead_score === 'number' && !Number.isNaN(lead.lead_score)) {
    return lead.lead_score
  }
  if (typeof lead.score === 'number' && !Number.isNaN(lead.score)) {
    return lead.score <= 10 ? lead.score * 10 : lead.score
  }
  return 0
}

function sortLeadsForStreet(leads) {
  return [...leads].sort((a, b) => {
    const zoneA = (a.zone || 'ZZZ').trim().toLowerCase()
    const zoneB = (b.zone || 'ZZZ').trim().toLowerCase()
    if (zoneA !== zoneB) return zoneA.localeCompare(zoneB, 'es')

    const prioDiff = getPriorityValue(b) - getPriorityValue(a)
    if (prioDiff !== 0) return prioDiff

    return (a.name || '').localeCompare(b.name || '', 'es')
  })
}

function leadToRow(lead) {
  const reviewUrl = lead.google_review_url || lead.google_profile_url || ''
  const isVisited =
    (lead.status && lead.status !== 'lead_por_visitar') || Boolean(lead.last_visit_date)
  const contact = lead.contact_whatsapp || lead.contact_phone || ''
  const ratingText =
    lead.google_rating != null
      ? `${lead.google_rating} ★${lead.google_reviews_count != null ? ` (${lead.google_reviews_count})` : ''}`
      : ''
  const menuText = MENU_STATUS_TO_LABEL[lead.online_menu_status || 'unknown'] || 'Sin verificar'
  const statusText = STATUS_TO_LABEL[lead.status || 'lead_por_visitar'] || 'Por visitar'

  return [
    String(lead.name || '').trim(),
    String(reviewUrl).trim(),
    String(lead.address || '').trim(),
    isVisited ? 'Si' : 'No',
    String(lead.notes || '').trim(),
    String(contact).trim(),
    String(lead.zone || '').trim(),
    ratingText,
    menuText,
    statusText,
    String(lead.id || '').trim(),
  ]
}

function pullFromSheetIntoLeads(spreadsheetId, leads) {
  const byId = new Map(leads.map((l) => [String(l.id), l]))
  const byNameCity = new Map(
    leads.map((l) => [`${(l.name || '').trim().toLowerCase()}|${normalizeCity(l)}`, l])
  )

  let updatedCount = 0
  let addedCount = 0
  const nowIso = new Date().toISOString()
  const todayDate = nowIso.split('T')[0]

  for (const tab of MANAGED_TABS) {
    const rows = readTabRows(spreadsheetId, tab.title)
    if (rows.length <= 1) continue

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || []
      const name = String(row[0] ?? '').trim()
      if (!name) continue

      const reviewUrl = String(row[1] ?? '').trim()
      const address = String(row[2] ?? '').trim()
      const visitedRaw = String(row[3] ?? '').trim().toLowerCase()
      const comments = String(row[4] ?? '').trim()
      const contact = String(row[5] ?? '').trim()
      const zone = String(row[6] ?? '').trim()
      const statusLabel = String(row[9] ?? '').trim().toLowerCase()
      const crmId = String(row[10] ?? '').trim()

      let target = (crmId && byId.get(crmId)) || byNameCity.get(`${name.toLowerCase()}|${tab.city}`)

      if (!target) {
        // Fila nueva añadida manualmente en el Sheet -> crear lead en el CRM
        const newLead = {
          id: crmId || crypto.randomUUID(),
          name,
          address: address || tab.city,
          city: tab.city,
          zone: zone || 'Centro',
          icp_segment: 'B',
          contact_name: null,
          contact_phone: contact || null,
          contact_whatsapp: contact || null,
          instagram: null,
          google_rating: null,
          google_reviews_count: null,
          google_review_url: reviewUrl || null,
          score: 5,
          status:
            LABEL_TO_STATUS[statusLabel] ||
            (visitedRaw === 'si' || visitedRaw === 'sí' ? 'contactado' : 'lead_por_visitar'),
          target_plan: 'carta_15',
          mrr_projected: 15,
          pilot_start_date: null,
          pilot_end_date: null,
          last_visit_date: visitedRaw === 'si' || visitedRaw === 'sí' ? todayDate : null,
          next_contact_date: null,
          notes: comments || null,
          lost_reason: null,
          online_menu_status: 'unknown',
          attachments: [],
          created_at: nowIso,
          updated_at: nowIso,
        }
        leads.push(newLead)
        byId.set(newLead.id, newLead)
        byNameCity.set(`${name.toLowerCase()}|${tab.city}`, newLead)
        addedCount++
        continue
      }

      let changed = false

      if (reviewUrl && reviewUrl !== (target.google_review_url || target.google_profile_url || '')) {
        target.google_review_url = reviewUrl
        changed = true
      }

      if (address && address !== (target.address || '')) {
        target.address = address
        changed = true
      }

      if (comments !== String(target.notes || '').trim()) {
        target.notes = comments || null
        changed = true
      }

      const existingContact = String(target.contact_whatsapp || target.contact_phone || '').trim()
      if (contact && contact !== existingContact) {
        target.contact_whatsapp = contact
        if (!target.contact_phone) target.contact_phone = contact
        changed = true
      }

      if (zone && zone !== String(target.zone || '').trim()) {
        target.zone = zone
        changed = true
      }

      const mappedStatus = LABEL_TO_STATUS[statusLabel]
      if (mappedStatus && mappedStatus !== target.status) {
        target.status = mappedStatus
        changed = true
      } else if ((visitedRaw === 'si' || visitedRaw === 'sí') && target.status === 'lead_por_visitar') {
        target.status = 'contactado'
        changed = true
      }

      if ((visitedRaw === 'si' || visitedRaw === 'sí') && !target.last_visit_date) {
        target.last_visit_date = todayDate
        changed = true
      }

      if (changed) {
        target.updated_at = nowIso
        updatedCount++
      }
    }
  }

  return { updatedCount, addedCount }
}

function pushLeadsToSheet(spreadsheetId, leads) {
  const ops = []
  const counts = {}

  for (const tab of MANAGED_TABS) {
    const cityLeads = sortLeadsForStreet(leads.filter((l) => normalizeCity(l) === tab.city))
    counts[tab.title] = cityLeads.length
    const matrix = [HEADERS, ...cityLeads.map(leadToRow)]
    ops.push({
      op: 'write',
      range: `'${tab.title}'!A1`,
      data: matrix,
    })
  }

  const tmpFile = path.join(os.tmpdir(), `fluxo_gsheets_batch_${Date.now()}.json`)
  fs.writeFileSync(tmpFile, JSON.stringify(ops, null, 2), 'utf8')
  try {
    runGsheets(['mutate', 'batch', spreadsheetId, '-f', tmpFile])
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
  }

  return counts
}

function formatManagedTabs(spreadsheetId, sheets, counts) {
  const colWidths = [
    [0, 1, 240], // Nombre
    [1, 2, 230], // URL Reseña
    [2, 3, 280], // Dirección
    [3, 4, 115], // Visitado
    [4, 5, 290], // Comentarios
    [5, 6, 150], // WhatsApp / Teléfono
    [6, 7, 155], // Zona
    [7, 8, 120], // Rating
    [8, 9, 130], // Carta Online
    [9, 10, 135], // Estado CRM
    [10, 11, 140], // CRM_ID
  ]

  for (const tab of MANAGED_TABS) {
    const sheetId = getSheetIdByTitle(sheets, tab.title)
    if (sheetId === null) continue
    const rowCount = Math.max((counts[tab.title] || 0) + 1, 2)

    // Cabecera en azul Fluxo + negrita + congelada
    runGsheets([
      'mutate',
      'format',
      spreadsheetId,
      '--sheet-id',
      String(sheetId),
      '--start-row',
      '0',
      '--end-row',
      '1',
      '--start-col',
      '0',
      '--end-col',
      String(HEADERS.length),
      '--bold',
      '--bg-color',
      '#1D4ED8',
      '--fg-color',
      '#FFFFFF',
      '--wrap',
    ])

    runGsheets([
      'mutate',
      'freeze',
      spreadsheetId,
      '--sheet-id',
      String(sheetId),
      '--rows',
      '1',
    ])

    // Desplegable Visitado (Si/No) en columna D
    runGsheets([
      'mutate',
      'data-validation',
      spreadsheetId,
      '--range',
      `'${tab.title}'!D2:D${rowCount + 30}`,
      '--values',
      'Si,No',
    ])

    // Desplegable Estado CRM en columna J
    runGsheets([
      'mutate',
      'data-validation',
      spreadsheetId,
      '--range',
      `'${tab.title}'!J2:J${rowCount + 30}`,
      '--values',
      'Por visitar,Contactado,Piloto 14 días,En negociación,Ganado,Perdido',
    ])

    // Anchos de columna limpios para lectura rápida en móvil/PC
    for (const [startCol, endCol, pixels] of colWidths) {
      runGsheets([
        'mutate',
        'set-col-width',
        spreadsheetId,
        '--sheet-id',
        String(sheetId),
        '--start-col',
        String(startCol),
        '--end-col',
        String(endCol),
        '--pixels',
        String(pixels),
      ])
    }
  }
}

function main() {
  const opts = parseArgs(process.argv)
  const leads = loadLocalLeads()
  const { sheets, created } = ensureManagedTabs(opts.spreadsheetId)

  if (created.length > 0) {
    console.log(`Pestañas nuevas creadas: ${created.join(', ')}`)
  }

  let pullSummary = { updatedCount: 0, addedCount: 0 }
  if (opts.mode === 'sync' || opts.mode === 'pull') {
    pullSummary = pullFromSheetIntoLeads(opts.spreadsheetId, leads)
    if (pullSummary.updatedCount > 0 || pullSummary.addedCount > 0) {
      saveLocalLeads(leads)
    }
    console.log(
      `Pull Sheet -> CRM: ${pullSummary.updatedCount} actualizados, ${pullSummary.addedCount} nuevos importados.`
    )
  }

  let counts = {}
  if (opts.mode === 'sync' || opts.mode === 'push') {
    counts = pushLeadsToSheet(opts.spreadsheetId, leads)
    console.log('Push CRM -> Sheet completado:', JSON.stringify(counts))
    if (!opts.skipFormat) {
      const latestSheets = listSheets(opts.spreadsheetId)
      formatManagedTabs(opts.spreadsheetId, latestSheets, counts)
      console.log('Formato, fila congelada y desplegables aplicados correctamente.')
    }
  }
}

main()
