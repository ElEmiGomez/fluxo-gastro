export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Restaurant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  created_at: string
  google_place_id?: string | null
  google_review_url?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  postal_code?: string | null
  cuisine_type?: string[] | null
  price_range?: string | null
}

export interface Category {
  id: string
  restaurant_id: string
  name: string
  order_index: number
}

export interface Product {
  id: string
  restaurant_id: string
  category_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  model_3d_url: string | null // Campo opcional preparado para Realidad Aumentada
  is_available: boolean
  price_type?: 'unit' | 'weight' // 'unit' (defecto) o 'weight' (al peso/100g/kg)
  price_unit?: 'kg' | '100g' | 'piece'
}

export interface Table {
  id: string
  restaurant_id: string
  table_number: number
  qr_code_url?: string | null
}

export type OrderStatus = 'pending_validation' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type CourseType = 'first' | 'second' | 'dessert' | 'drink'

export interface TableSession {
  id?: string
  restaurant_id?: string
  table_number: number | string
  session_token: string // UUID de visita temporal
  status: 'active' | 'closed' | 'expired' | 'free' | 'busy' | 'calling' | 'ready'
  created_at?: string
  closed_at?: string | null
  last_updated_at?: string
}

export interface ServiceCall {
  id: string
  restaurant_id?: string
  restaurant_slug?: string
  table_session_id?: string
  table_number: number | string
  call_type: string
  status: 'pending' | 'attended'
  created_at: string
}

export interface Order {
  id: string
  restaurant_id: string
  table_id: string
  table_session_id?: string
  table_number?: number | string
  session_token?: string
  status: OrderStatus
  total_amount: number
  created_at: string
  table?: Table
  order_items?: OrderItem[]
  discount_percentage?: number
}

export interface OrderItem {
  id?: string
  order_id?: string
  product_id: string
  quantity: number
  notes: string | null // Modificadores rápidos + aclaración libre ("Puré | Sin tomate")
  product?: Product
  course?: CourseType // 'first' (1º marchando), 'second' (2º en espera), 'dessert', 'drink'
  is_complimentary?: boolean // Invitación de la casa / 0,00 €
  weight_grams?: number // Gramos reales en productos al peso
}

export interface CartItem {
  product: Product
  quantity: number
  selectedPills: string[]
  notes: string
  course?: CourseType
  is_complimentary?: boolean
  weight_grams?: number
}
