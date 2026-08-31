/**
 * Motor de Deduplicación y Caché Deslizante para Inteligencia de Mercado.
 * Implementa canonicalización URL SHA-256, similitud difusa Levenshtein (>0.82) y ventana temporal de 30 días.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Normaliza una URL eliminando parámetros de tracking UTM y estandarizando protocolo y host.
 * @param {string} rawUrl 
 * @returns {string} URL canónica normalizada
 */
export function canonicalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const parsed = new URL(rawUrl.trim());
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();

    // Eliminar parámetros de tracking
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'twclid', 'ref', 'source', '_ga', '_gl'
    ];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }

    // Ordenar query params restantes
    parsed.searchParams.sort();

    // Normalizar pathname eliminando barras finales redundantes
    let pathname = parsed.pathname.replace(/\/+$/, '');
    if (!pathname) pathname = '/';
    parsed.pathname = pathname;

    return parsed.toString();
  } catch {
    // Si la URL no es válida, limpiar cadenas básicas
    return rawUrl.trim().toLowerCase().split('?')[0].replace(/\/+$/, '');
  }
}

/**
 * Normaliza una cadena de texto para comparación difusa (minúsculas, sin acentos, sin puntuación).
 * @param {string} text 
 * @returns {string}
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar marcas diacríticas
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')   // Mantener solo alfanumérico y espacios
    .replace(/\s+/g, ' ')           // Colapsar espacios múltiples
    .trim();
}

/**
 * Calcula la distancia de Levenshtein entre dos cadenas.
 * @param {string} a 
 * @param {string} b 
 * @returns {number}
 */
export function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,       // Eliminación
        matrix[i][j - 1] + 1,       // Inserción
        matrix[i - 1][j - 1] + cost // Sustitución
      );
    }
  }

  return matrix[a.length][b.length];
}

/**
 * Calcula el ratio de similitud normalizado (0.0 a 1.0) entre dos títulos.
 * @param {string} titleA 
 * @param {string} titleB 
 * @returns {number}
 */
export function computeTitleSimilarity(titleA, titleB) {
  const normA = normalizeText(titleA);
  const normB = normalizeText(titleB);

  if (!normA || !normB) return 0.0;
  if (normA === normB) return 1.0;

  const maxLen = Math.max(normA.length, normB.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(normA, normB);
  return 1.0 - (distance / maxLen);
}

/**
 * Genera una huella digital SHA-256 única para un ítem de noticias.
 * @param {string} rawUrl 
 * @param {string} title 
 * @returns {string} SHA-256 Hex Digest
 */
export function generateDedupFingerprint(rawUrl, title) {
  const canonicalUrl = canonicalizeUrl(rawUrl);
  const normalizedTitle = normalizeText(title);
  const payload = `${canonicalUrl}|${normalizedTitle}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Carga el archivo de caché deslizante persistente.
 * @param {string} cacheFilePath 
 * @returns {Record<string, { fingerprint: string, title: string, url: string, firstSeen: string, lastSeen: string }>}
 */
export function loadCache(cacheFilePath) {
  try {
    if (fs.existsSync(cacheFilePath)) {
      const raw = fs.readFileSync(cacheFilePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`[dedup] No se pudo leer el archivo de caché (${err.message}). Inicializando nuevo.`);
  }
  return {};
}

/**
 * Guarda el archivo de caché deslizante persistente con poda de más de 30 días.
 * @param {Record<string, any>} cache 
 * @param {string} cacheFilePath 
 * @param {number} [maxDays=30] 
 */
export function saveCache(cache, cacheFilePath, maxDays = 30) {
  try {
    const dir = path.dirname(cacheFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const now = Date.now();
    const maxAgeMs = maxDays * 24 * 60 * 60 * 1000;
    const prunedCache = {};

    for (const [key, entry] of Object.entries(cache)) {
      const entryTime = new Date(entry.lastSeen || entry.firstSeen).getTime();
      if (!isNaN(entryTime) && (now - entryTime) <= maxAgeMs) {
        prunedCache[key] = entry;
      }
    }

    fs.writeFileSync(cacheFilePath, JSON.stringify(prunedCache, null, 2), 'utf-8');
    return prunedCache;
  } catch (err) {
    console.warn(`[dedup] Error al guardar caché en ${cacheFilePath}: ${err.message}`);
    return cache;
  }
}

/**
 * Filtra una lista de ítems descartando duplicados exactos (fingerprint) o semánticos (>0.82)
 * tanto contra la caché persistente como dentro de la misma tanda.
 * @param {Array<{ title: string, sourceUrl: string, [key: string]: any }>} items 
 * @param {Record<string, any>} cache 
 * @param {{ similarityThreshold?: number, force?: boolean, currentDate?: string }} [options]
 * @returns {{ uniqueItems: Array<any>, duplicatesCount: number }}
 */
export function deduplicateMarketItems(items, cache = {}, options = {}) {
  const threshold = options.similarityThreshold ?? 0.82;
  const force = options.force ?? false;
  const currentDate = options.currentDate || new Date().toISOString().split('T')[0];

  const uniqueItems = [];
  let duplicatesCount = 0;

  for (const item of items) {
    const fingerprint = generateDedupFingerprint(item.sourceUrl, item.title);
    item.dedupFingerprint = fingerprint;

    // Si no es modo force, verificar contra caché
    if (!force && cache[fingerprint]) {
      duplicatesCount++;
      continue;
    }

    // Verificar similitud difusa contra los ítems únicos de la tanda actual
    let isFuzzyDuplicate = false;
    for (const existing of uniqueItems) {
      const sim = computeTitleSimilarity(item.title, existing.title);
      if (sim >= threshold) {
        isFuzzyDuplicate = true;
        duplicatesCount++;
        break;
      }
    }

    if (!isFuzzyDuplicate) {
      uniqueItems.push(item);
      // Registrar en memoria de caché para esta ejecución
      cache[fingerprint] = {
        fingerprint,
        title: item.title,
        url: canonicalizeUrl(item.sourceUrl),
        firstSeen: cache[fingerprint]?.firstSeen || currentDate,
        lastSeen: currentDate
      };
    }
  }

  return { uniqueItems, duplicatesCount };
}
