import Link from 'next/link'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://membros.thiagocantalovo.com'

const methodColor: Record<string, string> = {
  GET: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
  POST: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  PATCH: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  DELETE: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
}

interface Endpoint {
  method: keyof typeof methodColor
  path: string
  desc: string
  body?: string
  response: string
  notes?: string
}

interface Domain {
  title: string
  desc: string
  endpoints: Endpoint[]
}

const DOMAINS: Domain[] = [
  {
    title: 'Membros',
    desc: 'Criar, consultar, atualizar e excluir membros e colaboradores.',
    endpoints: [
      {
        method: 'GET', path: '/api/admin/usuarios',
        desc: 'Lista todos os membros e colaboradores.',
        response: '{ "users": [ { "id", "name", "email", "role", "is_active", "phone", "created_at", "last_login_at", ... } ] }',
      },
      {
        method: 'POST', path: '/api/admin/usuarios',
        desc: 'Cria um membro. Se o e-mail já existir, reaproveita o cadastro em vez de duplicar — idempotente por e-mail.',
        body: '{ "name": string, "email": string, "phone"?: string, "products"?: [productId], "access_expires_at"?: ISO date | null }',
        response: '{ "userId": uuid, "isNewUser": boolean }',
        notes: 'Se productIds forem enviados e a liberação falhar depois do membro já criado, a resposta vem com status 207 e um campo "error" — o userId ainda é retornado, o cadastro não é desfeito.',
      },
      {
        method: 'GET', path: '/api/admin/usuarios/:id',
        desc: 'Detalhe de um membro.',
        response: '{ "user": { "id", "name", "email", "role", "is_active", ... } }',
      },
      {
        method: 'PATCH', path: '/api/admin/usuarios/:id',
        desc: 'Atualiza dados — parcial, envie só os campos que quer mudar.',
        body: '{ "name"?: string, "role"?: "admin"|"equipe"|"membro", "is_active"?: boolean, "phone"?: string }',
        response: '{ "user": { ...atualizado } }',
      },
      {
        method: 'DELETE', path: '/api/admin/usuarios/:id',
        desc: 'Exclui o membro permanentemente, junto com o histórico de acesso.',
        response: '{ "deleted": true }',
        notes: 'Irreversível — não há soft delete.',
      },
    ],
  },
  {
    title: 'Acessos',
    desc: 'Conceder, consultar, ajustar validade e revogar acesso a produtos.',
    endpoints: [
      {
        method: 'POST', path: '/api/admin/acesso',
        desc: 'Concede acesso a um produto, com validade opcional.',
        body: '{ "user_id": uuid, "product_id": uuid, "expires_at"?: ISO date | null }',
        response: '{ "granted": true }',
        notes: 'expires_at ausente ou null = acesso permanente.',
      },
      {
        method: 'GET', path: '/api/admin/acesso',
        desc: 'Lista acessos concedidos.',
        body: 'Query params: ?user_id= e/ou ?product_id= (ambos opcionais)',
        response: '{ "access": [ { "user_id", "product_id", "granted_at", "granted_by", "expires_at", "payment_status" } ] }',
      },
      {
        method: 'PATCH', path: '/api/admin/acesso',
        desc: 'Altera a validade de um acesso já existente.',
        body: '{ "user_id": uuid, "product_id": uuid, "expires_at": ISO date | null }',
        response: '{ "success": true }',
      },
      {
        method: 'DELETE', path: '/api/admin/acesso',
        desc: 'Revoga o acesso a um produto.',
        body: '{ "user_id": uuid, "product_id": uuid }',
        response: '{ "revoked": true }',
      },
    ],
  },
  {
    title: 'Produtos',
    desc: 'Catálogo de produtos vendidos na plataforma.',
    endpoints: [
      { method: 'GET', path: '/api/admin/produtos', desc: 'Lista todos os produtos, na ordem de exibição.', response: '{ "products": [ { "id", "title", "content_type", "is_active", "sort_order", ... } ] }' },
      {
        method: 'POST', path: '/api/admin/produtos',
        desc: 'Cria um produto.',
        body: '{ "title": string, "content_type": "file"|"video", "description"?, "content_url"?, "banner_url"?, "is_pack"?, "is_active"? }',
        response: '{ "product": { ...criado } }',
      },
      { method: 'GET', path: '/api/admin/produtos/:id', desc: 'Detalhe de um produto.', response: '{ "product": { ... } }' },
      { method: 'PATCH', path: '/api/admin/produtos/:id', desc: 'Atualiza um produto — parcial.', response: '{ "product": { ...atualizado } }' },
      {
        method: 'DELETE', path: '/api/admin/produtos/:id',
        desc: 'Exclui o produto e todo o conteúdo (módulos, aulas).',
        response: '{ "deleted": true }',
        notes: 'Irreversível.',
      },
    ],
  },
  {
    title: 'Compras & Pagamentos',
    desc: 'Somente leitura — o registro de vendas é populado pelos webhooks de entrada do Asaas/Kiwify ou por concessões manuais.',
    endpoints: [
      {
        method: 'GET', path: '/api/admin/vendas',
        desc: 'Lista vendas (acessos com origem "purchase" ou "pack").',
        body: 'Query params: ?user_id=, ?product_id=, ?payment_status= (todos opcionais)',
        response: '{ "sales": [ { "user_id", "product_id", "value", "billing_type", "payment_status", "invoice_url", "granted_at" } ] }',
      },
    ],
  },
  {
    title: 'Certificados',
    desc: 'Emissão de certificados de conclusão.',
    endpoints: [
      { method: 'GET', path: '/api/admin/certificados', desc: 'Lista certificados emitidos.', response: '{ "certificates": [ { "id", "user_id", "product_id", "issued_at" } ] }' },
      {
        method: 'POST', path: '/api/admin/certificados',
        desc: 'Emite um certificado.',
        body: '{ "user_id": uuid, "product_id": uuid }',
        response: '{ "certificate": { "id", "user_id", "product_id", "issued_at" } }',
        notes: 'Idempotente — chamar de novo com o mesmo par user_id/product_id retorna o certificado já existente em vez de duplicar.',
      },
    ],
  },
  {
    title: 'Convites',
    desc: 'Links de convite reutilizáveis, com produtos e limite de usos pré-definidos.',
    endpoints: [
      { method: 'GET', path: '/api/admin/convites', desc: 'Lista links de convite.', response: '{ "invites": [ { "id", "code", "note", "product_ids", "max_uses", "used_count", "expires_at" } ] }' },
      {
        method: 'POST', path: '/api/admin/convites',
        desc: 'Cria um link de convite.',
        body: '{ "note"?: string, "product_ids"?: [productId], "max_uses"?: number | null, "expires_at"?: ISO date | null }',
        response: '{ "invite": { "id", "code", ... } }',
        notes: 'max_uses/expires_at null = sem limite.',
      },
    ],
  },
  {
    title: 'Login & Acesso',
    desc: 'Enviar o acesso inicial ou redefinir senha — a plataforma decide sozinha qual dos dois faz sentido pra cada membro.',
    endpoints: [
      {
        method: 'POST', path: '/api/admin/usuarios/:id/reenviar-convite',
        desc: 'Envia o acesso ao membro. Se ele nunca fez login, envia convite de primeiro acesso; se já ativou a conta, envia redefinição de senha.',
        response: '{ "sent": true }',
      },
      {
        method: 'POST', path: '/api/admin/usuarios/:id/resetar-senha',
        desc: 'Mesmo destino que /reenviar-convite — os dois nomes existem por clareza semântica, nunca fazem coisas diferentes.',
        response: '{ "sent": true }',
      },
    ],
  },
]

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

