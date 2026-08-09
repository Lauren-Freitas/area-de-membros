-- Achado testando o fluxo de Chamados ponta a ponta: support_tickets.user_id
-- não tinha foreign key nenhuma pra profiles (product_id tem, user_id não —
-- outro resíduo de tabela criada fora de migration rastreada). Sem a FK, o
-- PostgREST não consegue resolver o embed `profiles(name, email)` usado em
-- /admin/chamados e /atendimento — toda consulta com esse embed falhava com
-- PGRST200 e caía silenciosamente no fallback de lista vazia.
do $$ begin
  alter table public.support_tickets
    add constraint support_tickets_user_id_fkey
    foreign key (user_id) references public.profiles(id);
exception when duplicate_object then null;
end $$;
