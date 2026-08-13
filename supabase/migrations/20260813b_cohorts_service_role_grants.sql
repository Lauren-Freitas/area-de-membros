-- cohorts e cohort_members nunca tiveram grant para service_role na base viva,
-- apesar da migration inicial já declarar esse grant (drift entre o tracked
-- schema e o banco real). Toda a feature de Turmas usa createAdminClient()
-- (service_role) em src/lib/actions/cohorts.ts e não confere erro de retorno,
-- então create/update/delete de turma falha silenciosamente — a tela mostra
-- sucesso (redirect) mas nada é persistido.
grant select, insert, update, delete on public.cohorts to service_role;
grant select, insert, update, delete on public.cohort_members to service_role;
