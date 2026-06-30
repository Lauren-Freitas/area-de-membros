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
  is_active?: boolean
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
  buy_url: string | null
  is_active: boolean
  is_pack: boolean
  sort_order: number
  created_at: string
}

export interface Module {
  id: string
  product_id: string
  title: string
  description: string | null
  sort_order: number
  created_at: string
}

export type LessonType = 'video' | 'text' | 'file' | 'link'

export interface Lesson {
  id: string
  module_id: string
  title: string
  description: string | null
  lesson_type: LessonType
  content_url: string | null
  content_text: string | null
  sort_order: number
  is_published: boolean
  created_at: string
}

export interface Certificate {
  id: string
  user_id: string
  product_id: string
  issued_at: string
}

export type BannerType = 'info' | 'success' | 'warning' | 'promo'

export interface Banner {
  id: string
  title: string
  body: string | null
  link: string | null
  link_label: string | null
  type: BannerType
  is_active: boolean
  expires_at: string | null
  sort_order: number
  created_at: string
}

export interface LessonComment {
  id: string
  lesson_id: string
  user_id: string
  content: string
  created_at: string
  profiles: { name: string } | null
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  completed_at: string | null
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
