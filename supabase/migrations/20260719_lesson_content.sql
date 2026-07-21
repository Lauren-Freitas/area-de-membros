-- Aula passa a ter texto rico, vídeo, anexos e liberação própria (igual módulo já tinha).
alter table public.lessons add column if not exists content_html text;
alter table public.lessons add column if not exists release_type text default 'immediate';
alter table public.lessons add column if not exists release_after_days int;
alter table public.lessons add column if not exists release_at timestamptz;
alter table public.lessons add column if not exists access_duration_days int;

create table if not exists public.lesson_attachments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_size bigint not null,
  mime_type text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.lesson_attachments to anon, authenticated;
grant select, insert, update, delete on public.lesson_attachments to service_role;
