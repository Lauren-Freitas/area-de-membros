-- Achado durante a limpeza de dados de teste da validação final da fase de
-- Idempotency-Key: activity_logs só tinha select/insert pra service_role
-- (mesma causa raiz das duas rodadas anteriores — tabela criada fora de
-- migration rastreada). Sem impacto hoje (nenhum código faz update/delete
-- nela), mas fecha a lacuna antes que vire um bug real como os anteriores.
grant update, delete on public.activity_logs to service_role;
