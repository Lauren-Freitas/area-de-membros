# Documentação — Área de Membros (Thiago Cantalovo)

> Referência de arquitetura gerada a partir do código-fonte em `area-de-membros`, pra uso na construção de outro app (mobile ou nova versão). Reflete o estado do projeto em 2026-07-22.

---

## 1. Estrutura geral

O app tem três grupos de rotas: **auth** (público, não logado), **membro** (aluno logado) e **admin** (admin/equipe logado). Layout raiz único (`src/app/layout.tsx`) injeta CSS de marca dinâmico e contexto de logo; cada grupo tem seu próprio layout visual.

### Área do aluno — `(membro)`

| Rota | Função |
|---|---|
| `/dashboard` | Home do aluno: "Meus conteúdos" (produtos com acesso) + "Disponíveis para compra" (produtos bloqueados) + banners + ofertas relâmpago + turma (se houver) |
| `/produto/[id]` | Página de um curso: lista de módulos → aulas, barra de progresso, banner de certificado quando concluído. Produtos sem módulos (conteúdo único) mostram visão simplificada com avaliação/comentários direto |
| `/produto/[id]/aula/[aulaId]` | Página de uma aula: vídeo e/ou texto rico e/ou anexos, comentários, avaliação, navegação prev/next |
| `/certificado/[id]` | Certificado de conclusão (imprimível) |
| `/conta` | Dados da conta, foto de perfil, telefone, notificações |
| `/perfil` | Perfil público-ish: nível, XP, badges, progresso |
| `/ranking` | Ranking de XP entre membros |
| `/comunidade`, `/comunidade/nova`, `/comunidade/[postId]` | Fórum simples: posts + respostas |
| `/assistente`, `/assistente/[id]` | Chat com IA ("Proteíno", assistente do app) — conversas + mensagens |
| `/atendimento` | Abrir chamado de suporte |
| `/assinatura` | Status da assinatura (Asaas) |
| `/busca` | Busca global de conteúdo |
| `/convite/[code]` | Cadastro via link de convite (fora do grupo `(membro)`, pré-login) |

### Área admin — `(admin)/admin`

| Rota | Função |
|---|---|
| `/admin` | Dashboard: KPIs (membros, produtos ativos, vendas 7/30 dias), membros recentes |
| `/admin/produtos`, `/produtos/[id]`, `/produtos/[id]/modulos/novo`, `/modulos/[modId]`, `/aulas/novo` | CRUD de produto → módulo → aula, com reordenação drag-and-drop |
| `/admin/usuarios`, `/usuarios/novo`, `/usuarios/[id]` | CRUD de membros/colaboradores, concessão/revogação de acesso a produtos |
| `/admin/convites`, `/convites/novo`, `/convites/[id]` | Links de convite com produtos pré-vinculados |
| `/admin/turmas`, `/turmas/nova`, `/turmas/[id]` | Cohorts (turmas com data de início/fim, membros) |
| `/admin/banners`, `/banners/novo`, `/banners/[id]` | Banners do dashboard do aluno |
| `/admin/ofertas`, `/ofertas/nova`, `/ofertas/[id]` | Ofertas relâmpago (preço promo + cupom + countdown) |
| `/admin/certificados` | Lista de certificados emitidos |
| `/admin/cobranca/vendas`, `/faturas`, `/assinatura` | Vendas (histórico de acesso concedido), faturas, status da assinatura da plataforma |
| `/admin/relatorios` | Relatórios agregados |
| `/admin/atividades` | Log de auditoria (quem fez o quê) |
| `/admin/suporte` | Fila de chamados de suporte |
| `/admin/configuracoes` | Dados da conta admin, equipe (admin/equipe) |
| `/admin/aparencia` | White-label: cor da marca, logo, favicon, textos, e-mail/whatsapp de suporte |
| `/admin/integracoes`, `/integracoes/api`, `/integracoes/asaas`, `/integracoes/webhooks` | Chaves de API (n8n), doc de endpoints, webhooks de saída |

### Relação entre entidades (visão de produto)

