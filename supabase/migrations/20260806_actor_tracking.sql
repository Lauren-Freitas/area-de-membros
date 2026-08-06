-- Rastreio de quem/o que executou cada ação em activity_logs — hoje só admin
-- logado (via sessão) fica registrado; API e webhooks de entrada (n8n, Kiwify,
-- Asaas) mutam dados sem deixar rastro. actor_type/actor_label tornam toda
-- origem igualmente auditável.
alter table public.activity_logs
  add column if not exists actor_type text not null default 'admin',
  add column if not exists actor_label text;

-- Ações originadas por API/webhook não têm sessão de admin logado — garante
-- que user_id aceita null pra essas linhas (idempotente se já for nullable).
alter table public.activity_logs alter column user_id drop not null;
