-- Fase 5, item 3: histórico de entregas de webhook de saída + filtro por evento.

alter table public.outbound_webhooks add column if not exists events text[];

create table if not exists public.outbound_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.outbound_webhooks(id) on delete cascade,
  event text not null,
  payload jsonb not null,
  response_status int,
  response_body text,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists outbound_webhook_deliveries_webhook_id_idx
  on public.outbound_webhook_deliveries(webhook_id, attempted_at desc);

grant select on public.outbound_webhook_deliveries to anon, authenticated;
grant select, insert, update, delete on public.outbound_webhook_deliveries to service_role;
