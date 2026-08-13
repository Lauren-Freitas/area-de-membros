-- xp_settings nunca teve grant para service_role na base viva, apesar da
-- migration inicial já declarar esse grant (mesmo drift já visto em cohorts).
-- awardXp() (src/lib/xp.ts) lê xp_settings antes de qualquer outra coisa e
-- está dentro de um try/catch que engole o erro, retornando 0 silenciosamente.
-- Resultado: nenhum XP foi concedido a nenhum membro desde sempre — o sistema
-- de XP inteiro está morto, apesar de aparentar funcionar (nenhum erro visível).
grant select, insert, update, delete on public.xp_settings to service_role;
