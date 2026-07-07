'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/log-activity'

// ── API Keys ────────────────────────────────────────────────────────────────

export async function createApiKey(_: unknown, formData: FormData) {
  const name = (formData.get('name') as string ?? '').trim()
  if (!name) return { error: 'Nome obrigatório' }

  const key = `tc_${crypto.randomUUID().replace(/-/g, '')}`
  const admin = createAdminClient()
  const { error } = await admin.from('api_keys').insert({ name, key })
  if (error) return { error: error.message }

  await logActivity({ action: 'criar', entity: 'api_key', entityName: name })
  revalidatePath('/admin/integracoes/api')
  return { key, name }
}

export async function deleteApiKey(id: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('api_keys').select('name').eq('id', id).single()
  await admin.from('api_keys').delete().eq('id', id)
  await logActivity({ action: 'excluir', entity: 'api_key', entityId: id, entityName: data?.name ?? null })
  revalidatePath('/admin/integracoes/api')
}

// ── Outbound Webhooks ───────────────────────────────────────────────────────

export async function createOutboundWebhook(_: unknown, formData: FormData) {
  const name = (formData.get('name') as string ?? '').trim()
  const url = (formData.get('url') as string ?? '').trim()
  const product_id = (formData.get('product_id') as string) || null

  if (!name || !url) return { error: 'Nome e URL obrigatórios' }
  try { new URL(url) } catch { return { error: 'URL inválida' } }

  const admin = createAdminClient()
  const { error } = await admin.from('outbound_webhooks').insert({ name, url, product_id })
  if (error) return { error: error.message }

  await logActivity({ action: 'criar', entity: 'webhook', entityName: name })
  revalidatePath('/admin/integracoes/webhooks')
  return { ok: true }
}

export async function deleteOutboundWebhook(id: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('outbound_webhooks').select('name').eq('id', id).single()
  await admin.from('outbound_webhooks').delete().eq('id', id)
  await logActivity({ action: 'excluir', entity: 'webhook', entityId: id, entityName: data?.name ?? null })
  revalidatePath('/admin/integracoes/webhooks')
}

export async function toggleOutboundWebhook(id: string, currentlyActive: boolean) {
  const admin = createAdminClient()
  await admin.from('outbound_webhooks').update({ is_active: !currentlyActive }).eq('id', id)
  await logActivity({ action: currentlyActive ? 'desativar' : 'ativar', entity: 'webhook', entityId: id })
  revalidatePath('/admin/integracoes/webhooks')
}
