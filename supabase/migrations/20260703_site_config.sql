-- Tabela de configurações da plataforma (aparência, suporte, etc.)
create table if not exists public.site_config (
  key   text primary key,
  value text not null default ''
);

-- Habilita RLS (service role bypassa automaticamente)
alter table public.site_config enable row level security;

-- Insere os valores padrão
insert into public.site_config (key, value) values
  ('platform_name',   'Thiago Cantalovo'),
  ('primary_color',   '#b48840'),
  ('brand_light',     '#d2b17b'),
  ('bg_light',        '#e4e4e4'),
  ('bg_dark',         '#00060f'),
  ('card_bg_light',   '#ffffff'),
  ('card_bg_dark',    '#0d1020'),
  ('welcome_message', 'Bem-vindo à área de membros!'),
  ('support_whatsapp','5561991900589'),
  ('support_email',   'contato@thiagocantalovo.com')
on conflict (key) do nothing;
