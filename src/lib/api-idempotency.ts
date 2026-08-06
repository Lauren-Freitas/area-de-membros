import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from './supabase/admin'

/**
 * Suporte a `Idempotency-Key` (estilo Stripe) — opcional, só entra em ação
 * se o caller enviar o header. Chamar a mesma rota duas vezes com a mesma
 * chave (do mesmo actor) replay a resposta já registrada em vez de rodar o
 * handler de novo — o que torna qualquer mutação segura contra retry de
 * automação/timeout de rede, sem precisar que cada endpoint reimplemente
 * sua própria lógica de deduplicação.
 */
export async function withIdempotency(
  req: NextRequest,
  actorLabel: string,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const key = req.headers.get('idempotency-key')
  if (!key) return handler()

  const admin = createAdminClient()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: existing } = await admin
    .from('idempotency_keys')
    .select('response_status, response_body')
    .eq('key', key)
    .eq('actor_label', actorLabel)
    .gte('created_at', since)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(existing.response_body, {
      status: existing.response_status,
      headers: { 'Idempotent-Replay': 'true' },
    })
  }

  const response = await handler()
  const body = await response.clone().json().catch(() => null)
  if (body !== null) {
    // Conflito na chave única (key, actor_label) numa corrida concorrente é
    // esperado e inofensivo — a resposta computada aqui já é a correta pra
    // este caller, só não vira a que fica registrada pra próxima consulta.
    await admin.from('idempotency_keys').insert({
      key,
      actor_label: actorLabel,
      method: req.method,
      path: req.nextUrl.pathname,
      response_status: response.status,
      response_body: body,
    })
  }
  return response
}
