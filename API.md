# API — Área de Membros

A API pública (`/api/v1/*`) segue o princípio **API First**: qualquer ferramenta capaz de fazer requisições HTTP — n8n, Make, Zapier, um script Python, uma aplicação Node — pode criar membros, conceder acessos, gerenciar produtos e reagir a eventos via Webhooks.

**Este arquivo não duplica a referência de endpoints** — isso vive num único lugar, gerado a partir do spec, pra nunca dessincronizar:

- **[`public/openapi.json`](./public/openapi.json)** — fonte de verdade (OpenAPI 3.1). Servido publicamente em `/openapi.json`.
- **API Reference** (painel, `/admin/integracoes/api-reference`) — cada endpoint em formato Stripe (descrição, body, response, exemplo curl), renderizado a partir do spec acima.
- **Swagger UI** (`/admin/integracoes/api-reference/swagger`) — mesmo spec, interface interativa.
- **[`public/postman-collection.json`](./public/postman-collection.json)** — coleção Postman gerada do spec (`npm run generate:postman`).
- **Recipes** (painel, `/admin/integracoes/recipes`) — fluxos de negócio prontos (Notion→n8n, venda aprovada, etc.), cada um com um exemplo de workflow n8n pra baixar.

## Essencial

**Base URL:** `https://membros.thiagocantalovo.com/api/v1`

**Autenticação:** header `x-api-key` em toda chamada. Gerar/gerenciar chaves em Integrações → API (painel).

**Envelope de resposta**, sempre:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "MEMBER_NOT_FOUND", "message": "Membro não encontrado." } }
```

**Idempotência:** header opcional `Idempotency-Key` em qualquer chamada mutável (POST/PATCH/DELETE) — repetir a mesma chave para o mesmo endpoint (método + rota) faz replay da resposta já registrada em vez de repetir o efeito colateral. Chaves são lembradas por 24h.

**Escopos:** cada API Key pode ter acesso total ou ser restrita a permissões específicas (`members:read`, `products:write`, `access:write`, etc.) — ver o escopo exigido junto de cada endpoint na API Reference. Chave sem o escopo necessário recebe `403 FORBIDDEN`.

Caminhos antigos em `/api/admin/*` continuam funcionando (compatibilidade), mas `/api/v1/*` é a API oficial.
