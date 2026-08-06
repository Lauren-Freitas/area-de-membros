import Link from 'next/link'
import fs from 'node:fs'
import path from 'node:path'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://membros.thiagocantalovo.com'

const methodColor: Record<string, string> = {
  GET: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  POST: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  PATCH: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  DELETE: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
}

interface JsonSchema {
  type?: string | string[]
  properties?: Record<string, JsonSchema>
  required?: string[]
  enum?: string[]
  items?: JsonSchema
}

interface OpenApiOperation {
  summary?: string
  description?: string
  tags?: string[]
  'x-required-scope'?: string
  requestBody?: { content?: { 'application/json'?: { schema?: JsonSchema; example?: unknown } } }
  responses?: Record<string, { description?: string }>
}

interface OpenApiDoc {
  paths: Record<string, Record<string, OpenApiOperation>>
}

/** Fonte oficial da documentação — a página só renderiza o que está no spec, nunca mantém uma cópia paralela. */
function loadSpec(): OpenApiDoc {
  const file = fs.readFileSync(path.join(process.cwd(), 'public', 'openapi.json'), 'utf-8')
  return JSON.parse(file)
}

function schemaFieldToType(schema: JsonSchema): string {
  if (schema.enum) return schema.enum.map(v => `"${v}"`).join('|')
  if (schema.items) return `[${schemaFieldToType(schema.items)}]`
  const type = Array.isArray(schema.type) ? schema.type.join('|') : schema.type
  return type ?? 'any'
}

function bodyPreview(op: OpenApiOperation): string | undefined {
  const schema = op.requestBody?.content?.['application/json']?.schema
  if (!schema?.properties) return undefined
  const required = new Set(schema.required ?? [])
  const fields = Object.entries(schema.properties).map(([key, val]) =>
    `${key}${required.has(key) ? '' : '?'}: ${schemaFieldToType(val)}`,
  )
  return `{ ${fields.join(', ')} }`
}

function exampleBodyJson(op: OpenApiOperation): string | undefined {
  const content = op.requestBody?.content?.['application/json']
  if (content?.example) return JSON.stringify(content.example)
  const schema = content?.schema
  if (!schema?.properties) return undefined
  const required = new Set(schema.required ?? [])
  const example: Record<string, unknown> = {}
  for (const key of Object.keys(schema.properties)) {
    if (!required.has(key)) continue
    example[key] = key.includes('id') ? `uuid-do-${key.replace('_id', '').replace('id', 'membro')}` : `valor`
  }
  return JSON.stringify(example)
}

function responseSummary(op: OpenApiOperation): string {
  const entries = Object.entries(op.responses ?? {}).filter(([code]) => code.startsWith('2'))
  return entries.map(([code, r]) => `${code}: ${r.description ?? ''}`).join(' · ')
}

function notesSummary(op: OpenApiOperation): string | undefined {
  return op.description
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <div id={id} className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6 space-y-4 scroll-mt-6">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return <pre className="bg-gray-900 text-gray-100 rounded-xl p-3.5 text-[11px] overflow-x-auto leading-relaxed">{children}</pre>
}

function EndpointBlock({ method, fullPath, op }: { method: string; fullPath: string; op: OpenApiOperation }) {
  const body = bodyPreview(op)
  const exampleBody = exampleBodyJson(op)
  const curl = `curl -X ${method} ${baseUrl}${fullPath} \\
  -H "x-api-key: sua-chave"${exampleBody ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${exampleBody}'` : ''}`

  return (
    <div className="border-t border-gray-100 dark:border-[#1e2030] pt-4 first:border-t-0 first:pt-0 space-y-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono shrink-0 ${methodColor[method]}`}>{method}</span>
        <code className="text-gray-800 dark:text-gray-200 font-mono text-sm">{fullPath}</code>
        {op['x-required-scope'] && (
          <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#1a2035] text-gray-500 dark:text-gray-400" title="Escopo exigido">
            {op['x-required-scope']}
          </code>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{op.summary}</p>

      {body && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Body</p>
          <code className="block text-[11px] font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#12162a] rounded px-2.5 py-1.5 overflow-x-auto">{body}</code>
        </div>
      )}

      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Response</p>
        <p className="text-[11px] font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#12162a] rounded px-2.5 py-1.5 overflow-x-auto">{responseSummary(op)}</p>
      </div>

      {notesSummary(op) && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Observações</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{notesSummary(op)}</p>
        </div>
      )}

      <details className="group">
        <summary className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide cursor-pointer select-none list-none flex items-center gap-1">
          <svg className="w-3 h-3 transition group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          Exemplo
        </summary>
        <div className="mt-1.5">
          <CodeBlock>{curl}</CodeBlock>
        </div>
      </details>
    </div>
  )
}

