import { Product, Category, CourseType } from '@/types/database.types'

export type AdminTab = 'products' | 'categories' | 'daily_menu' | 'ai_import' | 'loyalty'

export type StagingActionType = 'create' | 'update_price' | 'update_stock' | 'unchanged'

export interface AiParsedDish {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
  category_name?: string
  allergens?: string[]
  action_type?: StagingActionType
  old_price?: number
  is_available?: boolean
  old_is_available?: boolean
  requires_price_review?: boolean
  course_type?: CourseType
  station?: 'bar' | 'kitchen'
  price_type?: 'unit' | 'weight'
  price_unit?: string
}

export interface AiParsedCategory {
  id: string
  name: string
  order_index?: number
}

export interface StagingDailyMenuSection {
  name: string
  course_type?: CourseType
  dish_names: string[]
}

export interface StagingDailyMenu {
  title: string
  fixed_price: number
  sections?: StagingDailyMenuSection[]
  is_active: boolean
}

export interface StagingDiff {
  action: 'import' | 'command'
  summary: string
  items: AiParsedDish[]
  daily_menu?: StagingDailyMenu | null
  total_created: number
  total_updated: number
  total_paused: number
  total_activated: number
  requires_price_review_count: number
}

export interface AiParsedMenuResult {
  total_dishes: number
  total_categories: number
  categories: AiParsedCategory[]
  products: AiParsedDish[]
  staging_diff?: StagingDiff
  command_executed?: string
}
