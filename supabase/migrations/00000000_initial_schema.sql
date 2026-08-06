-- Schema inicial — reconstrução fiel do banco atual, para que o projeto
-- possa ser recriado do zero rodando só as migrations em ordem (este
-- arquivo primeiro, por ordenar antes de todos os outros pelo nome).
--
-- CONTEXTO: até aqui, a grande maioria das tabelas abaixo foi criada
-- diretamente no painel do Supabase, fora do controle de versão — as
-- migrations rastreadas em supabase/migrations/ sempre foram só ALTERs
-- incrementais sobre uma base que não existia em lugar nenhum como SQL.
-- Isso já causou dois bugs reais neste projeto (tabelas sem grant pra
-- service_role) porque não havia como auditar o que existia de fato.
-- Este arquivo fecha essa lacuna.
--
-- FONTE: gerado a partir da introspecção OpenAPI do PostgREST
-- (GET {SUPABASE_URL}/rest/v1/ com Accept: application/openapi+json),
-- não de um pg_dump — este ambiente não tem acesso direto ao Postgres
-- (sem DATABASE_URL, sem psql, sem Supabase CLI logado). Isso é
-- confiável para nomes/tipos/defaults/NOT NULL/PK/FK de cada coluna
-- (é o que o PostgREST usa para o próprio schema cache), mas tem
-- limitações honestas que valem registrar:
--
--   1. RLS (row level security) e suas policies NÃO estão aqui —
--      PostgREST não expõe policies via introspecção, só estrutura de
--      tabela. Se alguma tabela depende de RLS pra proteger leitura via
--      cliente autenticado (não-service_role), essa proteção não está
--      reproduzida neste arquivo.
--   2. Índices além da chave primária, constraints CHECK (exceto as já
--      cobertas por migrations próprias, como user_products_granted_by_check
--      em 20260806b) e UNIQUE constraints não aparecem na introspecção
--      do PostgREST e por isso não estão aqui.
--   3. profiles.id quase certamente referencia auth.users(id) (padrão
--      Supabase) mas isso não é visível via introspecção do schema
--      public — não incluído para não arriscar declarar um ON DELETE
--      incorreto.
--   4. public.user_xp_totals é uma VIEW (não uma tabela), reconstruída
--      por inferência mais abaixo, perto de onde é criada — ver
--      comentário específico naquele bloco.
--
-- RECOMENDAÇÃO: se em algum momento houver acesso direto ao Postgres
-- (DATABASE_URL ou Supabase CLI logado), rodar um pg_dump --schema-only
-- e diffar contra este arquivo é o jeito de fechar essas lacunas de vez.

create extension if not exists pgcrypto;

create table if not exists public."activity_logs" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid,
  "user_name" text not null default '',
  "user_role" text not null default '',
  "action" text not null,
  "entity" text not null,
  "entity_id" text,
  "entity_name" text,
  "created_at" timestamptz not null default now(),
  "actor_type" text not null default 'admin',
  "actor_label" text,
  primary key (id)
);
grant select, insert, update, delete on public."activity_logs" to service_role;

create table if not exists public."ai_conversations" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "title" text,
  "created_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."ai_conversations" to service_role;

create table if not exists public."ai_messages" (
  "id" uuid not null default gen_random_uuid(),
  "conversation_id" uuid not null,
  "role" text not null,
  "content" text not null,
  "created_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."ai_messages" to service_role;

create table if not exists public."api_keys" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "key" text not null,
  "created_at" timestamptz default now(),
  "last_used_at" timestamptz,
  "scopes" text[],
  "created_by" uuid,
  "last_ip" text,
  "expires_at" timestamptz,
  primary key (id)
);
grant select, insert, update, delete on public."api_keys" to service_role;

