import { Product, Table, Order, CartItem, Restaurant, Category } from '@/types/database.types'
import { TableStatusType } from '@/components/comandero/TableSelector'

export interface PendingServiceCall {
  id: string
  table_number: string | number
  call_type: string
  text: string
}

export interface PreviousDrinkItem {
  product: Product
  quantity: number
}
