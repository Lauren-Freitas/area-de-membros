-- lesson_comments.user_id e certificates.user_id nunca tiveram FK para
-- public.profiles(id) (mesma lacuna já corrigida pra community_posts e
-- community_replies em 20260813_community_profiles_fk.sql, nunca replicada
-- aqui). Sem essa FK, o PostgREST não resolve o embed `profiles(name)` usado
-- em /produto/[id]/aula/[aulaId] e /certificado/[id] -- a query inteira falha
-- (400) e:
--   - a página de aula descarta o erro com `?? []` e mostra "nenhum
--     comentário", mesmo com comentários reais salvos no banco;
--   - a página de certificado recebe `cert: null` e faz
--     `redirect('/dashboard')` -- qualquer certificado válido fica
--     inacessível, sem aviso nenhum ao membro.
--
-- Confirmado antes de aplicar: as duas tabelas estão vazias hoje em produção
-- (0 linhas em cada) -- zero risco de órfão, e os tipos já batem (ambos
-- "user_id uuid not null" contra "profiles.id uuid").
alter table public.lesson_comments
  add constraint lesson_comments_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id);

alter table public.certificates
  add constraint certificates_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(id);

-- Autoria de comentário pra terceiros -----------------------------------
--
-- ATENÇÃO: a primeira tentativa desta migration (já corrigida abaixo) tentou
-- resolver isso com um GRANT por coluna + uma policy de SELECT permissiva
-- (using (true)). Isso não funciona com segurança: grants no Postgres são
-- aditivos -- se authenticated já tinha select amplo na tabela (comum em
-- projetos Supabase), um grant mais estreito não restringe nada, e a policy
-- permissiva abre a LINHA inteira (todas as colunas) de qualquer perfil pra
-- qualquer usuário autenticado. Foi exatamente o que aconteceu aqui: e-mail,
-- role, telefone etc. de outros usuários ficaram legíveis. Se você aplicou a
-- versão antiga desta migration, rode isto antes do restante:
--
--   drop policy if exists "authenticated_read_profile_name" on public.profiles;
--   revoke select (id, name) on public.profiles from authenticated;
--
-- Correção definitiva: uma função SECURITY DEFINER. Ela roda com o
-- privilégio de quem a criou (bypassa RLS por dentro), mas só devolve as
-- colunas id/name explicitamente -- nenhuma outra coluna passa por ela,
-- independente de qualquer grant que já exista (ou venha a existir) na
-- tabela profiles. Não amplia nenhum privilégio de SELECT direto na tabela.
create or replace function public.get_profile_names(profile_ids uuid[])
returns table (id uuid, name text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.name
  from public.profiles p
  where p.id = any(profile_ids);
$$;

grant execute on function public.get_profile_names(uuid[]) to authenticated;