```
Produto (curso)
 ├─ Módulo (opcional — produto pode não ter módulos, aí é "conteúdo único")
 │   └─ Aula
 │        ├─ conteúdo: vídeo (url) + texto rico (html) + anexos (arquivos)
 │        ├─ regra de liberação própria (pode ser diferente da do módulo)
 │        └─ comentários, avaliação, progresso por aluno
 ├─ Turma (cohort) — opcional, agrupa membros com datas de início/fim
 ├─ Convite — link que já vem com produto(s) vinculado(s)
 └─ Membro tem acesso via `user_products` (compra, manual, ou pack)
```

Um **Pack** é um produto com `is_pack = true`: comprar/receber acesso a ele libera automaticamente todos os outros produtos ativos (`expandProductIds`, usado nos dois webhooks de pagamento e implicitamente equivalente na concessão manual).

---

## 2. Modelo de dados

Banco Postgres (Supabase). **Não existe um schema.sql completo no repo** — a maior parte das tabelas foi criada direto no console do Supabase; só 5 migrations pontuais estão versionadas (`site_config`, `asaas_billing`, `kiwify`, `webhook_logs provider`, `lesson_content`). A lista abaixo foi reconstruída lendo todos os `.select()/.insert()/.update()` do código — é a fonte mais confiável hoje.

### Conteúdo

**`products`** — o curso/produto vendável
`id, title, description, banner_url, content_type ('video'|'file'), content_url, asaas_product_id, kiwify_product_id, buy_url, price, billing_cycle (WEEKLY|BIWEEKLY|MONTHLY|BIMONTHLY|QUARTERLY|SEMIANNUALLY|YEARLY|null), is_active, is_pack, sort_order, category, created_at`

**`modules`** — agrupador de aulas dentro de um produto
`id, product_id → products.id, title, description, sort_order, release_type ('immediate'|'days_after'|'date'), release_after_days, release_at, created_at`

**`lessons`** — a unidade de conteúdo
`id, module_id → modules.id, title, description, lesson_type ('video'|'text'|'file'|'link'), content_url, content_text, content_html, sort_order, is_published, release_type, release_after_days, release_at, access_duration_days (prazo de acesso contado a partir da liberação, não da compra), created_at`

**`lesson_attachments`** — arquivos anexados a uma aula
`id, lesson_id → lessons.id (cascade delete), file_name, file_path (Storage), file_size, mime_type, sort_order, created_at`

### Acesso e membros

**`profiles`** — 1:1 com `auth.users` (Supabase Auth)
`id (= auth.users.id), name, email, role ('admin'|'equipe'|'membro', legado nulo = membro), asaas_customer_id, is_active, phone, bio, avatar_url, timezone, ai_tone ('empatico'|'direto'|'tecnico' — usado só na API do assistente, não mais exposto na UI do membro), created_at`

**`user_products`** — a tabela central de controle de acesso (M:N membro↔produto)
`id, user_id → profiles.id, product_id → products.id, granted_at, granted_by ('purchase'|'manual'|'pack'), expires_at (nullable — acesso vitalício quando null), is_completed, completed_at, asaas_payment_id, value, billing_type, payment_status ('confirmed'|'overdue'|'refunded'|'chargeback'), invoice_url` — único por `(user_id, product_id)`.

**`invites`** — link de convite reutilizável
`id, code, note, product_ids (array — produtos concedidos ao usar), max_uses, used_count, expires_at, created_at`

**`cohorts`** (turma) — `id, name, description, product_id → products.id (nullable), starts_at, ends_at, created_at`
**`cohort_members`** — `cohort_id → cohorts.id, user_id → profiles.id` (par único)

### Progresso, avaliação, engajamento

**`lesson_progress`** — `id, user_id, lesson_id, completed, completed_at, created_at` (único por `user_id+lesson_id`)
**`lesson_ratings`** / **`product_ratings`** — `id, user_id, lesson_id|product_id, product_id (denormalizado em lesson_ratings), rating (1-5), updated_at` (único por par)
**`lesson_comments`** / **`product_comments`** — `id, user_id, lesson_id|product_id, content, created_at`
**`certificates`** — `id, user_id, product_id, issued_at` (emitido quando todas as aulas publicadas do produto são concluídas)

