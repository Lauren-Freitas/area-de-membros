-- O default de welcome_message era "Bem-vindo à área de membros!" (gênero
-- masculino fixo, sem informação de gênero do membro). Atualiza a linha já
-- semeada em site_config só se ela ainda for exatamente o default antigo —
-- nunca sobrescreve uma mensagem que o admin já tenha personalizado.
update public.site_config
set value = 'Boas-vindas à área de membros!'
where key = 'welcome_message'
  and value = 'Bem-vindo à área de membros!';
