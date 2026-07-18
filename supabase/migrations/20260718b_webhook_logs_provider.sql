-- Distingue a origem do evento (asaas, kiwify, ...) sem precisar prefixar event_type.
alter table public.webhook_logs add column if not exists provider text;

-- Backfill: linhas já gravadas com o prefixo "kiwify_" viram provider=kiwify sem o prefixo.
update public.webhook_logs
set provider = 'kiwify', event_type = replace(event_type, 'kiwify_', '')
where event_type like 'kiwify_%';

-- Tudo que sobrar (histórico anterior à Kiwify) é do Asaas.
update public.webhook_logs
set provider = 'asaas'
where provider is null;
