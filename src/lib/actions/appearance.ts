'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/log-activity'

const BUCKET = 'branding'
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'ico']
const MAX_SIZE_BYTES = 5 * 1024 * 1024

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' || profile?.role === 'equipe'
}

export async function uploadBrandingAsset(
  kind: 'logo' | 'favicon',
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  if (!await requireAdmin()) return { error: 'Não autorizado.' }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { error: 'Selecione um arquivo.' }
  if (file.size > MAX_SIZE_BYTES) return { error: 'Arquivo maior que 5MB.' }

  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!ALLOWED_EXTENSIONS.includes(ext)) return { error: `Tipo de arquivo não permitido: .${ext}` }

  const admin = createAdminClient()
  const path = `${kind}.${ext}`
  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)
  const url = `${publicUrl}?v=${Date.now()}`

  const key = kind === 'logo' ? 'logo_url' : 'favicon_url'
  const { error: configError } = await admin.from('site_config').upsert({ key, value: url }, { onConflict: 'key' })
  if (configError) return { error: configError.message }

  await logActivity({ action: 'salvar_aparencia', entity: 'aparencia', entityName: kind === 'logo' ? 'logo' : 'favicon' })
  revalidatePath('/', 'layout')
  return { url }
}

export async function removeBrandingAsset(kind: 'logo' | 'favicon'): Promise<{ error?: string }> {
  if (!await requireAdmin()) return { error: 'Não autorizado.' }

  const admin = createAdminClient()
  const key = kind === 'logo' ? 'logo_url' : 'favicon_url'
  const { error } = await admin.from('site_config').update({ value: '' }).eq('key', key)
  if (error) return { error: error.message }

  await logActivity({ action: 'salvar_aparencia', entity: 'aparencia', entityName: `remover ${kind}` })
  revalidatePath('/', 'layout')
  return {}
}
