import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from './supabase/admin'

const TTL_MS = 24 * 60 * 60 * 1000

/**
 * Suporte a `Idempotency-Key` (estilo Stripe) — opcional, só entra em ação
 * se o caller enviar o header. Chamar a mesma rota (mesmo método + path)
 * duas vezes com a mesma chave, do mesmo actor, replay a resposta já
 * registrada em vez de rodar o handler de novo — segura contra retry de
 * automação/timeout de rede. Escopo é key + actor + método + rota (não só
 * key + actor): a mesma chave reusada em duas rotas diferentes não deve
 * fazer uma "vazar" a resposta da outra.
 */
export async function withIdempotency(
  req: NextRequest,
  actorLabel: string,
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const key = req.headers.get('idempotency-key')
  if (!key) return handler()

  const admin = createAdminClient()
  const method = req.method
  const reqPath = req.nextUrl.pathname
  const since = new Date(Date.now() - TTL_MS).toISOString()

  // Limpeza oportunista: nenhum cron dedicado ainda, mas toda chamada com
  // Idempotency-Key varre e descarta registros vencidos — a tabela não
  // cresce sem limite mesmo sem uma rotina agendada separada.
  admin.from('idempotency_keys').delete().lt('created_at', since)

  const { data: existing } = await admin
    .from('idempotency_keys')
    .select('response_status, response_body')
    .eq('key', key)
    .eq('actor_label', actorLabel)
    .eq('method', method)
    .eq('path', reqPath)
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
    // Conflito na chave única (key, actor_label, method, path) numa corrida
    // concorrente é esperado e inofensivo — a resposta computada aqui já é
    // a correta pra este caller, só não vira a que fica registrada pra
    // próxima consulta.
    await admin.from('idempotency_keys').insert({
      key,
      actor_label: actorLabel,
      method,
      path: reqPath,
      response_status: response.status,
      response_body: body,
    })
  }
  return response
}
