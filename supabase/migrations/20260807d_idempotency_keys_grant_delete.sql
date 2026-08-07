-- BUG encontrado na revisão final desta fase: o grant original
-- (20260807b) só cobria select/insert, mas withIdempotency() também faz
-- delete (limpeza oportunista de chaves com mais de 24h, ver
-- src/lib/api-idempotency.ts) — sem esse grant, a limpeza falharia com
-- 42501 permission denied, silenciosamente (é fire-and-forget, sem await).
grant delete on public.idempotency_keys to service_role;
