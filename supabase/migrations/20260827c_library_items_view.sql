-- Etapa 4 (Biblioteca): view de leitura que une aula publicada + produto
-- avulso ativo (sem módulos) num formato único, pra filtrar/paginar os dois
-- com uma query só. Não é tabela nova, não duplica dado, só leitura.

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
where l.is_published = true and p.is_active = true

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
  and not exists (select 1 from public.modules m2 where m2.product_id = p.id);

grant select on public.library_items to authenticated;
grant select on public.library_items to service_role;
