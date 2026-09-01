-- Etapa: reestruturação da Biblioteca de materiais do acompanhamento.
-- 1) Desativa as trilhas de teste (só ligadas aos produtos de teste, confirmado
--    via content_skill_tracks -- zero relação com Método VAI!/Planner de Natação).
-- 2) Desativa os 3 produtos de teste (sem preço/buy_url/kiwify_product_id --
--    demo criado antes dos produtos reais, sem conteúdo real por trás).
-- 3) Cria a única categoria confirmada por dado real: "Comportamento".
-- 4) Amplia o CHECK constraint de content_type (drift não rastreado -- só
--    permitia 'file'/'video') pra aceitar 'link', necessário pros materiais
--    do Notion e pra opção "Link externo" adicionada no Admin.
-- 5) Insere os 14 materiais reais do acervo do Thiago (só título + link do
--    Notion -- nenhuma descrição/tag/dificuldade inventada). Só "Análise de
--    Resultados" recebe categoria; os outros ficam sem categoria até revisão
--    pelo Admin. "Ação Oposta..." entra sem link (não foi fornecido).

update public.skill_tracks set is_active = false
where slug in ('executivas-operacionais', 'cognitivas', 'emocionais', 'relacionais-contexto');

update public.products set is_active = false
where id in ('3b0ca6b3-c111-4a5a-9d1f-e4d4b589d38c', 'd076fa22-27a6-4db5-832a-6b05a9153be6', 'ad66bf8b-7520-4e70-babe-8fe36e111c45');

insert into public.skill_tracks (slug, title, sort_order)
values ('comportamento', 'Comportamento', 1)
on conflict (slug) do nothing;

alter table public.products drop constraint if exists products_content_type_check;
alter table public.products add constraint products_content_type_check
  check (content_type in ('file', 'video', 'link'));

insert into public.products (title, content_type, content_url, is_active, is_pack)
select * from (values
  ('Ação Oposta para interromper a autossabotagem', 'link', null, true, false),
  ('Análise de Resultados', 'link', 'https://app.notion.com/p/nutrithiago/An-lise-de-Resultados-b54b0cca387183c1bf2e816dfdfea877?source=copy_link', true, false),
  ('Arraiá sem culpa', 'link', 'https://app.notion.com/p/nutrithiago/Arrai-sem-culpa-3537d7fff8824a45996cfe95f48c161b?source=copy_link', true, false),
  ('Autoavaliação de Autoimagem e Autoestima', 'link', 'https://app.notion.com/p/nutrithiago/Autoavalia-o-de-Autoimagem-e-Autoestima-eb1b0cca38718200b179818bab097ca2?source=copy_link', true, false),
  ('Benefícios da Mudança', 'link', 'https://app.notion.com/p/nutrithiago/Benef-cios-da-Mudan-a-ac2b0cca38718221acc1015ffd417990?source=copy_link', true, false),
  ('Benefícios da Mudança', 'link', 'https://app.notion.com/p/nutrithiago/Benef-cios-da-Mudan-a-d60b0cca38718255a65f01c212825c88?source=copy_link', true, false),
  ('Copa do Mundo 2026', 'link', 'https://app.notion.com/p/nutrithiago/Copa-do-mundo-2026-243180b756f7411b9f5e6174f98fac7e?source=copy_link', true, false),
  ('Diário alimentar', 'link', 'https://app.notion.com/p/nutrithiago/Di-rio-alimentar-a8bb0cca387182ada24d0140b8c28af3?source=copy_link', true, false),
  ('Guia completo de refeições para congelar', 'link', 'https://app.notion.com/p/nutrithiago/Guia-completo-de-refei-es-para-congelar-1c3877277a524fafac0bd6ce502f735b?source=copy_link', true, false),
  ('Guia Prático de Autoavaliação Física', 'link', 'https://app.notion.com/p/nutrithiago/Guia-Pr-tico-de-Autoavalia-o-F-sica-22db0cca3871820c9c5f81c632288264?source=copy_link', true, false),
  ('Guia prático do planejamento da dieta', 'link', 'https://app.notion.com/p/nutrithiago/Guia-pr-tico-do-planejamento-da-dieta-37ab0cca387180969271e64cd608e0a8?source=copy_link', true, false),
  ('Journal para Pacientes', 'link', 'https://app.notion.com/p/nutrithiago/Journal-para-Pacientes-8acb0cca38718317b3e481495bc0bfa1?source=copy_link', true, false),
  ('Matriz da Mudança', 'link', 'https://app.notion.com/p/nutrithiago/Matriz-da-Mudan-a-4bdb0cca38718206826c81f75d321707?source=copy_link', true, false),
  ('Questionário de Relação com a Comida e Emoções', 'link', 'https://app.notion.com/p/nutrithiago/Question-rio-de-Rela-o-com-a-Comida-e-Emo-es-05db0cca387183d3aa3a0150a90683d4?source=copy_link', true, false)
) as v(title, content_type, content_url, is_active, is_pack)
where not exists (select 1 from public.products p where p.title = v.title and p.content_url is not distinct from v.content_url);

insert into public.content_skill_tracks (product_id, skill_track_id)
select p.id, st.id
from public.products p, public.skill_tracks st
where p.title = 'Análise de Resultados' and p.content_url like '%An-lise-de-Resultados%'
  and st.slug = 'comportamento'
  and not exists (
    select 1 from public.content_skill_tracks cst where cst.product_id = p.id and cst.skill_track_id = st.id
  );