export default function ApiReferencePage() {
  const spec = loadSpec()

  const byTag = new Map<string, { fullPath: string; method: string; op: OpenApiOperation }[]>()
  for (const [rawPath, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      const tag = op.tags?.[0] ?? 'Outros'
      const list = byTag.get(tag) ?? []
      list.push({ fullPath: `/api/v1${rawPath}`, method: method.toUpperCase(), op })
      byTag.set(tag, list)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/integracoes" className="text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">API Reference</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Gerada a partir do{' '}
            <a href="/openapi.json" target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: 'var(--brand)' }}>OpenAPI spec</a>
            {' '}— a fonte oficial. Veja também em{' '}
            <Link href="/admin/integracoes/api-reference/swagger" className="underline font-medium" style={{ color: 'var(--brand)' }}>Swagger UI</Link>.
          </p>
        </div>
      </div>

      <Section title="Autenticação" id="autenticacao">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Todo endpoint abaixo exige o header <code className="bg-gray-100 dark:bg-[#1a2035] px-1.5 py-0.5 rounded text-xs">x-api-key</code>. Gerencie chaves em{' '}
          <Link href="/admin/integracoes/api" className="underline font-medium" style={{ color: 'var(--brand)' }}>Integrações → API</Link> — nomear a chave (ex. &quot;n8n&quot;) faz esse nome aparecer como autor de cada ação no histórico de auditoria. Chamadas mutáveis também aceitam <code className="bg-gray-100 dark:bg-[#1a2035] px-1.5 py-0.5 rounded text-xs">Idempotency-Key</code> — repetir a mesma chave replay a resposta já registrada em vez de repetir o efeito colateral. Cada chave pode ser criada com acesso total ou restrita a escopos específicos (ex. <code className="bg-gray-100 dark:bg-[#1a2035] px-1.5 py-0.5 rounded text-xs">members:read</code>) — o escopo exigido por cada endpoint aparece ao lado da rota abaixo; uma chave sem o escopo necessário recebe <code className="bg-gray-100 dark:bg-[#1a2035] px-1.5 py-0.5 rounded text-xs">403 FORBIDDEN</code>.
        </p>
        <CodeBlock>{`x-api-key: sua-chave\nContent-Type: application/json\nIdempotency-Key: chave-unica-opcional`}</CodeBlock>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Base URL: <code className="bg-gray-100 dark:bg-[#1a2035] px-1.5 py-0.5 rounded text-xs">{baseUrl}/api/v1</code> · Toda resposta usa o mesmo envelope: <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">{'{"success":true,"data":{...}}'}</code> ou <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">{'{"success":false,"error":{"code","message"}}'}</code>.
        </p>
        <p className="text-xs text-gray-400">
          Caminhos antigos (<code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">/api/admin/*</code>) continuam funcionando como compatibilidade temporária, mas <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">/api/v1/*</code> é a API oficial.
        </p>
      </Section>

      <Section title="Exemplos em outras linguagens">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Todo endpoint abaixo é HTTP puro — os exemplos de cada bloco usam cURL por ser universal, mas qualquer linguagem funciona da mesma forma. Mais exemplos (n8n, Make, Zapier) em{' '}
          <Link href="/admin/integracoes/recipes" className="underline font-medium" style={{ color: 'var(--brand)' }}>Recipes</Link>.
        </p>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">JavaScript</p>
          <CodeBlock>{`await fetch("${baseUrl}/api/v1/access-grants", {
  method: "POST",
  headers: { "x-api-key": "sua-chave", "Content-Type": "application/json" },
  body: JSON.stringify({ user_id: "uuid-do-membro", product_id: "uuid-do-produto" }),
})`}</CodeBlock>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">PHP</p>
          <CodeBlock>{`$ch = curl_init("${baseUrl}/api/v1/access-grants");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ["x-api-key: sua-chave", "Content-Type: application/json"],
  CURLOPT_POSTFIELDS => json_encode(["user_id" => "uuid-do-membro", "product_id" => "uuid-do-produto"]),
]);
$response = curl_exec($ch);`}</CodeBlock>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Python</p>
          <CodeBlock>{`import requests

requests.post(
    "${baseUrl}/api/v1/access-grants",
    headers={"x-api-key": "sua-chave"},
    json={"user_id": "uuid-do-membro", "product_id": "uuid-do-produto"},
)`}</CodeBlock>
        </div>
      </Section>

      {Array.from(byTag.entries()).map(([tag, endpoints]) => (
        <Section key={tag} title={tag}>
          <div className="space-y-4">
            {endpoints.map(({ fullPath, method, op }) => <EndpointBlock key={method + fullPath} method={method} fullPath={fullPath} op={op} />)}
          </div>
        </Section>
      ))}

      <p className="text-sm text-gray-500">
        Prefere ver isso em fluxos prontos, com contexto de negócio? Veja{' '}
        <Link href="/admin/integracoes/recipes" className="underline font-medium" style={{ color: 'var(--brand)' }}>Recipes</Link>. Catálogo completo de eventos de webhook em{' '}
        <Link href="/admin/integracoes/webhooks" className="underline font-medium" style={{ color: 'var(--brand)' }}>Webhooks</Link>.
      </p>
    </div>
  )
}
