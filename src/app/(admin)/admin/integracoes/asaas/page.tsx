import { CopyButton } from '@/components/admin/CopyButton'
import Link from 'next/link'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://membros.thiagocantalovo.com'
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

export default function AsaasPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/integracoes" className="text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black" style={{ backgroundColor: '#00b1e4', color: '#fff' }}>
          A
        </div>
        <h1 className="text-xl font-bold text-gray-900">Asaas</h1>
      </div>

      {/* Webhook Asaas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Webhook Asaas</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure este endpoint no painel do Asaas para processar pagamentos automaticamente.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">URL do Webhook</p>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
              <code className="flex-1 text-sm text-gray-700 font-mono break-all">{baseUrl}/api/webhook/asaas</code>
              <CopyButton text={`${baseUrl}/api/webhook/asaas`} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Token de Acesso <span className="text-gray-400">(header: asaas-access-token)</span></p>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
              <code className="flex-1 text-sm text-gray-700 font-mono break-all select-all">{webhookToken}</code>
              <CopyButton text={webhookToken} />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
          <strong>Como configurar no Asaas:</strong> acesse Configurações → Integrações → Notificações / Webhooks, cole a URL acima e adicione o token no campo de autenticação.
        </div>
      </div>

      {/* Endpoints da API */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Endpoints da API</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Base URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{baseUrl}</code>
            {' · '}autentique com a chave em <Link href="/admin/integracoes/api" className="underline" style={{ color: '#b48840' }}>Integrações → API</Link>
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
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Exemplo — Liberar acesso</p>
          <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">{`curl -X POST ${baseUrl}/api/admin/acesso \\
  -H "x-api-key: SUA_CHAVE" \\
  -H "Content-Type: application/json" \\
  -d '{
    "user_id": "uuid-do-usuario",
    "product_id": "uuid-do-produto"
  }'`}</pre>
        </div>
      </div>
    </div>
  )
}
