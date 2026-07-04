'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export const APPEARANCE_DEFAULTS: Record<string, string> = {
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

export async function saveAppearance(
  _prev: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const adminClient = createAdminClient()
  const fields = Object.keys(APPEARANCE_DEFAULTS)

  const rows = fields.map(key => ({
    key,
    value: ((formData.get(key) as string) ?? '').trim(),
  }))

  const { error } = await adminClient
    .from('site_config')
    .upsert(rows, { onConflict: 'key' })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/admin/aparencia')
  return { ok: true }
}

export async function restoreAppearanceDefaults(
  _prev: { ok: boolean; error?: string } | null,
): Promise<{ ok: boolean; error?: string }> {
  const adminClient = createAdminClient()

  const rows = Object.entries(APPEARANCE_DEFAULTS).map(([key, value]) => ({ key, value }))

  const { error } = await adminClient
    .from('site_config')
    .upsert(rows, { onConflict: 'key' })

  if (error) return { ok: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/admin/aparencia')
  return { ok: true }
}
