-- Suporte a header `Idempotency-Key` (estilo Stripe) nas rotas mutáveis da
-- API pública — uma segunda chamada com a mesma chave, do mesmo caller,
-- retorna a resposta já registrada em vez de repetir o efeito colateral.
-- Chaves são só lidas por até 24h (ver src/lib/api-idempotency.ts); registros
-- mais antigos são ignorados na consulta e podem ser limpos por rotina futura.
create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  actor_label text not null,
  method text not null,
  path text not null,
  response_status int not null,
  response_body jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists idempotency_keys_key_actor_idx
  on public.idempotency_keys(key, actor_label);

grant select, insert on public.idempotency_keys to service_role;
