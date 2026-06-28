import { CopyButton } from '@/components/admin/CopyButton'

export default function IntegracoesPage() {
  const apiKey = process.env.ADMIN_API_KEY ?? '(não configurado)'
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN ?? '(não configurado)'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://membros.thiagocantalovo.com'

  const endpoints = [
    { method: 'POST',   path: '/api/admin/usuarios',       desc: 'Criar usuário' },
    { method: 'GET',    path: '/api/admin/usuarios',       desc: 'Listar usuários' },
    { method: 'DELETE', path: '/api/admin/usuarios/:id',   desc: 'Excluir usuário' },
    { method: 'POST',   path: '/api/admin/produtos',       desc: 'Criar produto' },
    { method: 'GET',    path: '/api/admin/produtos',       desc: 'Listar produtos' },
    { method: 'DELETE', path: '/api/admin/produtos/:id',   desc: 'Excluir produto' },
    { method: 'POST',   path: '/api/admin/acesso',         desc: 'Liberar acesso' },
    { method: 'DELETE', path: '/api/admin/acesso',         desc: 'Revogar acesso' },
  ]

  const methodColor: Record<string, string> = {
    GET: 'bg-blue-50 text-blue-700',
    POST: 'bg-green-50 text-green-700',
    DELETE: 'bg-red-50 text-red-600',
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>

      {/* API Key */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Chave de API (Admin)</h2>
        <p className="text-sm text-gray-500 mb-4">
          Use este header em todas as chamadas à API: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">x-api-key: &lt;chave&gt;</code>
        </p>
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
          <code className="flex-1 text-sm text-gray-700 font-mono break-all select-all">{apiKey}</code>
          <CopyButton text={apiKey} />
        </div>
      </div>

      {/* Endpoints */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Endpoints da API</h2>
        <p className="text-sm text-gray-500 mb-4">Base URL: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{baseUrl}</code></p>
        <div className="space-y-2">
          {endpoints.map(({ method, path, desc }) => (
            <div key={method + path} className="flex items-center gap-3 text-sm">
              <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono shrink-0 ${methodColor[method]}`}>
                {method}
              </span>
              <code className="text-gray-700 font-mono">{path}</code>
              <span className="text-gray-400 hidden sm:block">— {desc}</span>
            </div>
          ))}
        </div>

        {/* Exemplo */}
        <div className="mt-6">
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
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Webhook Asaas</h2>
        <p className="text-sm text-gray-500 mb-4">
          Configure este endpoint no painel do Asaas para processar pagamentos automaticamente.
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">URL do Webhook</p>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
              <code className="flex-1 text-sm text-gray-700 font-mono break-all">{baseUrl}/api/webhook/asaas</code>
              <CopyButton text={`${baseUrl}/api/webhook/asaas`} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Token de Acesso (header: asaas-access-token)</p>
            <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
              <code className="flex-1 text-sm text-gray-700 font-mono break-all">{webhookToken}</code>
              <CopyButton text={webhookToken} />
            </div>
          </div>
        </div>
      </div>

      {/* n8n / Automações */}
      <div id="automacoes" className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">n8n & Automações</h2>
        <p className="text-sm text-gray-500 mb-4">
          Conecte com n8n, Make, Zapier ou qualquer plataforma de automação usando a API REST acima.
        </p>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">1.</span>
            <p>No n8n, crie um nó <strong>HTTP Request</strong></p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">2.</span>
            <p>Defina a URL do endpoint desejado acima e o método (POST, GET, DELETE)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">3.</span>
            <p>Adicione o header <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">x-api-key</code> com o valor da chave acima</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-lg mt-0.5">4.</span>
            <p>Envie o body em JSON conforme o endpoint</p>
          </div>
        </div>
      </div>
    </div>
  )
}
