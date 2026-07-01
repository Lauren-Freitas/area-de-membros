import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  getCustomerPayments,
  getCustomerSubscriptions,
  findCustomerByEmail,
  AsaasPayment,
  AsaasSubscription,
} from '@/lib/asaas'

const BILLING_TYPE: Record<string, string> = {
  BOLETO: 'Boleto',
  CREDIT_CARD: 'Cartão de crédito',
  PIX: 'Pix',
  DEBIT_CARD: 'Cartão de débito',
  TRANSFER: 'Transferência',
  UNDEFINED: 'Não definido',
}

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  RECEIVED: { label: 'Pago', color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  OVERDUE: { label: 'Vencido', color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  REFUNDED: { label: 'Estornado', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  REFUND_REQUESTED: { label: 'Estorno solicitado', color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  CHARGEBACK_REQUESTED: { label: 'Chargeback', color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  AWAITING_CHARGEBACK_REVERSAL: { label: 'Chargeback', color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  DUNNING_REQUESTED: { label: 'Em negativação', color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
}

const SUBSCRIPTION_STATUS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Ativa', color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  INACTIVE: { label: 'Inativa', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  EXPIRED: { label: 'Expirada', color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

const CYCLE: Record<string, string> = {
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quinzenal',
  MONTHLY: 'Mensal',
  BIMONTHLY: 'Bimestral',
  QUARTERLY: 'Trimestral',
  SEMIANNUALLY: 'Semestral',
  YEARLY: 'Anual',
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR')
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function AssinaturaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Busca profile com asaas_customer_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, asaas_customer_id')
    .eq('id', user.id)
    .single()

  // Busca os produtos adquiridos localmente (todos, inclusive manuais)
  const { data: userProductsData } = await supabase
    .from('user_products')
    .select('product_id, granted_by, granted_at, asaas_payment_id, products(title)')
    .eq('user_id', user.id)
    .order('granted_at', { ascending: false })

  const userProducts = (userProductsData ?? []) as {
    product_id: string
    granted_by: string
    granted_at: string
    asaas_payment_id: string | null
    products: { title: string } | { title: string }[] | null
  }[]

  // Resolve o customer ID no Asaas (via profile ou busca por email)
  let customerId: string | null = (profile as { asaas_customer_id?: string | null } | null)?.asaas_customer_id ?? null
  if (!customerId && user.email) {
    const found = await findCustomerByEmail(user.email).catch(() => null)
    customerId = found?.id ?? null
  }

  let payments: AsaasPayment[] = []
  let subscriptions: AsaasSubscription[] = []

  if (customerId) {
    ;[payments, subscriptions] = await Promise.all([
      getCustomerPayments(customerId),
      getCustomerSubscriptions(customerId),
    ])
  }

  const grantedByLabel = (g: string) => {
    if (g === 'purchase') return 'Compra'
    if (g === 'manual') return 'Liberado manualmente'
    if (g === 'pack') return 'Pacote'
    return g
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assinatura & Pagamentos</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Visualize seus acessos, assinaturas e histórico de cobranças.
        </p>
      </div>

      {/* Assinaturas recorrentes */}
      {subscriptions.length > 0 && (
        <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Assinaturas ativas</h2>
          <div className="space-y-3">
            {subscriptions.map(sub => {
              const st = SUBSCRIPTION_STATUS[sub.status] ?? { label: sub.status, color: 'bg-gray-100 text-gray-600' }
              return (
                <div key={sub.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-[#1e2030] bg-gray-50 dark:bg-[#0a0d1a]">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {sub.description ?? 'Assinatura'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {CYCLE[sub.cycle] ?? sub.cycle} · {BILLING_TYPE[sub.billingType] ?? sub.billingType}
                      {sub.nextDueDate && ` · Próximo vencimento: ${formatDate(sub.nextDueDate)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(sub.value)}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Meus acessos */}
      <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Meus acessos</h2>
        {userProducts.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhum conteúdo adquirido ainda.</p>
        ) : (
          <div className="space-y-3">
            {userProducts.map((up, i) => {
              const prod = Array.isArray(up.products) ? up.products[0] : up.products
              return (
                <div key={i} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-[#1e2030] bg-gray-50 dark:bg-[#0a0d1a]">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {prod?.title ?? 'Produto'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {grantedByLabel(up.granted_by)} · {new Date(up.granted_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Ativo
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Histórico de pagamentos */}
      {payments.length > 0 && (
        <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Histórico de cobranças</h2>
          <div className="space-y-2">
            {payments.map(p => {
              const ps = PAYMENT_STATUS[p.status] ?? { label: p.status, color: 'bg-gray-100 text-gray-600' }
              const invoiceLink = p.invoiceUrl ?? p.bankSlipUrl
              return (
                <div key={p.id} className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-[#1e2030] last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {p.description ?? 'Cobrança'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Vencimento: {formatDate(p.dueDate)}
                      {p.paymentDate && ` · Pago em: ${formatDate(p.paymentDate)}`}
                      {' · '}{BILLING_TYPE[p.billingType] ?? p.billingType}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">
                    {formatCurrency(p.value)}
                  </p>
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${ps.color}`}>
                    {ps.label}
                  </span>
                  {invoiceLink && (
                    <a
                      href={invoiceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 hover:underline"
                    >
                      Ver boleto
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sem dados do Asaas */}
      {!customerId && payments.length === 0 && subscriptions.length === 0 && (
        <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6 text-center">
          <p className="text-sm text-gray-400">
            Nenhuma cobrança encontrada. Se você realizou um pagamento recentemente,{' '}
            pode demorar alguns instantes para aparecer aqui.
          </p>
        </div>
      )}
    </div>
  )
}
