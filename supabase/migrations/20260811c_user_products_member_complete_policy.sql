-- Achado no mesmo teste de ponta a ponta das duas migrations anteriores:
-- user_products só tinha 2 policies — "admin gerencia" (is_admin(), todas as
-- operações) e "leitura própria" (auth.uid() = user_id, só SELECT). Não
-- existia NENHUMA policy permitindo o próprio membro alterar sua linha —
-- mas markProductComplete/unmarkProductComplete (src/lib/actions/
-- product-actions.ts) sempre assumiram que o membro conseguia marcar/
-- desmarcar conclusão do próprio acesso via sessão RLS própria. Sem policy,
-- o UPDATE retornava 200 com 0 linhas afetadas — nem erro, nem efeito.
--
-- Fix restrito por design: o membro só ganha permissão de escrita em
-- is_completed/completed_at, nunca em granted_by, expires_at, payment_status
-- ou value — esses continuam exclusivos do admin/service_role via a policy
-- "admin gerencia" já existente.
create policy "user_products: membro marca conclusão própria"
  on public.user_products
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke update on public.user_products from authenticated;
grant update (is_completed, completed_at) on public.user_products to authenticated;
