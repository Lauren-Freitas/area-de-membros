-- Achado no mesmo teste de ponta a ponta da migration anterior: diferente
-- das outras 13 tabelas (que não tinham grant nenhum), user_products já
-- tinha select/insert pra authenticated, mas não update — por isso marcar
-- um produto "simples" (sem módulos/aulas) como concluído
-- (markProductComplete/unmarkProductComplete, via createClient()) falhava
-- silenciosamente, mesmo com o resto funcionando. Confirmado com escrita
-- real: UPDATE direto retornava 42501 antes desta migration.
grant update on public.user_products to authenticated;
