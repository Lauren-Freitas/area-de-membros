-- Prepara api_keys pra cenário enterprise (múltiplos administradores,
-- auditoria de origem, permissões granulares) sem quebrar nada hoje —
-- scopes/expires_at ficam só de arquitetura por ora (sem enforcement em
-- runtime ainda); created_by/last_ip já são gravados de verdade.
alter table public.api_keys
  add column if not exists scopes text[],
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists last_ip text,
  add column if not exists expires_at timestamptz;
