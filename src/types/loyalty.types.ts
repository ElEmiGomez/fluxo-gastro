import { Product } from './database.types'

export type LoyaltyMode = 'stamps' | 'points' | 'disabled'

export interface LoyaltySettings {
  mode: LoyaltyMode
  target_stamps: number
  min_spend_per_stamp: number
  reward_label: string
  reward_category_filter: string[]
}

export interface LoyaltyProfile {
  id: string
  restaurant_slug: string
  name: string
  email: string
  phone?: string | null
  total_points: number
  held_points: number
  available_points: number
  google_review_bonus_awarded: boolean
  stamps_count?: number
  stamps_target?: number
  unlocked_rewards_count?: number
  total_stamps_earned?: number
  created_at: string
  updated_at: string
}

export interface LoyaltyReward {
  id: string
  restaurant_slug: string
  product_id: string
  points_cost: number
  is_active: boolean
  product?: Product
}

export interface LoyaltyEscrowHold {
  id: string
  profile_id: string
  restaurant_slug: string
  table_number: number | string
  session_token: string
  points: number
  product_id?: string
  status: 'held' | 'settled' | 'released'
  created_at: string
}

export interface LoyaltyDinerSettlement {
  profile_id: string
  customer_name: string
  customer_email: string
  redeemed_points: number
  earned_points: number
  previous_points: number
  new_total_points: number
}

export interface LoyaltySettlementResult {
  redeemed_points: number
  earned_points: number
  previous_points: number
  new_total_points: number
  profile_id?: string
  customer_name?: string
  customer_email?: string
  diners_count?: number
  breakdown?: LoyaltyDinerSettlement[]
  stamp_awarded?: boolean
  stamps_count?: number
  stamps_target?: number
  unlocked_rewards_count?: number
  stamp_reward_unlocked_now?: boolean
}

export interface LoyaltyTableMember {
  profile_id: string
  name: string
  email: string
  joined_at: string
}

