-- RLS foi habilitado nas 4 tabelas de taxonomia (territories, skill_tracks,
-- content_formats, content_skill_tracks) fora da migration original, sem
-- nenhuma policy -- resultado: select pra `authenticated` volta vazio (200,
-- 0 linhas), silenciosamente, mesmo com o grant correto. service_role
-- ignora RLS por padrão (bypassrls), por isso os testes anteriores via
-- service_role não pegaram isso.
--
-- Em vez de desligar RLS de novo (pode ter sido ligado de propósito no
-- dashboard), adiciona a policy de leitura que faltava -- dado de catálogo
-- sem nada sensível por linha, então "todo autenticado lê" é a regra certa.

create policy "territories: authenticated lê"
  on public.territories for select to authenticated using (true);

create policy "skill_tracks: authenticated lê"
  on public.skill_tracks for select to authenticated using (true);

create policy "content_formats: authenticated lê"
  on public.content_formats for select to authenticated using (true);

create policy "content_skill_tracks: authenticated lê"
  on public.content_skill_tracks for select to authenticated using (true);
