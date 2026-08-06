import { CopyButton } from '@/components/admin/CopyButton'
import Link from 'next/link'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://membros.thiagocantalovo.com'
const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN ?? '(não configurado)'

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
        <h1 className="text-xl font-bold text-gray-900">Asaas</h1>
      </div>

      {/* Webhook Asaas */}
      <div className="bg-card rounded-2xl border border-gray-100 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Webhook Asaas</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Configure este endpoint no painel do Asaas para processar pagamentos automaticamente — ao confirmar um pagamento, a plataforma já cria o membro e libera o produto sozinha (sem precisar de n8n no meio, desde que a cobrança tenha o produto certo no <code className="bg-gray-100 px-1 rounded text-xs">externalReference</code>).
          </p>
        </div>

        <CopyRow label="URL do Webhook" value={`${baseUrl}/api/webhook/asaas`} />
        <CopyRow label="Token de Acesso" value={webhookToken} sub="(header: asaas-access-token)" />

        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
          <strong>Como configurar:</strong> no Asaas, acesse Configurações → Integrações → Notificações / Webhooks, cole a URL acima e o token no campo de autenticação.
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Precisa da chave de API mestra ou de chaves nomeadas para chamar a plataforma a partir de n8n/Make/Zapier? Isso fica em{' '}
        <Link href="/admin/integracoes/api" className="underline font-medium" style={{ color: 'var(--brand)' }}>Integrações → API</Link>. Referência completa de endpoints em{' '}
        <Link href="/admin/integracoes/documentacao" className="underline font-medium" style={{ color: 'var(--brand)' }}>Documentação</Link>.
      </p>
    </div>
  )
}