**Gamificação:**
**`xp_settings`** — `event_type (chave: lesson_comment, product_comment, lesson_rating, product_rating, lesson_complete, product_complete), xp_amount, is_enabled` — configuração de quanto XP cada ação vale (não há tela de admin pra isso ainda, é editado direto no banco)
**`xp_transactions`** — `id, user_id, event_type, xp_amount, metadata (jsonb), created_at`
**`user_xp_totals`** — `user_id, total_xp` (total agregado, provavelmente mantido por trigger no banco)
**`user_badges`** — `id, user_id, badge_key (first_comment|first_rating|first_lesson|lessons_10|lessons_100|first_product), awarded_at`

Níveis são calculados em código (não no banco), 10 níveis de 0 a 25.000 XP (`src/lib/xp.ts`).

### Comunidade e suporte

**`community_posts`** — `id, user_id, title, body, pinned, created_at`
**`community_replies`** — `id, post_id → community_posts.id, user_id, body, created_at`
**`support_tickets`** — `id, user_id, subject, product_id (nullable), message, created_at`
**`ai_conversations`** — `id, user_id, title, created_at`
**`ai_messages`** — `id, conversation_id → ai_conversations.id, role ('user'|'assistant'), content, created_at`

### Admin / plataforma

**`site_config`** — key-value genérico (`key text primary key, value text`). Chaves conhecidas: `platform_name, primary_color, brand_light, bg_light, bg_dark, card_bg_light, card_bg_dark, welcome_message, support_whatsapp, support_email, logo_url, favicon_url`
**`banners`** — `id, title, body, link, link_label, type ('info'|'success'|'warning'|'promo'), is_active, expires_at, sort_order, created_at`
**`offers`** — `id, product_id (nullable), title, description, original_price, promo_price, coupon_code, ends_at, sort_order, is_active, created_at`
**`api_keys`** — `id, name, key, created_at, last_used_at` (autenticação da API externa, usada pelo n8n)
**`outbound_webhooks`** — `id, name, url, product_id (nullable — filtra por produto), is_active, last_fired_at, last_status, created_at`
**`webhook_logs`** — `id, event_type, provider ('asaas'|'kiwify'), asaas_payment_id (nullable), status ('processed'|'failed'|'ignored'), error_message, payload (jsonb), created_at`
**`activity_logs`** — `id, user_id, user_name, user_role (snapshot), action, entity, entity_id, entity_name, created_at`

### Diagrama de relações (principais FKs)

```
profiles ──┬── user_products ──── products ──┬── modules ── lessons ── lesson_attachments
           │                                  │                 │
           ├── lesson_progress ───────────────┼─────────────────┘
           ├── lesson_ratings / lesson_comments
           ├── product_ratings / product_comments
           ├── certificates ───────────────────┘
           ├── cohort_members ── cohorts ── products (nullable)
           ├── xp_transactions ── user_xp_totals / user_badges
           ├── community_posts ── community_replies
           ├── ai_conversations ── ai_messages
           ├── support_tickets ── products (nullable)
           └── activity_logs

invites.product_ids (array) ──> products.id
outbound_webhooks.product_id (nullable) ──> products.id
```

---

## 3. Lógica de negócio

### Liberação de conteúdo (`src/lib/release.ts` — `computeReleaseState`)

Módulo e aula têm, **cada um independentemente**, um `release_type`:
- **`immediate`** — libera assim que o aluno tem acesso ao produto (data de liberação = `granted_at`, ou "agora" se não houver data de concessão)
- **`days_after`** — libera N dias após `granted_at` (`release_after_days`)
- **`date`** — libera numa data/hora fixa pra todo mundo (`release_at`), independe de quando cada aluno comprou

Além disso, uma **aula** (não o módulo) pode ter `access_duration_days`: um prazo que começa a contar **a partir da própria liberação da aula** (não da compra) — passado esse prazo, a aula fica marcada como expirada e some da lista, mesmo que o aluno ainda tenha acesso ao produto. Serve pra conteúdo "disponível por tempo limitado" dentro de um curso vitalício.

