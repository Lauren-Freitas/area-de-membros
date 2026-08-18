-- Mesmo drift já visto em cohorts/xp_settings/support_tickets: a migration
-- inicial já declarava o grant de service_role pra invites e offers, mas a
-- base viva nunca teve. Toda escrita nessas duas tabelas usa
-- createAdminClient() (service_role), então:
-- - criar convite sempre falhava com "permission denied for table invites";
-- - criar oferta sempre falhava do mesmo jeito, silenciosamente pro usuário
--   (a action não checava o erro em todos os pontos) — parecia "não fazer nada".
grant select, insert, update, delete on public.invites to service_role;
grant select, insert, update, delete on public.offers to service_role;
