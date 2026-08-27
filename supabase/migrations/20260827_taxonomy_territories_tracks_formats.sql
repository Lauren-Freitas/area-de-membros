-- Etapa 2 da evolução da Área de Membros: territórios, trilhas de habilidade
-- e tipo de conteúdo editorial. Catálogos geríveis (não enum hardcoded), pra
-- crescer sem depender de deploy. Não altera products.category, lessons.lesson_type,
-- products.content_type, user_products, nem nada de nível de acesso/vitalício.

create table if not exists public.territories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.territories to service_role;
grant select on public.territories to authenticated;

create table if not exists public.skill_tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.skill_tracks to service_role;
grant select on public.skill_tracks to authenticated;

create table if not exists public.content_formats (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.content_formats to service_role;
grant select on public.content_formats to authenticated;

-- Território e tipo de conteúdo são valores únicos por conteúdo -> FK direta.
-- Em products, só valem quando o produto é avulso (sem módulos) -- mesmo
-- padrão que content_type/content_url já usam hoje.
alter table public.lessons add column if not exists territory_id uuid references public.territories(id);
alter table public.lessons add column if not exists content_format_id uuid references public.content_formats(id);
alter table public.products add column if not exists territory_id uuid references public.territories(id);
alter table public.products add column if not exists content_format_id uuid references public.content_formats(id);

create index if not exists lessons_territory_id_idx on public.lessons(territory_id);
create index if not exists lessons_content_format_id_idx on public.lessons(content_format_id);
create index if not exists products_territory_id_idx on public.products(territory_id);
create index if not exists products_content_format_id_idx on public.products(content_format_id);

-- Trilha é multivalorada (até 2, validado no server action) -> tabela de
-- junção com FK real pra lesson OU product (nunca os dois, nunca nenhum) --
-- evita a armadilha de content_kind+content_id genérico sem integridade real.
create table if not exists public.content_skill_tracks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  skill_track_id uuid not null references public.skill_tracks(id),
  created_at timestamptz not null default now(),
  constraint content_skill_tracks_one_owner check (
    (lesson_id is not null)::int + (product_id is not null)::int = 1
  ),
  constraint content_skill_tracks_lesson_track_unique unique (lesson_id, skill_track_id),
  constraint content_skill_tracks_product_track_unique unique (product_id, skill_track_id)
);
grant select, insert, update, delete on public.content_skill_tracks to service_role;
grant select on public.content_skill_tracks to authenticated;

create index if not exists content_skill_tracks_skill_track_id_idx on public.content_skill_tracks(skill_track_id);
create index if not exists content_skill_tracks_lesson_id_idx on public.content_skill_tracks(lesson_id);
create index if not exists content_skill_tracks_product_id_idx on public.content_skill_tracks(product_id);

-- Seed: 5 territórios (textos da documentação do produto)
insert into public.territories (slug, title, description, sort_order) values
  ('fundacao', 'Fundação: o que é comer', 'Mecanismos da fome, mitos populares sobre alimentação, por que dieta restritiva fracassa.', 1),
  ('comportamento-gatilhos', 'Comportamento alimentar e gatilhos', 'Mapeamento de gatilhos, padrões alimentares específicos, ambiente como gatilho.', 2),
  ('habilidades-comportamentais', 'Habilidades comportamentais', 'Mindfulness aplicado a comer, regulação emocional, tolerância ao estresse, efetividade interpessoal.', 3),
  ('cognicao-alimentar', 'Cognição alimentar', 'Distorções cognitivas, crenças centrais, defusão cognitiva e valores.', 4),
  ('contexto-manutencao', 'Contexto real e manutenção', 'Semana vs. fim de semana, eventos sociais, viagem, família, recaída e reentrada, manutenção e identidade.', 5)
on conflict (slug) do nothing;

-- Seed: 4 trilhas de habilidade
insert into public.skill_tracks (slug, title, description, sort_order) values
  ('executivas-operacionais', 'Habilidades executivas e operacionais', 'Transformar intenção em ação: planejamento de refeições, organização do ambiente, controle de estímulos, rotina, habilidades de cozinha.', 1),
  ('cognitivas', 'Habilidades cognitivas', 'Pensar sobre o próprio pensar: distorções cognitivas, crenças centrais, defusão, reestruturação cognitiva, valores alimentares.', 2),
  ('emocionais', 'Habilidades emocionais', 'Lidar com o que sente: nomear emoções, regulação emocional, tolerância ao desconforto, ação oposta.', 3),
  ('relacionais-contexto', 'Habilidades relacionais e de contexto', 'Navegar o mundo ao redor da comida: efetividade interpessoal, dizer não, eventos sociais, identidade alimentar pública.', 4)
on conflict (slug) do nothing;

-- Seed: tipos de conteúdo editoriais (lista definida pelo Thiago)
insert into public.content_formats (slug, title, sort_order) values
  ('video-thiago', 'Vídeo do Thiago', 1),
  ('aula-psicologa', 'Aula da psicóloga', 2),
  ('aula-educacao-fisica', 'Aula de educação física', 3),
  ('aula-nutricionista', 'Aula de nutricionista', 4),
  ('aula-convidado', 'Aula de convidado', 5),
  ('receita', 'Receita', 6),
  ('habilidade-cozinha', 'Habilidade de cozinha', 7),
  ('workshop', 'Workshop', 8),
  ('roda-editada', 'Roda editada', 9),
  ('extra', 'Extra', 10)
on conflict (slug) do nothing;
