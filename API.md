# API Reference — Área de Membros

Documentação dos endpoints REST disponíveis para integrações externas (n8n, Make, Zapier, Flowise, Langflow, sistemas de checkout, etc.).

**Base URL:** `https://membros.thiagocantalovo.com`

Especificação machine-readable equivalente: [`openapi.yaml`](./openapi.yaml).

---

## Autenticação

Todos os endpoints em `/api/admin/*` requerem o header:

```
x-api-key: sua-chave-de-api
```

A chave pode ser a chave mestra (variável de ambiente `ADMIN_API_KEY`) ou qualquer chave nomeada criada no painel em **Integrações → API**. Uma chave ausente, inválida ou uma falha na consulta ao banco sempre resulta em `401` — nunca em acesso liberado.

Os endpoints de webhook de entrada (`/api/webhook/*`) usam autenticação própria (token/assinatura do provedor de pagamento), não a `x-api-key`. Veja a seção específica.

---

## Endpoints Administrativos

### Membros

#### Listar membros
```
GET /api/admin/usuarios
```

**Response `200`:**
```json
{ "users": [ { "id": "uuid", "name": "João Silva", "email": "joao@email.com", "role": "membro", "is_active": true, "created_at": "2026-01-01T00:00:00Z" } ] }
```

---

#### Buscar membro
```
GET /api/admin/usuarios/:id
```

**Response `200`:** `{ "user": { ...perfil completo } }`
**Response `404`:** `{ "error": "Usuário não encontrado" }`

---

