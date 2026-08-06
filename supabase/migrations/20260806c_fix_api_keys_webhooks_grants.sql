-- BUG PRÉ-EXISTENTE encontrado durante teste ponta a ponta: api_keys e
-- outbound_webhooks foram criadas fora de migration rastreada (direto no
-- dashboard) e nunca receberam grant pra service_role — toda a plataforma
-- roda com esse role no backend, então "Criar API Key" e "Criar Webhook"
-- provavelmente falham hoje. outbound_webhook_deliveries já tinha o grant
-- certo (20260804_webhook_deliveries.sql); estas duas nunca tiveram.
grant select, insert, update, delete on public.api_keys to service_role;
grant select, insert, update, delete on public.outbound_webhooks to service_role;
