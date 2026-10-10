import { Product, Category, Table, Restaurant, Order, OrderStatus, CartItem } from '@/types/database.types'

export type DietaryFilter = 'all' | 'sintacc' | 'veggie'
export type ViewMode = 'list' | 'grid'

export interface MenuTranslationHelper {
  (key: string): string
}
