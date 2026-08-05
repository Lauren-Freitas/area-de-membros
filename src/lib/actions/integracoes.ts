'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/log-activity'
import { ALL_WEBHOOK_EVENTS, type WebhookEvent } from '@/lib/fire-webhooks'

function parseEvents(formData: FormData): WebhookEvent[] | null {
  const selected = formData.getAll('events') as string[]
  const valid = selected.filter((e): e is WebhookEvent => (ALL_WEBHOOK_EVENTS as readonly string[]).includes(e))
  return valid.length ? valid : null
}

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
  const events = parseEvents(formData)

  if (!name || !url) return { error: 'Nome e URL obrigatórios' }
  try { new URL(url) } catch { return { error: 'URL inválida' } }

  const admin = createAdminClient()
  const { error } = await admin.from('outbound_webhooks').insert({ name, url, product_id, events })
  if (error) return { error: error.message }

  await logActivity({ action: 'criar', entity: 'webhook', entityName: name })
  revalidatePath('/admin/integracoes/webhooks')
  return { ok: true }
}

export async function updateOutboundWebhook(id: string, _prevState: unknown, formData: FormData) {
  const name = (formData.get('name') as string ?? '').trim()
  const url = (formData.get('url') as string ?? '').trim()
  const product_id = (formData.get('product_id') as string) || null
  const events = parseEvents(formData)

  if (!name || !url) return { error: 'Nome e URL obrigatórios' }
  try { new URL(url) } catch { return { error: 'URL inválida' } }

  const admin = createAdminClient()
  const { error } = await admin.from('outbound_webhooks').update({ name, url, product_id, events }).eq('id', id)
  if (error) return { error: error.message }

  await logActivity({ action: 'editar', entity: 'webhook', entityId: id, entityName: name })
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

export interface WebhookDelivery {
  id: string
  event: string
  response_status: number | null
  success: boolean
  attempted_at: string
}

export async function getWebhookDeliveries(webhookId: string): Promise<WebhookDelivery[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('outbound_webhook_deliveries')
    .select('id, event, response_status, success, attempted_at')
    .eq('webhook_id', webhookId)
    .order('attempted_at', { ascending: false })
    .limit(20)
  return data ?? []
}

async function deliverToWebhook(webhookId: string, url: string, event: string, payload: Record<string, unknown>) {
  const admin = createAdminClient()
  const body = JSON.stringify(payload)
  let status = 0
  let responseBody: string | null = null
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(8000),
    })
    status = res.status
    responseBody = (await res.text()).slice(0, 2000)
  } catch (err) {
    responseBody = err instanceof Error ? err.message : String(err)
  }
  const success = status >= 200 && status < 300
  await Promise.allSettled([
    admin.from('outbound_webhooks').update({
      last_fired_at: new Date().toISOString(),
      last_status: status,
    }).eq('id', webhookId),
    admin.from('outbound_webhook_deliveries').insert({
      webhook_id: webhookId,
      event,
      payload,
      response_status: status || null,
      response_body: responseBody,
      success,
    }),
  ])
  revalidatePath('/admin/integracoes/webhooks')
  return { success, status }
}

export async function resendWebhookDelivery(deliveryId: string) {
  const admin = createAdminClient()
  const { data: delivery } = await admin
    .from('outbound_webhook_deliveries')
    .select('webhook_id, event, payload')
    .eq('id', deliveryId)
    .single()
  if (!delivery) return { error: 'Entrega não encontrada' }

  const { data: webhook } = await admin
    .from('outbound_webhooks')
    .select('id, url')
    .eq('id', delivery.webhook_id)
    .single()
  if (!webhook) return { error: 'Webhook não encontrado' }

  return deliverToWebhook(webhook.id, webhook.url, delivery.event, delivery.payload as Record<string, unknown>)
}

export async function testOutboundWebhook(id: string) {
  const admin = createAdminClient()
  const { data: webhook } = await admin.from('outbound_webhooks').select('id, url').eq('id', id).single()
  if (!webhook) return { error: 'Webhook não encontrado' }

  const payload = {
    event: 'test.ping',
    timestamp: new Date().toISOString(),
    message: 'Este é um envio de teste disparado manualmente pelo painel.',
  }
  return deliverToWebhook(webhook.id, webhook.url, 'test.ping', payload)
}
