export type UserRole = 'member' | 'admin'
export type ContentType = 'video' | 'file'
export type GrantedBy = 'purchase' | 'manual' | 'pack'
export type WebhookStatus = 'processed' | 'failed' | 'ignored'

export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  asaas_customer_id: string | null
  created_at: string
}

export interface Product {
  id: string
  title: string
  description: string
  banner_url: string | null
  content_type: ContentType
  content_url: string | null
  asaas_product_id: string | null
  is_active: boolean
  is_pack: boolean
  sort_order: number
  created_at: string
}

export interface UserProduct {
  id: string
  user_id: string
  product_id: string
  granted_at: string
  granted_by: GrantedBy
  asaas_payment_id: string | null
}
