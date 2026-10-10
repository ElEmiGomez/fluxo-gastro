import { Product, Category } from '@/types/database.types'

export type AdminTab = 'products' | 'categories' | 'ai_import' | 'daily_menu'

export interface AiParsedDish {
  id: string
  name: string
  description?: string
  price: number
  category_id: string
}

export interface AiParsedCategory {
  id: string
  name: string
}

export interface AiParsedMenuResult {
  total_dishes: number
  total_categories: number
  categories: AiParsedCategory[]
  products: AiParsedDish[]
}
