-- Fase 3 da reformulação premium: colunas que destravam "conteúdo em destaque",
-- "último acesso", "primeiro login" (tela de boas-vindas) e "continue de onde parou".

-- Admin escolhe um produto como destaque na home do aluno
alter table public.products add column if not exists is_featured boolean not null default false;

-- Rastreamento de acesso do membro
alter table public.profiles add column if not exists last_login_at timestamptz;
alter table public.profiles add column if not exists welcome_seen_at timestamptz;
alter table public.profiles add column if not exists last_lesson_id uuid references public.lessons(id) on delete set null;
alter table public.profiles add column if not exists last_lesson_viewed_at timestamptz;
