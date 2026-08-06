-- BUG encontrado na revisão final: o índice único (e a consulta) considerava
-- só (key, actor_label) — reusar a mesma Idempotency-Key em duas rotas
-- diferentes do mesmo caller faria a segunda rota receber de volta a
-- resposta da primeira. Escopo correto: key + actor + método + rota.
drop index if exists public.idempotency_keys_key_actor_idx;
create unique index if not exists idempotency_keys_scope_idx
  on public.idempotency_keys(key, actor_label, method, path);
