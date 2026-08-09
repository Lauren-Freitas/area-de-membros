-- Achado testando o fluxo de Chamados ponta a ponta: support_tickets.user_id
-- já tinha uma FK (support_tickets_user_id_fkey), mas apontando pra
-- auth.users(id), não pra public.profiles(id) — provavelmente criada pelo
-- editor de tabelas do Supabase, que aponta direto pro schema de auth por
-- padrão. O PostgREST não resolve o embed `profiles(...)` usado em
-- /admin/chamados a partir de uma FK indireta (via auth.users); precisa de
-- uma FK direta pra profiles, mesma convenção já usada em user_products,
-- certificates etc. As duas FKs coexistem sem conflito — profiles.id é o
-- mesmo valor que auth.users.id nesta base.
do $$ begin
  alter table public.support_tickets
    add constraint support_tickets_user_id_profiles_fkey
    foreign key (user_id) references public.profiles(id);
exception when duplicate_object then null;
end $$;
