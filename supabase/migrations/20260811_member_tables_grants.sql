-- Achado testando comentário/avaliação/conclusão de ponta a ponta (revisão de
-- UX Fase 2): 13 tabelas usadas o tempo todo por ações do lado do membro
-- (comentar, avaliar, marcar aula concluída, postar na comunidade, conversar
-- com o assistente de IA, marcar notificação como lida) não tinham NENHUM
-- grant — nem pra `authenticated` (usado pelas Server Actions do membro via
-- createClient(), sessão RLS do próprio usuário) nem pra `service_role`
-- (usado pelo admin — dashboard "conteúdo mais acessado", "comentários
-- recentes", perfil/XP). As gravações vinham falhando silenciosamente: a UI
-- mostra sucesso (update otimista do lado do cliente), mas a linha nunca era
-- salva de verdade. Confirmado com teste real: like/rate/complete não
-- persistiam no banco antes desta migration.
--
-- Isso é consistente com todo o resto desta sessão: tabelas criadas fora de
-- migration rastreada (direto no painel do Supabase) não têm grant
-- automático nem pra authenticated nem pra service_role — só RLS, que sozinha
-- não basta (RLS restringe quais linhas, não se o role pode acessar a tabela
-- em primeiro lugar). A 00000000_initial_schema.sql já cobria isso pra
-- service_role em todas as 32 tabelas, mas aparentemente nunca chegou a ser
-- rodada — nenhuma das 13 abaixo tinha o grant de lá.
grant select, insert, update, delete on public.lesson_comments to authenticated, service_role;
grant select, insert, update, delete on public.product_comments to authenticated, service_role;
grant select, insert, update, delete on public.lesson_ratings to authenticated, service_role;
grant select, insert, update, delete on public.product_ratings to authenticated, service_role;
grant select, insert, update, delete on public.lesson_progress to authenticated, service_role;
grant select, insert, update, delete on public.community_posts to authenticated, service_role;
grant select, insert, update, delete on public.community_replies to authenticated, service_role;
grant select, insert, update, delete on public.ai_conversations to authenticated, service_role;
grant select, insert, update, delete on public.ai_messages to authenticated, service_role;
grant select, insert, update, delete on public.notifications to authenticated, service_role;
grant select, insert, update, delete on public.user_badges to authenticated, service_role;
grant select, insert, update, delete on public.xp_transactions to authenticated, service_role;
grant select on public.user_xp_totals to authenticated, service_role;
