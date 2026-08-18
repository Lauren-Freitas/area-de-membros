-- support_tickets nunca teve grant pra authenticated nem RLS habilitada —
-- só service_role tinha acesso. O fluxo do membro (criar chamado em
-- /atendimento e ver os próprios chamados) usa o client comum (RLS-scoped,
-- não admin), então todo INSERT falhava com "permission denied for table
-- support_tickets" e a leitura da própria lista também falhava silenciosamente
-- (lista sempre vazia, sem erro visível). O admin não é afetado — a tela
-- /admin/chamados usa createAdminClient() (service_role), que ignora RLS.
grant select, insert on public.support_tickets to authenticated;

alter table public.support_tickets enable row level security;

create policy "support_tickets: membro cria o próprio chamado"
  on public.support_tickets
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "support_tickets: membro vê os próprios chamados"
  on public.support_tickets
  for select
  to authenticated
  using (auth.uid() = user_id);
