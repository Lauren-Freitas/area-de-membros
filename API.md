# API Reference — Área de Membros

Documentação dos endpoints REST disponíveis para integrações externas (n8n, Make, Zapier, sistemas de checkout, etc.).

**Base URL:** `https://membros.thiagocantalovo.com`

---

## Autenticação

A maioria dos endpoints administrativos requer autenticação via header:

```
x-api-key: sua-chave-de-api
```

As chaves são criadas no painel em **Integrações → API**.

---

## Endpoints Administrativos

### Usuários

#### Listar membros
```
GET /api/admin/usuarios
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com",
    "role": "membro",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

---

#### Buscar membro
```
GET /api/admin/usuarios/:id
```

**Response:**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@email.com",
  "role": "membro",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z"
}
```

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
  "products": ["product-uuid-1", "product-uuid-2"]
}
```

**Response:**
```json
{
  "ok": true,
  "user_id": "uuid"
}
```

> Se o e-mail já existir, apenas os produtos são adicionados. Um e-mail de convite/acesso é enviado automaticamente.

---

#### Excluir membro
```
DELETE /api/admin/usuarios/:id
```

**Response:**
```json
{ "ok": true }
```

---

### Produtos

#### Listar produtos
```
GET /api/admin/produtos
```

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Protocolo Emagrecimento",
    "is_active": true,
    "sort_order": 1,
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

---

#### Buscar produto
```
GET /api/admin/produtos/:id
```

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
  "is_active": true,
  "sort_order": 1
}
```

**Response:**
```json
{
  "ok": true,
  "product_id": "uuid"
}
```

---

#### Excluir produto
```
DELETE /api/admin/produtos/:id
```

---

### Acesso a Produtos

#### Conceder acesso
```
POST /api/admin/acesso
```

**Body:**
```json
{
  "user_id": "uuid",
  "product_id": "uuid"
}
```

**Response:**
```json
{ "ok": true }
```

> Após conceder acesso, os webhooks de saída configurados são disparados automaticamente.

---

#### Revogar acesso
```
DELETE /api/admin/acesso
```

**Body:**
```json
{
  "user_id": "uuid",
  "product_id": "uuid"
}
```

**Response:**
```json
{ "ok": true }
```

---

### Aparência

#### Salvar configurações visuais
```
POST /api/appearance
```

**Body:**
```json
{
  "platform_name": "Thiago Cantalovo",
  "primary_color": "#b48840",
  "brand_light": "#d2b17b",
  "bg_light": "#e4e4e4",
  "bg_dark": "#00060f",
  "card_bg_light": "#ffffff",
  "card_bg_dark": "#0d1020",
  "welcome_message": "Bem-vindo à área de membros!",
  "support_whatsapp": "5561991900589",
  "support_email": "nutri@thiagocantalovo.com"
}
```

**Response:**
```json
{ "ok": true }
```

---

#### Restaurar padrões
```
DELETE /api/appearance
```

**Response:**
```json
{
  "ok": true,
  "defaults": { ... }
}
```

---

## Webhooks de Entrada

### Asaas — Confirmação de Pagamento

```
POST /api/webhook/asaas
```

**Header obrigatório:**
```
asaas-access-token: seu-token-webhook
```

**Evento suportado:** `PAYMENT_CONFIRMED`

**Payload esperado (enviado pelo Asaas):**
```json
{
  "event": "PAYMENT_CONFIRMED",
  "payment": {
    "id": "pay_xxx",
    "customer": "cus_xxx",
    "value": 297.00,
    "externalReference": "product-uuid"
  }
}
```

**O que acontece:**
1. Valida o token do header
2. Busca dados do cliente no Asaas
3. Cria o usuário na plataforma (se ainda não existir)
4. Concede acesso ao produto identificado em `externalReference`
5. Envia e-mail de boas-vindas com link de acesso
6. Registra o evento em `webhook_logs`

---

## Webhooks de Saída

A plataforma dispara webhooks para URLs configuradas no painel em **Integrações → Webhooks**.

### Eventos

#### `sale.created`
Disparado quando um usuário recebe acesso a um produto (manual, via API ou via pagamento).

#### `member.created`
Disparado quando um novo usuário é criado na plataforma.

### Payload

```json
{
  "event": "sale.created",
  "timestamp": "2026-07-04T12:00:00.000Z",
  "user_id": "uuid",
  "product_id": "uuid",
  "user_name": "João Silva",
  "user_email": "joao@email.com"
}
```

O webhook é enviado via `POST` com `Content-Type: application/json`. A plataforma registra o status HTTP da resposta para monitoramento no painel.

---

## Assistente de IA

### Chat (streaming)

```
POST /api/assistente
```

Requer sessão autenticada (cookie de sessão do Supabase).

**Body:**
```json
{
  "conversation_id": "uuid",
  "message": "Qual a quantidade ideal de proteína por kg de peso corporal?",
  "attachments": []
}
```

**Response:** Stream de texto (`text/event-stream`)

O assistente **Proteíno** utiliza o modelo Claude Haiku com contexto personalizado baseado no perfil do usuário, produtos adquiridos e tom de voz configurado.

---

## Erros

Todos os endpoints retornam erros no formato:

```json
{
  "ok": false,
  "error": "Mensagem descrevendo o erro"
}
```

| Status | Significado |
|---|---|
| `400` | Dados inválidos na requisição |
| `401` | API Key ausente ou inválida |
| `403` | Sem permissão para a operação |
| `404` | Recurso não encontrado |
| `500` | Erro interno do servidor |

---

## Exemplo de Integração com n8n

Para automatizar a liberação de acesso após uma venda em plataforma externa:

1. **Trigger:** HTTP Webhook (recebe dados do checkout)
2. **Ação 1:** HTTP Request → `POST /api/admin/acesso`
   - Header: `x-api-key: sua-chave`
   - Body: `{ "user_id": "...", "product_id": "..." }`
3. **Ação 2 (opcional):** Enviar confirmação por WhatsApp, atualizar CRM, etc.

A plataforma também dispara webhooks de saída automaticamente, que podem ser usados como trigger no n8n diretamente.
