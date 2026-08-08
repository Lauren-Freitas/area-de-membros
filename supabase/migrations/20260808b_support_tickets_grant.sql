-- Achado construindo a página admin de Chamados: support_tickets não tinha
-- NENHUM grant pra service_role (nem select). O fluxo do membro funciona hoje
-- porque usa o client com RLS (sessão do próprio usuário), mas a leitura/
-- resposta administrativa entre todos os membros precisa de service_role —
-- sem esse grant, /admin/chamados falharia por completo com 42501.
grant select, insert, update, delete on public.support_tickets to service_role;