function EndpointBlock({ ep }: { ep: Endpoint }) {
  const exampleBody = ep.body?.startsWith('{') ? ep.body : undefined
  const curl = `curl -X ${ep.method} ${baseUrl}${ep.path.replace(':id', 'uuid-do-membro')} \\
  -H "x-api-key: sua-chave"${exampleBody ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${exampleBody.replace(/\s+/g, ' ')}'` : ''}`

  return (
    <div className="border-t border-gray-100 dark:border-[#1e2030] pt-4 first:border-t-0 first:pt-0 space-y-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono shrink-0 ${methodColor[ep.method]}`}>{ep.method}</span>
        <code className="text-gray-800 dark:text-gray-200 font-mono text-sm">{ep.path}</code>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">{ep.desc}</p>

      {ep.body && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Body</p>
          <code className="block text-[11px] font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#12162a] rounded px-2.5 py-1.5 overflow-x-auto">{ep.body}</code>
        </div>
      )}

      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Response</p>
        <code className="block text-[11px] font-mono text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#12162a] rounded px-2.5 py-1.5 overflow-x-auto">{ep.response}</code>
      </div>

      {ep.notes && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Observações</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{ep.notes}</p>
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Autenticação e todos os endpoints, organizados por domínio.</p>
        </div>
      </div>

      <Section title="Autenticação" id="autenticacao">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Todo endpoint abaixo exige o header <code className="bg-gray-100 dark:bg-[#1a2035] px-1.5 py-0.5 rounded text-xs">x-api-key</code>. Gerencie chaves em{' '}
          <Link href="/admin/integracoes/api" className="underline font-medium" style={{ color: 'var(--brand)' }}>Integrações → API</Link> — nomear a chave (ex. &quot;n8n&quot;) faz esse nome aparecer como autor de cada ação no histórico de auditoria.
        </p>
        <CodeBlock>{`x-api-key: sua-chave\nContent-Type: application/json`}</CodeBlock>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Base URL: <code className="bg-gray-100 dark:bg-[#1a2035] px-1.5 py-0.5 rounded text-xs">{baseUrl}</code> · Erros retornam <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">{'{ "error": "mensagem" }'}</code> com o status HTTP correspondente (400 dado inválido, 401 chave ausente/inválida, 404 não encontrado, 500 falha interna).
        </p>
      </Section>

      <Section title="Exemplos em outras linguagens">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Todo endpoint abaixo é HTTP puro — os exemplos de cada bloco usam cURL por ser universal, mas qualquer linguagem funciona da mesma forma. Abaixo, o mesmo request (conceder acesso) em cada uma:
        </p>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">JavaScript</p>
          <CodeBlock>{`await fetch("${baseUrl}/api/admin/acesso", {
  method: "POST",
  headers: { "x-api-key": "sua-chave", "Content-Type": "application/json" },
  body: JSON.stringify({ user_id: "uuid-do-membro", product_id: "uuid-do-produto" }),
})`}</CodeBlock>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">PHP</p>
          <CodeBlock>{`$ch = curl_init("${baseUrl}/api/admin/acesso");
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
    "${baseUrl}/api/admin/acesso",
    headers={"x-api-key": "sua-chave"},
    json={"user_id": "uuid-do-membro", "product_id": "uuid-do-produto"},
)`}</CodeBlock>
        </div>
      </Section>

      {DOMAINS.map(domain => (
        <Section key={domain.title} title={domain.title}>
          <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">{domain.desc}</p>
          <div className="space-y-4">
            {domain.endpoints.map(ep => <EndpointBlock key={ep.method + ep.path} ep={ep} />)}
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
