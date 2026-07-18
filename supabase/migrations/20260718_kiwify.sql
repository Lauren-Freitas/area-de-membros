-- Vínculo do produto da área de membros com o produto correspondente na Kiwify.
alter table public.products add column if not exists kiwify_product_id text;
