// ==============================================================================
// FLUXO - CAPA DE REPOSITORIO B2B SUPABASE (POSTGRESQL)
// FACHADA UNIFICADA (FACADE PATTERN) - MODULARIZACIÓN SOLID FLUXO 1.2
// ==============================================================================

export * from './repositories/restaurants.repository'
export * from './repositories/tables.repository'
export * from './repositories/orders.repository'
export * from './repositories/service-calls.repository'
export * from './repositories/menu.repository'
export * from './repositories'

export {
  recordSystemErrorLog,
  insertSystemErrorLog,
  type RecordSystemErrorLogParams,
} from './error-logs'