A função retorna `{ isReleased, releaseDate, isExpired }`; o app filtra módulos/aulas não liberados ou expirados antes de renderizar (dupla checagem: página do produto E página da aula individual, essa última faz redirect se a aula não estiver liberada — evita acesso direto por URL).

### Controle de acesso a produtos

- A tabela `user_products` é a fonte da verdade: existe linha = tem acesso. `granted_by` registra a origem (`purchase` via webhook de pagamento, `manual` via admin, `pack` quando herdado de um produto is_pack).
- **`expires_at`** (nullable): acesso vitalício quando nulo; setado programaticamente hoje só é lido, não há UI pra definir prazo de acesso a produto (diferente do prazo de aula, que tem UI). Isso é um gap: a proposta de "vitalício vs. tempo determinado" discutida durante a sessão de design ainda não foi implementada — hoje é binário (tem/não tem linha).
- **`profiles.is_active`**: conta desativada bloqueia login independente de ter produtos — checado no layout do grupo `(membro)`, redireciona pra `/login?erro=conta-desativada`.
- Conceder/revogar acesso manualmente é feito pelo admin em "Gerenciar membros" → clicar num badge de produto abre a ação direto (`grantAccess`/`revokeAccess`, `src/lib/actions/admin.ts`) — **não dispara nenhum webhook de saída**.

### Webhooks (entrada e saída)

**Entrada (pagamento → acesso):** dois endpoints, `POST /api/webhook/kiwify` e `POST /api/webhook/asaas`, cada um com listas próprias de eventos:

| | Kiwify | Asaas |
|---|---|---|
| Concede acesso | `order_approved`, `compra_aprovada`, `subscription_renewed` | `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` |
| Marca em atraso | `subscription_late` | `PAYMENT_OVERDUE` |
| Revoga acesso | `order_refunded`, `compra_reembolsada`, `refunded`, `order_rejected`, `compra_recusada`, `chargeback`, `chargedback`, `subscription_canceled(led)` | `PAYMENT_REFUNDED`, `PAYMENT_DELETED`, `PAYMENT_CHARGEBACK_REQUESTED` |

Todo webhook recebido é logado em `webhook_logs` (processado/falhou/ignorado + payload bruto), pra debug. Produto `is_pack` expande pra todos os produtos ativos no momento da concessão.

**Saída (automação, ex. n8n):** `src/lib/fire-webhooks.ts` — dispara `POST` pros `outbound_webhooks` ativos (filtrando por `product_id` se configurado), com corpo `{ event, timestamp, ...payload }`. Só é chamado hoje a partir de `POST /api/admin/acesso` (endpoint de API externa, autenticado por API key), evento `sale.created` — **não é chamado nem pelos webhooks de pagamento nem pela concessão manual no painel admin**. Existe um segundo evento definido (`member.created`) mas nunca disparado — provavelmente planejado, não implementado. O `DELETE` do mesmo endpoint (revogar via API) também não dispara webhook — assimetria conhecida, não corrigida ainda.

### Ordenação

`sort_order` (inteiro) em `products`, `modules`, `lessons`, `banners`, `offers`. Módulos e aulas são reordenados via drag-and-drop (dnd-kit) direto na tela do produto — `reorderModulesAndLessons` (`src/lib/actions/admin.ts`) recebe as listas já reordenadas do client e faz `update` em lote (também permite mover uma aula pra outro módulo, não só reordenar dentro do mesmo).

### Gamificação (XP/níveis/badges)

Ações do aluno disparam `awardXp(userId, eventType)`: comentar aula/produto, avaliar aula/produto, concluir aula, concluir produto. Cada `eventType` tem valor e liga/desliga configurável em `xp_settings` (hoje só editável direto no banco). Cada award é uma linha em `xp_transactions`; `user_xp_totals` é o total agregado. Badges são concedidos automaticamente ao cruzar marcos (1º comentário, 1ª avaliação, 1ª/10ª/100ª aula concluída, 1º curso concluído) — checagem por contagem simples após cada ação, sem cron.

---

## 4. Design / UI

### Sistema de cores (dinâmico, pensado pra white-label)

