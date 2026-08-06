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
}

interface Resource {
  title: string
  endpoints: Endpoint[]
}

const RESOURCES: Resource[] = [
  {
    title: 'Membros',
    endpoints: [
      { method: 'GET', path: '/api/admin/usuarios', desc: 'Listar todos os membros e colaboradores' },
      { method: 'POST', path: '/api/admin/usuarios', desc: 'Criar (ou reaproveitar por e-mail) e opcionalmente já liberar produtos', body: '{ name, email, phone?, products?: [productId], access_expires_at? }' },
      { method: 'GET', path: '/api/admin/usuarios/:id', desc: 'Detalhe de um membro' },
      { method: 'PATCH', path: '/api/admin/usuarios/:id', desc: 'Atualizar dados (parcial — só envie o que quer mudar)', body: "{ name?, role?: 'admin'|'equipe'|'membro', is_active?, phone? }" },
      { method: 'DELETE', path: '/api/admin/usuarios/:id', desc: 'Excluir permanentemente' },
      { method: 'POST', path: '/api/admin/usuarios/:id/reenviar-convite', desc: 'Enviar acesso — decide sozinho entre convite (nunca ativou) e redefinição de senha (já ativou)' },
      { method: 'POST', path: '/api/admin/usuarios/:id/resetar-senha', desc: 'Mesmo destino que /reenviar-convite — os dois nomes existem por clareza semântica' },
    ],
  },
  {
    title: 'Acesso',
    endpoints: [
      { method: 'POST', path: '/api/admin/acesso', desc: 'Liberar acesso a um produto, com validade opcional', body: '{ user_id, product_id, expires_at?: ISO date | null }' },
      { method: 'GET', path: '/api/admin/acesso', desc: 'Listar acessos (filtros ?user_id= e/ou ?product_id=)' },
      { method: 'PATCH', path: '/api/admin/acesso', desc: 'Alterar validade de um acesso existente', body: '{ user_id, product_id, expires_at: ISO date | null }' },
      { method: 'DELETE', path: '/api/admin/acesso', desc: 'Revogar acesso', body: '{ user_id, product_id }' },
    ],
  },
  {
    title: 'Produtos',
    endpoints: [
      { method: 'GET', path: '/api/admin/produtos', desc: 'Listar produtos' },
      { method: 'POST', path: '/api/admin/produtos', desc: 'Criar produto', body: "{ title, content_type: 'file'|'video', description?, content_url?, banner_url?, is_pack?, is_active? }" },
      { method: 'GET', path: '/api/admin/produtos/:id', desc: 'Detalhe de um produto' },
      { method: 'PATCH', path: '/api/admin/produtos/:id', desc: 'Atualizar produto (parcial)' },
      { method: 'DELETE', path: '/api/admin/produtos/:id', desc: 'Excluir produto e todo o conteúdo (módulos, aulas)' },
    ],
  },
  {
    title: 'Certificados, convites e vendas',
    endpoints: [
      { method: 'GET', path: '/api/admin/certificados', desc: 'Listar certificados emitidos' },
      { method: 'POST', path: '/api/admin/certificados', desc: 'Emitir certificado (idempotente — chamar de novo com o mesmo par não duplica)', body: '{ user_id, product_id }' },
      { method: 'GET', path: '/api/admin/convites', desc: 'Listar links de convite' },
      { method: 'POST', path: '/api/admin/convites', desc: 'Criar link de convite', body: '{ note?, product_ids?: [productId], max_uses?, expires_at? }' },
      { method: 'GET', path: '/api/admin/vendas', desc: 'Listar vendas (filtros ?user_id=, ?product_id=, ?payment_status=)' },
    ],
  },
]

const EVENTS: { name: string; desc: string }[] = [
  { name: 'member.created', desc: 'Membro criado (manual, API, convite ou compra)' },
  { name: 'member.updated', desc: 'Dados do membro alterados' },
  { name: 'member.deleted', desc: 'Membro excluído' },
  { name: 'member.activated', desc: 'Membro reativado' },
  { name: 'member.deactivated', desc: 'Membro desativado' },
  { name: 'access.granted', desc: 'Acesso a um produto liberado' },
  { name: 'access.revoked', desc: 'Acesso a um produto revogado' },
  { name: 'product.created', desc: 'Produto criado (ou duplicado)' },
  { name: 'product.updated', desc: 'Produto alterado' },
  { name: 'product.deleted', desc: 'Produto excluído' },
  { name: 'purchase.approved', desc: 'Compra aprovada (Asaas/Kiwify)' },
  { name: 'purchase.refunded', desc: 'Compra reembolsada/estornada' },
  { name: 'payment.approved', desc: 'Pagamento aprovado' },
  { name: 'payment.overdue', desc: 'Pagamento em atraso' },
  { name: 'payment.refunded', desc: 'Pagamento reembolsado' },
  { name: 'payment.failed', desc: 'Reservado — nenhum provedor integrado hoje distingue "falhou" de "atrasou"' },
  { name: 'certificate.generated', desc: 'Certificado emitido' },
  { name: 'lesson.completed', desc: 'Aluno concluiu uma aula' },
  { name: 'invite.sent', desc: 'Convite/acesso enviado' },
  { name: 'invite.accepted', desc: 'Convite aceito (autocadastro)' },
  { name: 'login.created', desc: 'Login realizado (no máx. 1x a cada 5min por usuário)' },
  { name: 'password.reset', desc: 'Redefinição de senha enviada' },
]

