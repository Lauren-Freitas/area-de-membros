-- Duas chaves novas em site_config, introduzidas ao remover strings de
-- "Thiago Cantalovo · Nutricionista · CRN-1 7985" hardcoded do código
-- (login, sidebar, e-mails transacionais e certificado) e passar a resolver
-- tudo via config, para que o repositório possa ser clonado para outro
-- profissional sem editar código-fonte.
--
-- Backfill idempotente: preserva o texto que já era exibido em produção
-- (certificado e telas de auth do Thiago) sem depender de um fallback
-- hardcoded no código para esse efeito.
insert into public.site_config (key, value) values
  ('platform_tagline',       'Nutricionista'),
  ('cert_issuer_credential', 'CRN-1 7985')
on conflict (key) do nothing;
