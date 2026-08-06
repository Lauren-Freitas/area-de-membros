import { CopyButton } from '@/components/admin/CopyButton'
import Link from 'next/link'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://membros.thiagocantalovo.com'
const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN ?? '(não configurado)'

const EVENTS: { label: string; asaasEvent: string; effect: string; tone: 'ok' | 'warn' | 'danger' }[] = [
  { label: 'Pagamento confirmado', asaasEvent: 'PAYMENT_CONFIRMED, PAYMENT_RECEIVED', effect: 'Cria o membro (se novo) e libera o produto do externalReference — ou todos os produtos, se for um pack.', tone: 'ok' },
  { label: 'Pagamento em atraso', asaasEvent: 'PAYMENT_OVERDUE', effect: 'Marca o acesso como "overdue" — não revoga, só sinaliza.', tone: 'warn' },
  { label: 'Reembolso / estorno / chargeback', asaasEvent: 'PAYMENT_REFUNDED, PAYMENT_DELETED, PAYMENT_CHARGEBACK_REQUESTED', effect: 'Revoga o acesso concedido por essa compra.', tone: 'danger' },
]

const toneClass: Record<string, string> = {
  ok: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
  warn: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-gray-100 p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  )
}

/**
 * Padrão de "gateway" pensado pra ser reaproveitado sem mudar arquitetura —
 * quando entrar Stripe/Mercado Pago/Hotmart/Kiwify/Kirvano, cada um ganha uma
 * página seguindo a mesma estrutura de seções (Como funciona → Configuração
 * → Quando dispara → Como testar).
 */
export default function AsaasGatewayPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/integracoes" className="text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="text-xl font-black tracking-tight" style={{ color: '#00b1e4' }}>Asaas</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1a2035] text-gray-500 dark:text-gray-400">Gateway</span>
        </div>
      </div>

      <Section title="Como funciona">
        <p className="text-sm text-gray-600">
          Diferente de n8n/Make/Zapier (que são clientes da sua API), o Asaas fala diretamente com a plataforma: quando um pagamento é confirmado, o Asaas chama o webhook de entrada abaixo e a plataforma <strong>já cria o membro e libera o acesso sozinha</strong> — sem precisar de nenhuma automação no meio, desde que a cobrança tenha o produto certo no campo <code className="bg-gray-100 px-1 rounded text-xs">externalReference</code>.
        </p>
      </Section>

      <Section title="Configuração">
        <CopyRow label="URL do Webhook" value={`${baseUrl}/api/webhook/asaas`} />
        <CopyRow label="Token de Acesso" value={webhookToken} sub="(header: asaas-access-token)" />
        <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
          <strong>Como configurar:</strong> no Asaas, acesse Configurações → Integrações → Notificações / Webhooks, cole a URL acima e o token no campo de autenticação.
        </div>
      </Section>

      <Section title="Quando dispara">
        <div className="space-y-2.5">
          {EVENTS.map(ev => (
            <div key={ev.label} className="flex items-start gap-3 text-sm">
              <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded mt-0.5 ${toneClass[ev.tone]}`}>{ev.label}</span>
              <div>
                <code className="text-[11px] text-gray-400 font-mono">{ev.asaasEvent}</code>
                <p className="text-gray-600 dark:text-gray-300 mt-0.5">{ev.effect}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Como testar">
        <p className="text-sm text-gray-600">
          O próprio painel do Asaas permite disparar um evento de teste pra um webhook cadastrado (Configurações → Integrações → Webhooks → ícone de teste). Use isso pra confirmar que a URL e o token acima estão corretos antes de ativar em produção — não é necessário simular um pagamento real.
        </p>
      </Section>

      <p className="text-sm text-gray-500">
        Precisa da chave de API pra chamar a plataforma a partir de outro sistema? Isso fica em{' '}
        <Link href="/admin/integracoes/api" className="underline font-medium" style={{ color: 'var(--brand)' }}>Integrações → API</Link>. Referência completa de endpoints em{' '}
        <Link href="/admin/integracoes/api-reference" className="underline font-medium" style={{ color: 'var(--brand)' }}>API Reference</Link>.
      </p>
    </div>
  )
}