const payloadExample = JSON.stringify({
  event: 'access.granted',
  timestamp: '2026-08-06T14:32:10.000Z',
  member: { id: 'uuid', name: 'João Silva', email: 'joao@email.com' },
  product: { id: 'uuid', title: 'Programa de Emagrecimento' },
  actor: { type: 'api', label: 'n8n' },
  metadata: { expires_at: null },
}, null, 2)

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6 space-y-4">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">{children}</pre>
}

export default function DocumentacaoPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/integracoes" className="text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Documentação</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Referência da API pública e dos eventos de webhook — pra n8n, Make, Zapier ou qualquer sistema HTTP.</p>
        </div>
      </div>

      <Section title="Autenticação">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Todo endpoint em <code className="bg-gray-100 dark:bg-[#1a2035] px-1.5 py-0.5 rounded text-xs">/api/admin/**</code> exige o header abaixo. Use a chave mestra ou uma chave nomeada, criadas em{' '}
          <Link href="/admin/integracoes/api" className="underline font-medium" style={{ color: 'var(--brand)' }}>Integrações → API</Link> — dar um nome à chave (ex. &quot;n8n&quot;) faz esse nome aparecer como autor no histórico de cada ação feita com ela.
        </p>
        <CodeBlock>{`x-api-key: sua-chave\nContent-Type: application/json`}</CodeBlock>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Base URL: <code className="bg-gray-100 dark:bg-[#1a2035] px-1.5 py-0.5 rounded text-xs">{baseUrl}</code>
        </p>
      </Section>

      <Section title="Referência REST">
        <div className="space-y-6">
          {RESOURCES.map(res => (
            <div key={res.title}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{res.title}</p>
              <div className="space-y-2.5">
                {res.endpoints.map(ep => (
                  <div key={ep.method + ep.path} className="text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono shrink-0 ${methodColor[ep.method]}`}>{ep.method}</span>
                      <code className="text-gray-700 dark:text-gray-300 font-mono text-xs">{ep.path}</code>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5 ml-0.5">{ep.desc}</p>
                    {ep.body && <code className="block text-gray-500 dark:text-gray-400 text-[11px] font-mono mt-1 ml-0.5 bg-gray-50 dark:bg-[#12162a] rounded px-2 py-1 overflow-x-auto">{ep.body}</code>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Eventos de webhook (saída)">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Configure URLs de destino em <Link href="/admin/integracoes/webhooks" className="underline font-medium" style={{ color: 'var(--brand)' }}>Integrações → Webhooks</Link>. Todo evento chega no mesmo formato — só o conteúdo de <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">metadata</code> muda:
        </p>
        <CodeBlock>{payloadExample}</CodeBlock>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
          {EVENTS.map(ev => (
            <div key={ev.name} className="flex items-baseline gap-2 text-sm">
              <code className="text-gray-700 dark:text-gray-300 font-mono text-xs shrink-0">{ev.name}</code>
              <span className="text-gray-400 text-xs truncate">{ev.desc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Exemplos de código">
        <p className="text-sm text-gray-600 dark:text-gray-300">Todos liberando acesso a um produto — troque a URL/body pra qualquer outro endpoint da referência acima.</p>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">n8n — nó HTTP Request</p>
          <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
            <li>Method: <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">POST</code></li>
            <li>URL: <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">{baseUrl}/api/admin/acesso</code></li>
            <li>Headers: <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">x-api-key</code> = sua chave</li>
            <li>Body (JSON): <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">{'{ "user_id": "{{$json.userId}}", "product_id": "uuid-do-produto" }'}</code></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Make (Integromat) — módulo HTTP</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Mesma coisa: módulo &quot;HTTP → Make a request&quot;, método POST, header <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">x-api-key</code>, body type JSON com o mesmo payload acima.</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Zapier — Webhooks by Zapier (Custom Request)</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Action &quot;Custom Request&quot;, method POST, mesma URL/header/body. Zapier também consegue <em>receber</em> eventos — aponte um Zap &quot;Catch Hook&quot; pra URL cadastrada em Webhooks.</p>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">curl</p>
          <CodeBlock>{`curl -X POST ${baseUrl}/api/admin/acesso \\
  -H "x-api-key: sua-chave" \\
  -H "Content-Type: application/json" \\
  -d '{"user_id": "uuid-do-membro", "product_id": "uuid-do-produto"}'`}</CodeBlock>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">JavaScript</p>
          <CodeBlock>{`await fetch("${baseUrl}/api/admin/acesso", {
  method: "POST",
  headers: {
    "x-api-key": "sua-chave",
    "Content-Type": "application/json",
  },
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

      <p className="text-sm text-gray-500">
        Quer entender como isso se encaixa num fluxo de automação real (Notion, n8n, Asaas)? Veja{' '}
        <Link href="/admin/integracoes/automacoes" className="underline font-medium" style={{ color: 'var(--brand)' }}>Automações</Link>.
      </p>
    </div>
  )
}
