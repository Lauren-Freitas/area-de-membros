-- Completa a integração de faturamento com o Asaas: preço/ciclo por produto,
-- vínculo de cliente e snapshot de pagamento por acesso concedido.

alter table public.profiles add column if not exists asaas_customer_id text;

alter table public.products add column if not exists asaas_product_id text;
alter table public.products add column if not exists price numeric;
alter table public.products add column if not exists billing_cycle text; -- null = avulso; ou WEEKLY|BIWEEKLY|MONTHLY|BIMONTHLY|QUARTERLY|SEMIANNUALLY|YEARLY

alter table public.user_products add column if not exists asaas_payment_id text;
alter table public.user_products add column if not exists value numeric;
alter table public.user_products add column if not exists billing_type text;
alter table public.user_products add column if not exists payment_status text; -- confirmed | overdue | refunded | chargeback (null = acesso manual)
alter table public.user_products add column if not exists invoice_url text;
