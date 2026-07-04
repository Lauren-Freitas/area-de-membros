# Área de Membros — Thiago Cantalovo Nutricionista

Plataforma de ensino online completa, desenvolvida do zero, com painel administrativo, área de membros, assistente de IA e integrações com gateway de pagamento.

> Projeto desenvolvido como solução **white-label** para profissionais de saúde e educação, com foco em nutrição.

---

## Visão Geral

Uma plataforma SaaS de membros com:

- Autenticação por convite ou compra (integração com Asaas)
- Área de membros com cursos, módulos e aulas
- Sistema de gamificação (XP, rankings, badges, certificados)
- Comunidade integrada (fórum, comentários, avaliações)
- Assistente de IA especializado em nutrição (Proteíno, powered by Claude)
- Painel administrativo completo com relatórios, gestão de conteúdo e vendas
- Webhooks de saída para automações (n8n, Make, Zapier)
- API REST para integrações externas
- Suporte a modo escuro com identidade visual personalizável

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Framework** | Next.js 16 (App Router, React 19, Turbopack) |
| **Linguagem** | TypeScript 5 |
| **Banco de dados** | Supabase (PostgreSQL + Auth + Storage) |
| **Estilização** | Tailwind CSS v4 |
| **IA** | Anthropic Claude Haiku (streaming) |
| **E-mail** | Resend |
| **Pagamentos** | Asaas (webhook inbound) |
| **Deploy** | Vercel |

---

## Funcionalidades

### Para os Membros
- Dashboard com progresso em cursos, ofertas e banners promocionais
- Player de aulas com vídeo, texto, arquivos e links externos
- Marcação de aulas concluídas e certificado automático ao completar o curso
- Sistema de XP e ranking global entre membros
- Badges de conquista (primeira aula, primeiro comentário, etc.)
- Comunidade: fórum com posts, respostas e notificações
- Assistente de IA **Proteíno**: chatbot nutricional personalizado com histórico de conversas e suporte a imagens/PDFs
- Perfil editável com avatar, bio e preferência de tom do assistente
- Modo claro/escuro

### Para o Administrador
- Dashboard com métricas: total de membros, vendas, produtos ativos, certificados emitidos
- Gestão completa de produtos, módulos e aulas (CRUD)
- Liberação programada de módulos (imediata, após X dias, ou data fixa)
- Gestão de membros: adicionar, editar, conceder/revogar acesso a produtos
- Sistema de convites com código, limite de usos e expiração
- Turmas/cohorts para organizar membros por grupos
- Banners e ofertas flash com expiração configurável
- Painel financeiro: vendas, faturas e assinaturas (via Asaas)
- Certificados emitidos e gestão
- Relatórios e analytics
- Aparência personalizável: cores, nome da plataforma, mensagem de boas-vindas
- Gestão de API Keys e webhooks de saída

---

## Arquitetura

```
src/
├── app/
│   ├── (auth)/          # Rotas públicas: login, convite, recuperar senha
│   ├── (membro)/        # Área dos membros (autenticada)
│   │   ├── dashboard/
│   │   ├── produto/[id]/
│   │   ├── assistente/
│   │   ├── comunidade/
│   │   ├── perfil/
│   │   └── ranking/
│   ├── (admin)/admin/   # Painel administrativo (role: admin/equipe)
│   │   ├── usuarios/
│   │   ├── produtos/
│   │   ├── cobranca/
│   │   ├── integracoes/
│   │   ├── aparencia/
│   │   └── ...
│   └── api/             # API REST
│       ├── admin/       # Endpoints autenticados por API Key
│       ├── assistente/  # Chat IA (streaming)
│       ├── webhook/     # Recebe eventos do Asaas
│       └── appearance/  # Configurações visuais
├── lib/
│   ├── actions/         # Server Actions (Next.js)
│   ├── supabase/        # Clientes Supabase (server, client, admin)
│   └── resend.ts        # Envio de e-mails
└── components/          # Componentes reutilizáveis
```

---

## Banco de Dados

Gerenciado pelo Supabase (PostgreSQL) com Row-Level Security (RLS).

| Tabela | Descrição |
|---|---|
| `profiles` | Dados dos usuários (nome, avatar, role, preferências de IA) |
| `products` | Cursos e produtos |
| `modules` | Módulos de cada produto |
| `lessons` | Aulas individuais |
| `user_products` | Controle de acesso por produto |
| `lesson_progress` | Progresso de aulas por usuário |
| `certificates` | Certificados emitidos |
| `xp_transactions` | Log de pontuação (gamificação) |
| `user_xp_totals` | XP acumulado por usuário |
| `user_badges` | Badges conquistadas |
| `community_posts` | Posts do fórum |
| `community_replies` | Respostas nos posts |
| `ai_conversations` | Sessões de chat com o assistente |
| `ai_messages` | Mensagens do chat |
| `banners` | Banners promocionais |
| `offers` | Ofertas flash |
| `cohorts` | Turmas |
| `invites` | Códigos de convite |
| `api_keys` | Chaves de API para integrações |
| `outbound_webhooks` | Destinos de webhook para automações |
| `webhook_logs` | Auditoria de webhooks recebidos |
| `site_config` | Configurações visuais da plataforma |

---

## Integrações

### Asaas (Gateway de Pagamento)
Recebe eventos via webhook. Ao confirmar pagamento: cria o usuário, concede acesso ao produto e envia e-mail de boas-vindas.

### Resend (E-mail)
E-mails transacionais: boas-vindas, acesso concedido e convite de colaborador.

### Anthropic Claude (IA)
Modelo Claude Haiku com streaming para o assistente Proteíno. Contexto personalizado por usuário, histórico persistido, suporte a imagens e PDFs.

### n8n / Make / Zapier
Webhooks de saída configuráveis em eventos de venda e acesso. Payload padronizado com dados do usuário e produto.

---

## Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
ANTHROPIC_API_KEY=
ADMIN_API_KEY=
```

---

## Como Rodar Localmente

```bash
git clone https://github.com/thiagocantalovo/area-de-membros-thiago.git
cd area-de-membros-thiago
npm install
cp .env.example .env.local   # preencha as variáveis
npm run dev
```

Acesse `http://localhost:3000`.

---

## Deploy

Deploy automático na **Vercel** a cada push na branch `main`. Produção em `membros.thiagocantalovo.com`.

---

## Documentação da API

A referência completa dos endpoints REST está em **[API.md](./API.md)**, incluindo exemplos de integração com n8n, Make e Zapier.

---

## Créditos

Desenvolvido por **Lauren Freitas** para o nutricionista **Thiago Cantalovo**.