Não há biblioteca de design system (nem shadcn, nem MUI etc.) — é Tailwind puro com um **sistema de tokens CSS customizado** que permite o admin trocar a cor da marca, fundos e logo sem deploy:

- `site_config` guarda a config (cor primária, tons de fundo claro/escuro, cor do card, logo, favicon) editável em `/admin/aparencia`.
- `src/app/layout.tsx` lê essa config a cada request e injeta um `<style>` inline no `<head>` sobrescrevendo variáveis CSS (`--brand`, `--brand-light`, `--brand-bg`, `--brand-border`, `--brand-text`, `--background`, `--card`) em `:root` (modo claro) e `.dark` (modo escuro).
- `src/lib/color.ts`: conversão HSL pura (sem dependência) que deriva automaticamente `brand-bg`/`brand-border`/`brand-text` a partir de UMA cor escolhida pelo admin — evita pedir 6 cores manualmente, o admin só escolhe a cor principal.
- `src/app/globals.css` define os valores-padrão (fallback) nessas mesmas variáveis, e mapeia pra utilities do Tailwind v4 via `@theme inline` (`--color-brand`, `--color-card` etc. → gera `bg-brand`, `text-brand-text`, `bg-card`...).
- Logo e favicon: upload no bucket Storage `branding`, URL salva em `site_config.logo_url`/`favicon_url`; componente `<BrandLogo>` usa a logo customizada se houver, senão cai nos PNGs padrão do projeto.

Paleta padrão: dourado/âmbar (`#b48840` como marca, `#e4e4e4`/`#ffffff` fundo claro, `#00060f`/`#0d1020` fundo escuro — azul-marinho bem escuro, não preto puro).

Cores semânticas (verde=sucesso, vermelho=erro, âmbar=aviso, azul=info, roxo=admin) são fixas do Tailwind (`green-50`, `red-50` etc.), **não** seguem a cor da marca — só a paleta de marca é dinâmica.

### Ícones

SVG inline no estilo Heroicons (traço fino, `strokeWidth={1.5-2}`, `viewBox 0 0 24 24`), na cor da marca ou em cinza neutro conforme o contexto — sem biblioteca de ícones instalada (`lucide-react`, `heroicons` etc. não são dependências; os SVGs são colados direto no JSX). Um padrão recorrente: ícone dentro de um círculo com fundo `var(--brand-bg)`, usado pra tipo de conteúdo (vídeo/texto/arquivo/link), certificado, upload etc.

### Tipografia

Fonte única: **Geist Sans** (`next/font`, variável `--font-geist-sans`), sem fonte serifada. Sem escala tipográfica formal documentada — tamanhos usados ad-hoc via classes Tailwind (`text-xs` a `text-2xl`).

### Modo escuro

Implementado via classe `.dark` no `<html>` (toggle manual, `ThemeToggle`), não via `prefers-color-scheme` puro. Duas camadas:
1. **Global**: os tokens CSS (`--background`, `--card`, `--brand-*`) têm valor diferente dentro de `.dark`, então a maioria dos componentes que usa `bg-card`/`var(--background)` já funciona automaticamente nos dois modos.
2. **Admin, escopo `[data-admin]`**: como boa parte do admin foi construída em cinza neutro do Tailwind (`bg-white`, `text-gray-800` etc.) em vez dos tokens, existe um bloco grande de overrides em `globals.css` (`.dark [data-admin] .text-gray-800 { color: ... }` etc.) que remapeia essas classes especificamente dentro do admin em modo escuro. **Isso é uma fonte recorrente de bugs**: qualquer elemento que tenha um fundo sempre-claro por design (ex: opção de rádio selecionada com destaque amarelo) pode ter o texto ilegível, porque o override de cor é aplicado sem saber que o fundo daquele elemento específico não escureceu. Numa reconstrução, vale a pena usar os tokens CSS em tudo desde o início, em vez de um mapa de overrides por cima de classes neutras do Tailwind.

Não há dark mode nativo em e-mails transacionais (Resend) nem no PWA manifest — esses usam cor literal fixa (não podem usar `var(...)`).

---

