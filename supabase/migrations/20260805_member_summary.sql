-- Redesign "Gerenciar Membros": notas internas por membro + view agregada
-- para paginação/busca/filtro/ordenação sem carregar a tabela inteira.

alter table public.profiles add column if not exists notes text;

create or replace view public.member_summary as
select
  p.id,
  p.name,
  p.email,
  p.phone,
  p.avatar_url,
  p.role,
  p.is_active,
  p.last_login_at,
  p.created_at,
  p.notes,
  count(up.product_id) filter (where up.product_id is not null)::int as products_count,
  coalesce(array_agg(pr.title order by up.granted_at desc) filter (where pr.title is not null), '{}') as product_titles,
  min(up.expires_at) filter (where up.expires_at is not null) as next_expiry,
  bool_or(up.product_id is not null and up.expires_at is null) as has_permanent_access,
  bool_or(pr.billing_cycle is not null and up.payment_status = 'confirmed') as is_subscriber
from public.profiles p
left join public.user_products up on up.user_id = p.id
left join public.products pr on pr.id = up.product_id
where p.role = 'membro' or p.role is null
group by p.id;

grant select on public.member_summary to service_role;
