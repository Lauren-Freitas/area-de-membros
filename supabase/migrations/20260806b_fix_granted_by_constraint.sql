-- BUG PRÉ-EXISTENTE encontrado durante teste ponta a ponta: a constraint não
-- permitia granted_by = 'api', mas o código (rota POST /api/admin/acesso e a
-- concessão em massa de POST /api/admin/usuarios) sempre gravou esse valor
-- pra concessões feitas via API pública — toda concessão via API falhava
-- silenciosamente (upsert com ignoreDuplicates engole o erro sem lançar).
alter table public.user_products drop constraint if exists user_products_granted_by_check;
alter table public.user_products add constraint user_products_granted_by_check
  check (granted_by in ('manual', 'api', 'purchase', 'pack'));