## 5. Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2.9 (App Router, Server Components + Server Actions, Turbopack) |
| UI | React 19.2.4, TypeScript 5, Tailwind CSS v4 (config 100% em CSS via `@theme inline`, sem `tailwind.config.js`) |
| Banco/Auth/Storage | Supabase (Postgres + Supabase Auth + Storage) — `@supabase/supabase-js` + `@supabase/ssr` |
| Editor de texto rico | Tiptap (`@tiptap/react` + `starter-kit` + extensões de link/imagem) + `sanitize-html` no servidor antes de renderizar HTML gerado pelo usuário |
| Drag-and-drop | `@dnd-kit/core` + `sortable` + `utilities` (reordenar módulos/aulas) |
| E-mail transacional | Resend (`resend` SDK) — convites, boas-vindas, acesso concedido |
| IA (assistente "Proteíno") | `@anthropic-ai/sdk` |
| Pagamento | Asaas (assinatura recorrente da plataforma) + Kiwify (produtos individuais), via webhooks próprios |
| Deploy | Vercel (`vercel deploy --prod`), repo no GitHub |

### Estrutura de pastas (essencial)

```
src/
  app/
    (auth)/          rotas públicas: login, criar-senha, esqueceu-senha, nova-senha
    (membro)/        área do aluno (layout com header/nav próprios)
    (admin)/admin/   painel admin (layout com sidebar própria)
    api/             rotas de API: webhooks (kiwify/asaas), API externa (admin/usuarios, admin/produtos,
                     admin/acesso — usadas pelo n8n), assistente (chat IA), appearance
    convite/[code]/  cadastro via convite (fora dos grupos acima)
    layout.tsx       layout raiz — injeta CSS de marca dinâmico, contexto de logo
    globals.css      tokens de cor, overrides de dark mode do admin
  components/        componentes de UI compartilhados (membro + admin misturados)
    admin/           componentes só do admin (Sidebar, ModulesManager, RichTextEditor, Switch...)
  lib/
    actions/         Server Actions, uma por domínio (admin.ts, member.ts, offers.ts, community.ts,
                     progress.ts, ratings.ts, comments.ts, cohorts.ts, invite.ts, integracoes.ts,
                     appearance.ts, attachments.ts, notifications.ts)
    supabase/        clients (server, admin/service-role, client-side)
    release.ts       lógica de liberação de conteúdo (computeReleaseState)
    xp.ts            XP, níveis, badges
    fire-webhooks.ts dispatcher de webhooks de saída
    color.ts         derivação HSL de tons de marca
    resend.ts        templates de e-mail
    appearance-defaults.ts  valores padrão de site_config
  types/index.ts      tipos TypeScript (parcial — ver nota abaixo)
supabase/migrations/   só 5 migrations pontuais; maior parte do schema não está versionada
```

### Convenções e pegadinhas pra levar pra um novo app

- **Server Actions** são o padrão pra mutação (não API routes), exceto onde precisa ser chamado por fora (webhooks de pagamento, API do n8n, `/api/appearance` que é documentado externamente em `API.md`).
- **Toggle de estado direto numa lista** (ex: clicar num badge "Ativo/Inativo" pra já mudar) foi identificado como um padrão arriscado (muda sem confirmação) e removido de Produtos/Ofertas em favor de um switch explícito dentro da tela de edição — vale manter essa regra no novo app: nenhuma mutação de um clique só em telas de listagem.
- **`src/types/index.ts` está desatualizado** em relação ao banco real (faltam campos usados em queries, ex. `user_products.expires_at`/`is_completed`, `profiles.ai_tone`, e não existem interfaces pra boa parte das tabelas de gamificação/comunidade/admin). Não confiar nele como fonte única da verdade — numa reconstrução, gerar os tipos direto do schema (`supabase gen types`) evitaria esse desalinhamento.
- **RLS + GRANTs**: no Supabase, políticas de RLS não bastam sozinhas — várias tabelas precisaram de `GRANT` explícito pra `service_role`/`anon`/`authenticated` além das policies, ou operações falhavam silenciosamente. Vale checar os dois desde o início num novo projeto.
