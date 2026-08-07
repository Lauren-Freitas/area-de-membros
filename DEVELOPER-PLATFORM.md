# Developer Platform v1 — Resumo Técnico

**Status:** concluída e congelada (feature freeze) em 2026-08-06. Sem novas mudanças estruturais previstas até que o uso real (Notion → n8n → Área de Membros → Paciente) revele necessidade concreta.

---

## 1. Arquitetura final

```
UI (Server Actions)  ─┐
API pública /api/v1/*  ├─→  Camada de domínio (src/lib/core/*)  →  Supabase (service_role)
Webhooks de entrada    ┘         │
                                  └─→ emitEvent() → activity_logs + outbound webhooks
```

- **Camada de domínio única** (`src/lib/core/{members,products,access,events,actor}.ts`) — toda regra de negócio mora aqui. A UI administrativa, a API pública e os webhooks de entrada (Asaas/Kiwify) chamam as mesmas funções; nenhuma lógica é duplicada entre esses três pontos de entrada.
- **`emitEvent()`** (`src/lib/core/events.ts`) — todo evento de negócio (membro criado, acesso concedido, produto atualizado...) passa por um único ponto que grava em `activity_logs` (histórico interno) e dispara os webhooks de saída cadastrados, ao mesmo tempo. Um evento novo = um lugar para adicionar.
- **Actor tracking** (`src/lib/core/actor.ts`) — toda ação registra quem a fez: `admin` (usuário logado no painel), `api` (nome da API Key), ou `webhook` (provedor de pagamento). Aparece no histórico de auditoria e no payload dos webhooks.
- **`/api/v1/*`** é a API oficial (nomes de recurso em inglês). Os caminhos antigos `/api/admin/*` (em português) continuam funcionando como *thin re-exports* dos handlers v1 — mesma lógica, sem duplicação, mantidos só por compatibilidade.
- **Fonte única de documentação**: `public/openapi.json` (OpenAPI 3.1, mantido à mão). A partir dele são gerados/renderizados, sem cópia paralela: a página **API Reference**, o **Swagger UI**, e a **Coleção Postman** (`npm run generate:postman`).
- **Banco**: Supabase Postgres. A partir desta fase, o schema completo está representado em migrations versionadas (`supabase/migrations/00000000_initial_schema.sql` reconstrói as 32 tabelas + 1 view por introspecção do banco real, já que a maior parte foi criada originalmente fora do controle de versão).

## 2. Recursos disponíveis

| Recurso | O que é |
|---|---|
| **Membros** | Cadastro (nome, e-mail, telefone, papel admin/equipe/membro, ativo/inativo) |
| **Produtos** | Cursos/arquivos/packs — conteúdo entregue ao membro |
| **Acessos** (`access-grants`) | Vínculo membro↔produto, com validade opcional e status de pagamento |
| **Vendas** (`sales`) | Somente leitura — acessos concedidos por compra (`granted_by` = `purchase`/`pack`), populados pelos webhooks de entrada do Asaas/Kiwify |
| **Certificados** | Emissão (automática ao concluir curso, ou manual via API), idempotente por par membro/produto |
| **Convites** | Códigos de auto-cadastro que liberam produtos automaticamente |

## 3. Endpoints públicos

Base URL: `https://membros.thiagocantalovo.com/api/v1` · Toda rota exige `x-api-key`.

| Método | Rota | Escopo exigido |
|---|---|---|
| GET | `/members` | `members:read` |
| POST | `/members` | `members:write` |
| GET | `/members/{id}` | `members:read` |
| PATCH | `/members/{id}` | `members:write` |
| DELETE | `/members/{id}` | `members:delete` |
| POST | `/members/{id}/resend-access` | `members:write` |
| GET | `/access-grants` | `access:read` |
| POST | `/access-grants` | `access:write` |
| PATCH | `/access-grants` | `access:write` |
| DELETE | `/access-grants` | `access:write` |
| GET | `/products` | `products:read` |
| POST | `/products` | `products:write` |
| GET | `/products/{id}` | `products:read` |
| PATCH | `/products/{id}` | `products:write` |
| DELETE | `/products/{id}` | `products:delete` |
| GET | `/certificates` | `certificates:read` |
| POST | `/certificates` | `certificates:write` |
| GET | `/invites` | `invites:read` |
| POST | `/invites` | `invites:write` |
| GET | `/sales` | `sales:read` |

Detalhe de cada endpoint (body, response, exemplo curl) na **API Reference** (`/admin/integracoes/api-reference`) ou em `public/openapi.json`.

**Envelope de resposta**, sempre: `{"success":true,"data":{...}}` ou `{"success":false,"error":{"code":"...","message":"..."}}`.

**Idempotência**: header opcional `Idempotency-Key` em toda rota mutável — repetir a mesma chave para o mesmo (método + rota + chamador) faz replay da resposta já registrada em vez de repetir o efeito colateral. Escopo é `(key, actor_label, method, path)`; janela de 24h. Validado ponta a ponta nesta fase.

**Webhooks de entrada** (gateways de pagamento, autenticação própria por token/assinatura do provedor, não `x-api-key`): `POST /api/webhook/asaas`, `POST /api/webhook/kiwify`.

## 4. Eventos de webhook

22 eventos no catálogo (`src/lib/fire-webhooks.ts`), entregues via `POST` para cada URL cadastrada em Integrações → Webhooks, com filtro opcional por produto e/ou lista de eventos:

