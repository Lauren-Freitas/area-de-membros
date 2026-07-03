'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const DEFAULTS: Record<string, string> = {
  platform_name: 'Thiago Cantalovo',
  primary_color: '#b48840',
  brand_light: '#d2b17b',
  bg_light: '#e4e4e4',
  bg_dark: '#00060f',
  card_bg_light: '#ffffff',
  card_bg_dark: '#0d1020',
  welcome_message: 'Bem-vindo à área de membros!',
  support_whatsapp: '5561991900589',
  support_email: 'contato@thiagocantalovo.com',
}

export async function restoreAppearanceDefaults() {
  const adminClient = createAdminClient()
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await adminClient.from('site_config').upsert({ key, value }, { onConflict: 'key' })
  }
  revalidatePath('/', 'layout')
  redirect('/admin/aparencia')
}

export async function saveAppearance(formData: FormData) {
  const adminClient = createAdminClient()
  const fields = [
    'platform_name', 'primary_color', 'brand_light',
    'bg_light', 'bg_dark', 'card_bg_light', 'card_bg_dark',
    'welcome_message', 'support_whatsapp', 'support_email',
  ]

  for (const key of fields) {
    const value = (formData.get(key) as string).trim()
    await adminClient.from('site_config').upsert({ key, value }, { onConflict: 'key' })
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/admin/aparencia')
}
