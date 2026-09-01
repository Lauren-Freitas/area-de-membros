-- Etapa: separar materiais de acompanhamento (Biblioteca) de produtos comerciais.
-- Flag explícita, sem heurística (content_type/URL/preço/ausência de módulos
-- deixam de decidir o que é material -- só is_library_material decide).

alter table public.products
  add column if not exists is_library_material boolean not null default false;

-- Marca explicitamente só os 14 materiais reais cadastrados a partir do
-- catálogo do Notion. Método VAI!, Planner de Competições de Natação e
-- qualquer outro produto ficam de fora (default false).
update public.products set is_library_material = true
where id in (
  '143c0702-7669-47b6-b1df-326f9ee1665d', -- Ação Oposta para interromper a autossabotagem
  '24ff1b41-ce90-4117-8112-08b39765e9aa', -- Análise de Resultados
  '569479d8-7b8d-455a-ad94-b711ba2c1159', -- Arraiá sem culpa
  '5db3d56c-6aa4-4a6d-b7c1-c36a529d12f1', -- Autoavaliação de Autoimagem e Autoestima
  '0adbe2f5-63ba-4b2d-8c1b-d529b74437df', -- Benefícios da Mudança (d60b0cca...)
  '72222636-fe6d-43d0-b04f-c04437417bc8', -- Benefícios da Mudança (ac2b0cca...)
  'f23c95da-edba-474e-8656-4c98ee9df06c', -- Copa do Mundo 2026
  'b69cb31d-cbba-49d2-922b-3ac318169041', -- Diário alimentar
  'd670d211-66d8-48ad-b361-7cf9d8af5ccc', -- Guia completo de refeições para congelar
  'b20f4b53-181f-487c-9f35-6d4c01dcfaa9', -- Guia Prático de Autoavaliação Física
  '1d8f4185-dc30-4a8e-9ff4-026d239047ce', -- Guia prático do planejamento da dieta
  '45177bec-3d4f-4e8e-9c71-58ef1ef4c409', -- Journal para Pacientes
  'd5004a13-b4c4-4d97-8723-59101956b4ae', -- Matriz da Mudança
  '609cb088-032d-4bc1-a1fa-1915b581e0be'  -- Questionário de Relação com a Comida e Emoções
);

-- library_items passa a exigir is_library_material = true em ambos os ramos.
-- "not exists modules" no ramo de produto não identifica material -- só evita
-- listar um curso duas vezes (como item único e como suas aulas), caso um
-- material real algum dia ganhe módulos. Não afeta nenhum dos 14 hoje.
create or replace view public.library_items as
select
  l.id as content_id,
  'lesson'::text as kind,
  l.title,
  l.description,
  l.territory_id,
  l.content_format_id,
  m.product_id,
  p.title as product_title,
  l.created_at
from public.lessons l
join public.modules m on m.id = l.module_id
join public.products p on p.id = m.product_id
where l.is_published = true and p.is_active = true and p.is_library_material = true

union all

select
  p.id as content_id,
  'product'::text as kind,
  p.title,
  p.description,
  p.territory_id,
  p.content_format_id,
  p.id as product_id,
  p.title as product_title,
  p.created_at
from public.products p
where p.is_active = true
  and p.is_library_material = true
  and not exists (select 1 from public.modules m2 where m2.product_id = p.id);

grant select on public.library_items to authenticated;
grant select on public.library_items to service_role;