`member.created` `member.updated` `member.deleted` `member.activated` `member.deactivated` `access.granted` `access.updated` `access.revoked` `product.created` `product.updated` `product.deleted` `purchase.approved` `purchase.refunded` `payment.approved` `payment.failed` `payment.overdue` `payment.refunded` `certificate.generated` `lesson.completed` `invite.sent` `invite.accepted` `login.created` `password.reset`

> `payment.failed` está reservado no catálogo mas nenhum fluxo atual o dispara — não há hoje uma origem que distinga "falhou" de "nunca foi criado".

Cada entrega é registrada (status HTTP, corpo da resposta, sucesso/falha) e pode ser reenviada ou testada manualmente pelo painel (Webhooks → histórico de entregas).

## 5. Modelo de autenticação

- Header `x-api-key` em toda chamada.
- **Chave mestra** (`ADMIN_API_KEY`, variável de ambiente) — sempre irrestrita, nunca expira.
- **Chaves nomeadas** (Integrações → API) — cada uma com nome próprio (aparece como autor no histórico de auditoria), `created_by`, `last_used_at`, `last_ip`, e escopos configuráveis.
- Uma chave ausente, inválida, ou uma falha na consulta ao banco sempre resulta em `401` — nunca em acesso liberado por padrão inseguro.

## 6. Escopos disponíveis

Modelo simples baseado em permissão por recurso, `scopes: null` = acesso total (padrão da chave mestra e de qualquer chave criada antes desse recurso existir — compatível para trás), `scopes: string[]` = restrita à lista:

- `members:read` `members:write` `members:delete`
- `products:read` `products:write` `products:delete`
- `access:read` `access:write`
- `sales:read`
- `certificates:read` `certificates:write`
- `invites:read` `invites:write`
- `webhooks:read`
- `api_keys:manage`

Violação de escopo → `403 FORBIDDEN` com o nome do escopo faltante. Testado ponta a ponta: chave restrita bloqueada corretamente fora do seu escopo, chave irrestrita passa por tudo.

## 7. Fluxo recomendado de integração

Para a integração real que vem a seguir (Notion → n8n → Área de Membros):

1. Criar uma **API Key nomeada** em Integrações → API (ex. "n8n Produção"), com escopo restrito ao mínimo necessário (ex. `members:write` + `access:write`, sem `members:delete` nem `api_keys:manage`).
2. No n8n, usar **HTTP Request** com header `x-api-key`, e sempre enviar **`Idempotency-Key`** (ex. UUID gerado a cada execução do workflow) nas chamadas mutáveis — protege contra reexecução em caso de timeout/retry do próprio n8n.
3. Para reagir a eventos que já acontecem na plataforma (nova venda, certificado emitido, membro desativado), cadastrar a URL do workflow n8n em Integrações → Webhooks em vez de fazer polling.
4. Consultar **Recipes** (`/admin/integracoes/recipes`) para os fluxos de negócio já modelados (novo paciente, compra aprovada, cancelamento, renovação...), cada um com um workflow n8n de exemplo pronto para importar.

## 8. Limitações conhecidas

- **Sem HMAC nos webhooks de saída** — quem recebe não tem como verificar criptograficamente que o payload veio desta plataforma.
- **Sem rate limiting** — nenhuma API Key tem limite de requisições por minuto.
- **Sem retry/backoff automático em webhook de saída** — falha de entrega fica registrada e pode ser reenviada manualmente, mas não há fila nem repetição automática.
- **Sem monitoramento/observabilidade dedicados** — não há painel de tempo médio de resposta, taxa de erro 500, ou alerta de webhook falhando.
- **DELETE em `/access-grants` usa corpo JSON, não path params** — decisão consciente por ora; redesenho (`/access-grants/:id` ou `/members/:id/products/:id`) fica para quando houver necessidade real.
- **`POST /members` ainda retorna `207`** em caso de sucesso parcial (membro criado, mas liberação de produto falhou) — troca para `201 + warnings[]` fica para quando houver necessidade real.
- **Migration de schema inicial não cobre**: RLS/policies, índices além de chave primária, constraints CHECK/UNIQUE (exceto as já corrigidas nesta fase), e a provável FK `profiles.id → auth.users(id)` — nenhum desses é visível via introspecção do PostgREST (a única via de acesso ao schema neste ambiente, sem `psql`/`pg_dump` diretos).
- **`user_xp_totals`** é uma view reconstruída por inferência (soma de `xp_transactions` por usuário) — não confirmada contra a definição original, já que views não aparecem na introspecção.

## 9. Próximos passos (backlog técnico)

Sem prioridade — só entram em pauta se o uso real apontar necessidade:

- HMAC nos webhooks de saída.
- Rate limiting por API Key.
- Retry/backoff automático de webhook com fila.
- Monitoramento (tempo médio, erros 500, webhooks falhando, chamadas por chave).
- Redesenho REST de `DELETE /access-grants`.
- `POST /members`: `201 + warnings[]` no lugar de `207`.
- Diff da migration de schema inicial contra um `pg_dump` real, se/quando houver acesso direto ao Postgres — para fechar RLS, índices e constraints que a introspecção do PostgREST não expõe.
- SDKs oficiais (JS/Python) — hoje "em breve" na Documentação.

---

**A partir daqui, foco exclusivo na integração real**: Notion → n8n → Área de Membros → Paciente, seguido por Agenda, Pacientes, Serviços e Financeiro, nessa ordem.