create table if not exists public."banners" (
  "id" uuid not null default gen_random_uuid(),
  "title" text not null,
  "body" text,
  "link" text,
  "link_label" text default 'Ver mais',
  "type" text not null default 'info',
  "is_active" boolean not null default true,
  "expires_at" timestamptz,
  "sort_order" integer not null default 0,
  "created_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."banners" to service_role;

create table if not exists public."certificates" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "product_id" uuid not null,
  "issued_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."certificates" to service_role;

create table if not exists public."cohort_members" (
  "id" uuid not null default gen_random_uuid(),
  "cohort_id" uuid not null,
  "user_id" uuid not null,
  "joined_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."cohort_members" to service_role;

create table if not exists public."cohorts" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "description" text,
  "product_id" uuid,
  "starts_at" timestamptz,
  "ends_at" timestamptz,
  "created_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."cohorts" to service_role;

create table if not exists public."community_posts" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "title" text not null,
  "body" text not null,
  "pinned" boolean not null default false,
  "created_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."community_posts" to service_role;

create table if not exists public."community_replies" (
  "id" uuid not null default gen_random_uuid(),
  "post_id" uuid not null,
  "user_id" uuid not null,
  "body" text not null,
  "created_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."community_replies" to service_role;

create table if not exists public."invites" (
  "id" uuid not null default gen_random_uuid(),
  "code" text not null,
  "note" text,
  "product_ids" uuid[] not null,
  "max_uses" integer,
  "used_count" integer not null default 0,
  "expires_at" timestamptz,
  "created_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."invites" to service_role;

create table if not exists public."lesson_attachments" (
  "id" uuid not null default gen_random_uuid(),
  "lesson_id" uuid not null,
  "file_name" text not null,
  "file_path" text not null,
  "file_size" bigint not null,
  "mime_type" text,
  "sort_order" integer not null default 0,
  "created_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."lesson_attachments" to service_role;

create table if not exists public."lesson_comments" (
  "id" uuid not null default gen_random_uuid(),
  "lesson_id" uuid not null,
  "user_id" uuid not null,
  "content" text not null,
  "created_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."lesson_comments" to service_role;

create table if not exists public."lesson_progress" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "lesson_id" uuid not null,
  "completed" boolean not null default false,
  "completed_at" timestamptz,
  "created_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."lesson_progress" to service_role;

create table if not exists public."lesson_ratings" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "lesson_id" uuid not null,
  "product_id" uuid not null,
  "rating" integer not null,
  "created_at" timestamptz default now(),
  "updated_at" timestamptz default now(),
  primary key (id)
);
grant select, insert, update, delete on public."lesson_ratings" to service_role;

create table if not exists public."lessons" (
  "id" uuid not null default gen_random_uuid(),
  "module_id" uuid not null,
  "title" text not null,
  "description" text,
  "lesson_type" text not null,
  "content_url" text,
  "content_text" text,
  "sort_order" integer not null default 0,
  "is_published" boolean not null default true,
  "created_at" timestamptz not null default now(),
  "content_html" text,
  "release_type" text default 'immediate',
  "release_after_days" integer,
  "release_at" timestamptz,
  "access_duration_days" integer,
  primary key (id)
);
grant select, insert, update, delete on public."lessons" to service_role;

create table if not exists public."modules" (
  "id" uuid not null default gen_random_uuid(),
  "product_id" uuid not null,
  "title" text not null,
  "description" text,
  "sort_order" integer not null default 0,
  "created_at" timestamptz not null default now(),
  "release_type" text not null default 'immediate',
  "release_after_days" integer,
  "release_at" timestamptz,
  primary key (id)
);
grant select, insert, update, delete on public."modules" to service_role;

create table if not exists public."notifications" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "title" text not null,
  "body" text,
  "link" text,
  "read" boolean not null default false,
  "created_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."notifications" to service_role;

create table if not exists public."offers" (
  "id" uuid not null default gen_random_uuid(),
  "product_id" uuid,
  "title" text not null,
  "description" text,
  "original_price" numeric,
  "promo_price" numeric,
  "coupon_code" text,
  "ends_at" timestamptz,
  "is_active" boolean not null default true,
  "sort_order" integer not null default 0,
  "created_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."offers" to service_role;

create table if not exists public."outbound_webhook_deliveries" (
  "id" uuid not null default gen_random_uuid(),
  "webhook_id" uuid not null,
  "event" text not null,
  "payload" jsonb not null,
  "response_status" integer,
  "response_body" text,
  "success" boolean not null default false,
  "attempted_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."outbound_webhook_deliveries" to service_role;

create table if not exists public."outbound_webhooks" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "url" text not null,
  "product_id" uuid,
  "is_active" boolean default true,
  "created_at" timestamptz default now(),
  "last_fired_at" timestamptz,
  "last_status" integer,
  "events" text[],
  primary key (id)
);
grant select, insert, update, delete on public."outbound_webhooks" to service_role;

create table if not exists public."product_comments" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "product_id" uuid not null,
  "content" text not null,
  "created_at" timestamptz default now(),
  primary key (id)
);
grant select, insert, update, delete on public."product_comments" to service_role;

create table if not exists public."product_ratings" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "product_id" uuid not null,
  "rating" integer not null,
  "created_at" timestamptz default now(),
  "updated_at" timestamptz default now(),
  primary key (id)
);
grant select, insert, update, delete on public."product_ratings" to service_role;

create table if not exists public."products" (
  "id" uuid not null default gen_random_uuid(),
  "title" text not null,
  "description" text not null default '',
  "banner_url" text,
  "content_type" text not null,
  "content_url" text,
  "asaas_product_id" text,
  "is_active" boolean not null default true,
  "is_pack" boolean not null default false,
  "sort_order" integer not null default 0,
  "created_at" timestamptz not null default now(),
  "buy_url" text,
  "product_type" text not null default 'curso',
  "category" text,
  "price" numeric,
  "billing_cycle" text,
  "kiwify_product_id" text,
  "is_featured" boolean not null default false,
  primary key (id)
);
grant select, insert, update, delete on public."products" to service_role;

create table if not exists public."profiles" (
  "id" uuid not null,
  "name" text not null,
  "email" text not null,
  "role" text not null default 'membro',
  "asaas_customer_id" text,
  "created_at" timestamptz not null default now(),
  "is_active" boolean not null default true,
  "phone" text,
  "bio" text,
  "avatar_url" text,
  "timezone" text not null default 'America/Sao_Paulo',
  "ai_tone" text default 'empatico',
  "last_login_at" timestamptz,
  "welcome_seen_at" timestamptz,
  "last_lesson_id" uuid,
  "last_lesson_viewed_at" timestamptz,
  "notes" text,
  primary key (id)
);
grant select, insert, update, delete on public."profiles" to service_role;

create table if not exists public."site_config" (
  "id" uuid not null default gen_random_uuid(),
  "key" text not null,
  "value" text not null default '',
  "updated_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."site_config" to service_role;

create table if not exists public."support_tickets" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "subject" text,
  "product_id" uuid,
  "message" text not null,
  "status" text not null default 'open',
  "created_at" timestamptz not null default now(),
  primary key (id)
);
grant select, insert, update, delete on public."support_tickets" to service_role;

create table if not exists public."user_badges" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "badge_key" text not null,
  "earned_at" timestamptz default now(),
  primary key (id)
);
grant select, insert, update, delete on public."user_badges" to service_role;

create table if not exists public."user_products" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "product_id" uuid not null,
  "granted_at" timestamptz not null default now(),
  "granted_by" text not null,
  "asaas_payment_id" text,
  "expires_at" timestamptz,
  "is_completed" boolean default false,
  "completed_at" timestamptz,
  "value" numeric,
  "billing_type" text,
  "payment_status" text,
  "invoice_url" text,
  primary key (id)
);
grant select, insert, update, delete on public."user_products" to service_role;

create table if not exists public."webhook_logs" (
  "id" uuid not null default gen_random_uuid(),
  "event_type" text not null,
  "asaas_payment_id" text,
  "status" text not null,
  "payload" jsonb,
  "error_message" text,
  "created_at" timestamptz not null default now(),
  "provider" text,
  primary key (id)
);
grant select, insert, update, delete on public."webhook_logs" to service_role;

create table if not exists public."xp_settings" (
  "event_type" text not null,
  "xp_amount" integer not null default 0,
  "is_enabled" boolean default true,
  "label" text,
  primary key (event_type)
);
grant select, insert, update, delete on public."xp_settings" to service_role;

create table if not exists public."xp_transactions" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null,
  "event_type" text not null,
  "xp_amount" integer not null,
  "metadata" jsonb,
  "created_at" timestamptz default now(),
  primary key (id)
);
grant select, insert, update, delete on public."xp_transactions" to service_role;

-- user_xp_totals é uma VIEW, não uma tabela — não há migration rastreada
-- para ela (criada fora do controle de versão, como as tabelas acima) e a
-- introspecção via PostgREST não expõe a definição de views, só de tabelas.
-- Reconstrução por inferência a partir do uso real em src/app/(membro)/perfil/page.tsx
-- (soma de xp_transactions por usuário) — NÃO confirmada contra a definição
-- original. Se divergir, é o primeiro lugar a checar.
create or replace view public.user_xp_totals as
select
  user_id,
  coalesce(sum(xp_amount), 0)::int as total_xp
from public.xp_transactions
group by user_id;

grant select on public.user_xp_totals to service_role;

-- Foreign keys (aplicadas depois de todas as tabelas existirem, evita problema de ordem)
do $$ begin
  alter table public."ai_messages" add constraint "ai_messages_conversation_id_fkey" foreign key ("conversation_id") references public."ai_conversations"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."api_keys" add constraint "api_keys_created_by_fkey" foreign key ("created_by") references public."profiles"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."certificates" add constraint "certificates_product_id_fkey" foreign key ("product_id") references public."products"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."cohort_members" add constraint "cohort_members_cohort_id_fkey" foreign key ("cohort_id") references public."cohorts"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."cohorts" add constraint "cohorts_product_id_fkey" foreign key ("product_id") references public."products"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."community_replies" add constraint "community_replies_post_id_fkey" foreign key ("post_id") references public."community_posts"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."lesson_attachments" add constraint "lesson_attachments_lesson_id_fkey" foreign key ("lesson_id") references public."lessons"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."lesson_comments" add constraint "lesson_comments_lesson_id_fkey" foreign key ("lesson_id") references public."lessons"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."lesson_progress" add constraint "lesson_progress_lesson_id_fkey" foreign key ("lesson_id") references public."lessons"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."lesson_ratings" add constraint "lesson_ratings_user_id_fkey" foreign key ("user_id") references public."profiles"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."lesson_ratings" add constraint "lesson_ratings_lesson_id_fkey" foreign key ("lesson_id") references public."lessons"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."lesson_ratings" add constraint "lesson_ratings_product_id_fkey" foreign key ("product_id") references public."products"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."lessons" add constraint "lessons_module_id_fkey" foreign key ("module_id") references public."modules"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."modules" add constraint "modules_product_id_fkey" foreign key ("product_id") references public."products"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."offers" add constraint "offers_product_id_fkey" foreign key ("product_id") references public."products"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."outbound_webhook_deliveries" add constraint "outbound_webhook_deliveries_webhook_id_fkey" foreign key ("webhook_id") references public."outbound_webhooks"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."outbound_webhooks" add constraint "outbound_webhooks_product_id_fkey" foreign key ("product_id") references public."products"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."product_comments" add constraint "product_comments_user_id_fkey" foreign key ("user_id") references public."profiles"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."product_comments" add constraint "product_comments_product_id_fkey" foreign key ("product_id") references public."products"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."product_ratings" add constraint "product_ratings_user_id_fkey" foreign key ("user_id") references public."profiles"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."product_ratings" add constraint "product_ratings_product_id_fkey" foreign key ("product_id") references public."products"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."profiles" add constraint "profiles_last_lesson_id_fkey" foreign key ("last_lesson_id") references public."lessons"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."support_tickets" add constraint "support_tickets_product_id_fkey" foreign key ("product_id") references public."products"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."user_badges" add constraint "user_badges_user_id_fkey" foreign key ("user_id") references public."profiles"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."user_products" add constraint "user_products_user_id_fkey" foreign key ("user_id") references public."profiles"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."user_products" add constraint "user_products_product_id_fkey" foreign key ("product_id") references public."products"("id");
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public."xp_transactions" add constraint "xp_transactions_user_id_fkey" foreign key ("user_id") references public."profiles"("id");
exception when duplicate_object then null;
end $$;