#### Criar membro
```
POST /api/admin/usuarios
```

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "5561999999999",
  "products": ["product-uuid-1", "product-uuid-2"]
}
```
> `phone` e `products` são opcionais. Se o e-mail já existir, o membro não é duplicado — apenas os produtos listados são adicionados ao acesso dele.

**Response `201` (membro novo) ou `200` (e-mail já existia):**
```json
{ "userId": "uuid", "isNewUser": true }
```

> Se for um membro novo, um e-mail de convite/acesso é enviado automaticamente.

---

#### Editar membro
```
PATCH /api/admin/usuarios/:id
```

**Body** (todos os campos opcionais, envie só o que quer alterar):
```json
{ "name": "João Silva", "role": "membro", "is_active": true, "phone": "5561999999999" }
```
> `role` aceita `admin`, `equipe` ou `membro`.

**Response `200`:** `{ "user": { ...perfil atualizado } }`
**Response `400`:** `{ "error": "Nenhum campo para atualizar" }`

> Dispara `member.enabled`/`member.disabled` quando `is_active` muda, ou `member.updated` nos demais casos.

---

#### Excluir membro
```
DELETE /api/admin/usuarios/:id
```

**Response `200`:** `{ "deleted": true }`

> Dispara `member.deleted`.

---

#### Reenviar convite de acesso
```
POST /api/admin/usuarios/:id/reenviar-convite
```

Reenvia o e-mail de definição de senha/acesso para um membro já existente (útil quando o primeiro e-mail não chegou).

**Response `200`:** `{ "sent": true }`

> Dispara `invite.sent`.

---

#### Redefinir senha
```
POST /api/admin/usuarios/:id/resetar-senha
```

Diferente de "reenviar convite" (link de primeiro acesso): aqui é um pedido de redefinição de senha para uma conta que já existe e já tem senha definida, usando o mesmo mecanismo (e e-mail padrão do Supabase) do fluxo de autoatendimento em `/esqueceu-senha`.

**Response `200`:** `{ "sent": true }`
**Response `404`:** `{ "error": "Usuário não encontrado" }`

> Dispara `password.reset`.

---

### Produtos

#### Listar produtos
```
GET /api/admin/produtos
```

**Response `200`:** `{ "products": [ { ...produto completo } ] }`

---

#### Buscar produto
```
GET /api/admin/produtos/:id
```

**Response `200`:** `{ "product": { ...produto completo } }`
**Response `404`:** `{ "error": "Produto não encontrado" }`

---

#### Criar produto
```
POST /api/admin/produtos
```

**Body:**
```json
{
  "title": "Protocolo Emagrecimento",
  "description": "Descrição do produto",
  "content_type": "video",
  "content_url": null,
  "banner_url": null,
  "is_pack": false,
  "sort_order": 1,
  "is_active": true
}
```
> `title` e `content_type` são obrigatórios.

**Response `201`:** `{ "product": { ...produto criado } }`

> Dispara `product.created`.

---

#### Editar produto
```
PATCH /api/admin/produtos/:id
```

**Body** (todos os campos opcionais, envie só o que quer alterar):
```json
{ "title": "Novo título", "is_active": false, "sort_order": 2 }
```

**Response `200`:** `{ "product": { ...produto atualizado } }`
**Response `400`:** `{ "error": "Nenhum campo para atualizar" }`
**Response `404`:** `{ "error": "Produto não encontrado" }`

> Dispara `product.updated`.

---

#### Excluir produto
```
DELETE /api/admin/produtos/:id
```

**Response `200`:** `{ "deleted": true }`

---

### Acesso a Produtos

#### Consultar acessos
```
GET /api/admin/acesso?user_id=uuid&product_id=uuid
```
Ambos os parâmetros são opcionais e combináveis (sem nenhum, retorna todos os acessos).

**Response `200`:**
```json
{ "access": [ { "id": "uuid", "user_id": "uuid", "product_id": "uuid", "granted_at": "...", "granted_by": "api", "expires_at": null, "payment_status": "confirmed", "value": 297.0, "billing_type": "kiwify" } ] }
```

---

#### Conceder acesso
```
POST /api/admin/acesso
```

**Body:**
```json
{ "user_id": "uuid", "product_id": "uuid" }
```

**Response `200`:** `{ "granted": true }`

> Dispara `access.granted`.

---

#### Atualizar validade do acesso
```
PATCH /api/admin/acesso
```

**Body:**
```json
{ "user_id": "uuid", "product_id": "uuid", "expires_at": "2026-12-31T23:59:59Z" }
```
> Envie `"expires_at": null` para tornar o acesso permanente.

**Response `200`:** `{ "access": { ...linha atualizada } }`
**Response `404`:** `{ "error": "Acesso não encontrado" }`

---

#### Revogar acesso
```
DELETE /api/admin/acesso
```

**Body:**
```json
{ "user_id": "uuid", "product_id": "uuid" }
```

**Response `200`:** `{ "revoked": true }`

> Dispara `access.revoked`.

---

### Convites

Convites são códigos de auto-cadastro (`/convite/:code`) que liberam um ou mais produtos a quem se cadastra com o código — diferente do "reenviar convite" de um membro já existente (veja acima).

#### Listar convites
```
GET /api/admin/convites
```

**Response `200`:** `{ "invites": [ { ...convite completo } ] }`

---

#### Criar convite
```
POST /api/admin/convites
```

**Body:**
```json
{
  "note": "Turma de fevereiro",
  "product_ids": ["product-uuid-1"],
  "max_uses": 50,
  "expires_at": "2026-03-01T00:00:00Z"
}
```
> Todos os campos são opcionais. `max_uses` e `expires_at` nulos significam sem limite. O código é gerado automaticamente pela plataforma.

**Response `201`:** `{ "invite": { "id": "uuid", "code": "AB12CD34", ... } }`

> Dispara `invite.sent`.

---

### Certificados

#### Listar certificados emitidos
```
GET /api/admin/certificados
```

**Response `200`:** `{ "certificates": [ { "id": "uuid", "user_id": "uuid", "product_id": "uuid", "issued_at": "..." } ] }`

---

#### Emitir certificado manualmente
```
POST /api/admin/certificados
```

**Body:**
```json
{ "user_id": "uuid", "product_id": "uuid" }
```
> Emite mesmo que o membro não tenha concluído todas as aulas (uso administrativo). Se já existir um certificado para esse par membro/produto, retorna o existente sem duplicar.

**Response `201` (novo) ou `200` (já existia):** `{ "certificate": { ... } }`

> Dispara `certificate.generated` (apenas quando um certificado novo é emitido).

---

### Vendas

#### Consultar vendas
```
GET /api/admin/vendas?user_id=uuid&product_id=uuid&payment_status=confirmed
```
Todos os parâmetros são opcionais e combináveis. Considera apenas acessos concedidos por compra (`granted_by` = `purchase` ou `pack`) — não inclui acessos manuais.

**Response `200`:**
```json
{ "sales": [ { "id": "uuid", "user_id": "uuid", "product_id": "uuid", "granted_at": "...", "granted_by": "purchase", "value": 297.0, "billing_type": "asaas", "payment_status": "confirmed", "invoice_url": "https://...", "asaas_payment_id": "pay_xxx" } ] }
```

---

### Aparência

#### Salvar configurações visuais
```
POST /api/appearance
```
> Requer sessão de navegador autenticada como admin/equipe (cookie do Supabase) — **não** aceita `x-api-key`.

**Body:** pares chave/valor livres, ex:
```json
{
  "platform_name": "Thiago Cantalovo",
  "primary_color": "#b48840",
  "welcome_message": "Bem-vindo à área de membros!",
  "support_whatsapp": "5561991900589",
  "support_email": "nutri@thiagocantalovo.com"
}
```

**Response `200`:** `{ "ok": true }`
**Response `401`:** `{ "ok": false, "error": "Não autorizado." }`

---

#### Restaurar padrões
```
DELETE /api/appearance
```
> Mesma exigência de sessão admin/equipe do endpoint acima.

**Response `200`:** `{ "ok": true, "defaults": { ... } }`

---

## Webhooks de Entrada

Recebem notificações de gateways de pagamento externos e concedem/revogam acesso automaticamente. Cada evento recebido é registrado em `webhook_logs` com o status `processed`, `ignored` ou `failed`.

### Asaas
```
POST /api/webhook/asaas
```

**Header obrigatório:** `asaas-access-token: seu-token-webhook`

**Eventos tratados:**
| Evento Asaas | Efeito |
|---|---|
| `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` | Concede acesso (`purchase.approved` + `payment.approved`) |
| `PAYMENT_OVERDUE` | Marca pagamento em atraso (`payment.overdue`) |
| `PAYMENT_REFUNDED`, `PAYMENT_DELETED`, `PAYMENT_CHARGEBACK_REQUESTED` | Revoga acesso (`purchase.refunded` + `payment.refunded`) |

O produto concedido é identificado pelo campo `externalReference` do pagamento, que deve conter o UUID do produto na plataforma. Se o cliente não existir ainda, ele é criado e recebe um e-mail de boas-vindas com link de acesso; se já existir, recebe um e-mail de "acesso liberado".

---

### Kiwify
```
POST /api/webhook/kiwify?signature=seu-token-webhook
```

O token vem por query string (`signature`), não por header — é assim que a Kiwify envia.

**Eventos tratados:**
| Evento Kiwify | Efeito |
|---|---|
| `order_approved`, `compra_aprovada`, `subscription_renewed` | Concede acesso (`purchase.approved` + `payment.approved`) |
| `subscription_late` | Marca pagamento em atraso (`payment.overdue`) |
| `order_refunded`, `compra_reembolsada`, `refunded`, `order_rejected`, `compra_recusada`, `chargeback`, `chargedback`, `subscription_canceled`, `subscription_cancelled` | Revoga acesso (`purchase.refunded` + `payment.refunded`) |

O produto é identificado pela coluna `kiwify_product_id`, configurada em cada produto no painel. Assim como no Asaas, cria o membro se necessário e envia o e-mail correspondente.

---

## Webhooks de Saída

A plataforma envia um `POST` (`Content-Type: application/json`) para cada URL ativa cadastrada em **Integrações → Webhooks**, sempre que um dos eventos abaixo acontece. Cada envio é registrado (com status HTTP, corpo da resposta e sucesso/falha) e pode ser reenviado ou testado direto pelo painel.

Um webhook pode ser restrito a um produto específico (recebe só eventos daquele produto) e a uma lista de eventos (recebe só os eventos marcados) — por padrão, sem nenhum filtro, recebe tudo.

### Catálogo de eventos

| Evento | Quando dispara |
|---|---|
| `member.created` | Novo membro criado (cadastro manual, API, convite ou primeira compra) |
| `member.updated` | Dados do membro alterados (exceto ativar/desativar) |
| `member.deleted` | Membro excluído |
| `member.enabled` | Membro reativado |
| `member.disabled` | Membro desativado |
| `access.granted` | Acesso a um produto concedido |
| `access.revoked` | Acesso a um produto revogado |
| `product.created` | Produto criado (painel ou API) |
| `product.updated` | Produto editado (painel ou API) |
| `purchase.approved` | Compra aprovada por um gateway de pagamento |
| `purchase.refunded` | Compra estornada/cancelada |
| `payment.approved` | Pagamento confirmado |
| `payment.overdue` | Pagamento em atraso |
| `payment.refunded` | Pagamento estornado |
| `certificate.generated` | Certificado emitido (automático ao concluir o curso, ou manual via API) |
| `lesson.completed` | Aula marcada como concluída por um membro |
| `invite.sent` | Convite criado ou reenviado |
| `invite.accepted` | Convite resgatado no cadastro |
| `login.created` | Login registrado (no máximo 1 disparo a cada 5 min por membro) |
| `password.reset` | Redefinição de senha solicitada via API |

> `purchase.refused` e `payment.failed` estão reservados no catálogo mas nenhum fluxo atual os dispara — não há hoje uma origem de evento que distinga "recusado" de simplesmente não ter sido criado. `access.expired` não existe ainda (dependeria de uma rotina agendada, que a plataforma não tem).

### Payload

```json
{
  "event": "purchase.approved",
  "timestamp": "2026-07-04T12:00:00.000Z",
  "user_id": "uuid",
  "product_id": "uuid",
  "user_name": "João Silva",
  "user_email": "joao@email.com"
}
```
Campos além de `event`/`timestamp` variam conforme o evento (veja a tabela acima para o contexto de cada um).

---

## Assistente de IA

### Chat (streaming)
```
POST /api/assistente
```
> Requer sessão de navegador autenticada (cookie do Supabase) — endpoint interno da interface, não pensado para chamadas via `x-api-key`.

**Body:**
```json
{ "conversationId": "uuid", "message": "Qual a quantidade ideal de proteína por kg de peso corporal?", "history": [], "attachments": [], "persona": "membro" }
```

**Response:** stream de texto puro (`Content-Type: text/plain`).

O assistente usa o modelo Claude Haiku, com um system prompt diferente para membro (**Proteíno**, foco em nutrição) e para admin/equipe (**IAN**, foco em gestão da plataforma).

---

## Erros

A convenção de erro **não é uniforme entre grupos de endpoints** — vale a pena checar o formato antes de programar contra ele:

- **`/api/admin/*`** (todos os endpoints desta doc protegidos por `x-api-key`): `{ "error": "mensagem" }`, sem campo `ok`.
- **`/api/appearance`**: `{ "ok": false, "error": "mensagem" }`.
- **`/api/webhook/*`**: sempre respondem `200 { "received": true }` mesmo em falha de processamento (o provedor de pagamento não deve re-tentar em loop) — o erro real fica registrado em `webhook_logs`, não na resposta HTTP. Só um token inválido retorna `401`.

| Status | Significado |
|---|---|
| `400` | Dados inválidos ou faltando na requisição |
| `401` | `x-api-key` ausente/inválida, ou token do provedor de pagamento inválido |
| `404` | Recurso não encontrado |
| `500` | Erro interno do servidor |

---

## Exemplo de Integração com n8n

Para automatizar a liberação de acesso após uma venda em uma plataforma externa sem webhook nativo integrado:

1. **Trigger:** HTTP Webhook (recebe dados do checkout)
2. **Ação 1:** HTTP Request → `POST /api/admin/acesso`
   - Header: `x-api-key: sua-chave`
   - Body: `{ "user_id": "...", "product_id": "..." }`
3. **Ação 2 (opcional):** Enviar confirmação por WhatsApp, atualizar CRM, etc.

Para reagir a eventos que já acontecem na plataforma (nova venda, certificado emitido, membro desativado etc.), cadastre a URL do seu workflow n8n em **Integrações → Webhooks** e use-a como trigger diretamente — sem precisar consultar a API por polling.
