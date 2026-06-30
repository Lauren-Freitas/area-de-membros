import { CopyButton } from '@/components/admin/CopyButton'
import Link from 'next/link'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://membros.thiagocantalovo.com'
const apiKey = process.env.ADMIN_API_KEY ?? '(não configurado)'
const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN ?? '(não configurado)'

const endpoints = [
  { method: 'POST',   path: '/api/admin/usuarios',     desc: 'Criar usuário' },
  { method: 'GET',    path: '/api/admin/usuarios',     desc: 'Listar usuários' },
  { method: 'DELETE', path: '/api/admin/usuarios/:id', desc: 'Excluir usuário' },
  { method: 'POST',   path: '/api/admin/produtos',     desc: 'Criar produto' },
  { method: 'GET',    path: '/api/admin/produtos',     desc: 'Listar produtos' },
  { method: 'DELETE', path: '/api/admin/produtos/:id', desc: 'Excluir produto' },
  { method: 'POST',   path: '/api/admin/acesso',       desc: 'Liberar acesso' },
  { method: 'DELETE', path: '/api/admin/acesso',       desc: 'Revogar acesso' },
]

const methodColor: Record<string, string> = {
  GET:    'bg-blue-50 text-blue-700',
  POST:   'bg-green-50 text-green-700',
  DELETE: 'bg-red-50 text-red-600',
}

function CopyRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">
        {label} {sub && <span className="text-gray-400 font-normal">{sub}</span>}
      </p>
      <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
        <code className="flex-1 text-sm text-gray-700 font-mono break-all select-all">{value}</code>
        <CopyButton text={value} />
      </div>
    </div>
  )
}

export default function AsaasPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/integracoes" className="text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Configuração de Integrações</h1>
      </div>

      {/* Chave de API (Admin) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Chave de API (Admin)</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Use este header em todas as chamadas à API:{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">x-api-key: &lt;chave&gt;</code>
          </p>
        </div>
        <CopyRow label="Chave de API" value={apiKey} />
        <p className="text-xs text-gray-400">
          Você também pode criar chaves nomeadas em{' '}
          <Link href="/admin/integracoes/api" className="underline" style={{ color: '#b48840' }}>
            Integrações → API
          </Link>{' '}
          para identificar cada integração separadamente.
        </p>
      </div>

      {/* Endpoints da API */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Endpoints da API</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Base URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{baseUrl}</code>
          </p>
        </div>

        <div className="space-y-2">
          {endpoints.map(({ method, path, desc }) => (
            <div key={method + path} className="flex items-center gap-3 text-sm">
              <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono shrink-0 ${methodColor[method]}`}>
                {method}
              </span>
              <code className="text-gray-700 font-mono text-xs">{path}</code>
              <span className="text-gray-400 hidden sm:block">— {desc}</span>
            </div>
          ))}
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Exemplo — Criar usuário</p>
          <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">{`curl -X POST ${baseUrl}/api/admin/usuarios \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "João Silva",
    "email": "joao@email.com",
    "products": ["uuid-do-produto"]
  }'`}</pre>
        </div>
      </div>

      {/* Webhook Asaas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Webhook Asaas</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure este endpoint no painel do Asaas para processar pagamentos automaticamente.
          </p>
        </div>

        <CopyRow label="URL do Webhook" value={`${baseUrl}/api/webhook/asaas`} />
        <CopyRow label="Token de Acesso" value={webhookToken} sub="(header: asaas-access-token)" />

        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
          <strong>Como configurar:</strong> no Asaas, acesse Configurações → Integrações → Notificações / Webhooks, cole a URL acima e o token no campo de autenticação.
        </div>
      </div>

      {/* n8n & Automações */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">n8n & Automações</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Conecte com n8n, Make, Zapier ou qualquer plataforma usando a API REST acima.
          </p>
        </div>

        <ol className="space-y-3 text-sm text-gray-600">
          {[
            <>No n8n, crie um nó <strong>HTTP Request</strong></>,
            <>Defina a URL do endpoint desejado e o método (POST, GET, DELETE)</>,
            <>Adicione o header <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">x-api-key</code> com a chave acima</>,
            <>Envie o body em JSON conforme o endpoint</>,
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5" style={{ backgroundColor: '#b48840' }}>
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <p className="text-xs text-gray-400">
          Ou configure um{' '}
          <Link href="/admin/integracoes/webhooks" className="underline" style={{ color: '#b48840' }}>
            Webhook de saída
          </Link>{' '}
          para receber eventos da plataforma direto no n8n quando uma venda acontecer.
        </p>
      </div>
    </div>
  )
}
