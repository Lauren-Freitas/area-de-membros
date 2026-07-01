import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default async function AssinaturaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows } = await supabase
    .from('user_products')
    .select('product_id, granted_by, granted_at, expires_at, products(id, title, buy_url)')
    .eq('user_id', user.id)
    .order('granted_at', { ascending: false })

  const items = (rows ?? []).map((r) => {
    const prod = Array.isArray(r.products) ? r.products[0] : r.products
    const now = new Date()
    const expiry = r.expires_at ? new Date(r.expires_at) : null
    const expired = expiry ? expiry < now : false
    const days = expiry && !expired ? daysLeft(r.expires_at!) : null

    let statusLabel = 'Ativo'
    let statusColor = 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (expired) {
      statusLabel = 'Expirado'
      statusColor = 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    } else if (days !== null && days <= 7) {
      statusLabel = `Expira em ${days} dia${days !== 1 ? 's' : ''}`
      statusColor = 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    }

    return {
      productId: prod?.id ?? r.product_id,
      title: prod?.title ?? 'Produto',
      buyUrl: prod?.buy_url ?? null,
      grantedBy: r.granted_by as string,
      grantedAt: r.granted_at as string,
      expiresAt: r.expires_at as string | null,
      expiry,
      expired,
      statusLabel,
      statusColor,
    }
  })

  const active = items.filter(i => !i.expired)
  const expired = items.filter(i => i.expired)

  const grantedLabel = (g: string) => {
    if (g === 'purchase') return 'Compra'
    if (g === 'manual') return 'Liberado manualmente'
    if (g === 'pack') return 'Pacote'
    return g
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minha Assinatura</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Seus produtos ativos e histórico de acessos.
        </p>
      </div>

      {/* Produtos ativos */}
      <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
          {active.length > 0 ? 'Produtos ativos' : 'Nenhum produto ativo'}
        </h2>

        {active.length === 0 ? (
          <p className="text-sm text-gray-400">
            Você ainda não tem nenhum conteúdo ativo.{' '}
            <Link href="/dashboard" className="underline" style={{ color: '#b48840' }}>Ver disponíveis</Link>
          </p>
        ) : (
          <div className="space-y-3">
            {active.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-[#1e2030] bg-gray-50 dark:bg-[#0a0d1a]">
                {/* Ícone */}
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#f5efe3' }}>
                  <svg className="w-5 h-5" style={{ color: '#b48840' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {grantedLabel(item.grantedBy)} · desde {formatDate(item.grantedAt)}
                  </p>
                  {item.expiry && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.expiresAt ? `Renovação/vencimento: ${formatDate(item.expiresAt)}` : ''}
                    </p>
                  )}
                  {!item.expiry && (
                    <p className="text-xs mt-0.5" style={{ color: '#b48840' }}>Acesso vitalício</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.statusColor}`}>
                    {item.statusLabel}
                  </span>
                  <Link
                    href={`/produto/${item.productId}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Acessar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Produtos expirados */}
      {expired.length > 0 && (
        <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Expirados / Encerrados</h2>
          <div className="space-y-3">
            {expired.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-[#1e2030] opacity-75">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{item.title}</p>
                  {item.expiresAt && (
                    <p className="text-xs text-gray-400 mt-0.5">Expirou em {formatDate(item.expiresAt)}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${item.statusColor}`}>
                    {item.statusLabel}
                  </span>
                  {item.buyUrl && (
                    <a
                      href={item.buyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90"
                      style={{ backgroundColor: '#b48840' }}
                    >
                      Renovar
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dúvidas */}
      <div className="text-center py-4">
        <p className="text-sm text-gray-400">
          Dúvidas sobre sua assinatura?{' '}
          <Link href="/atendimento" className="underline font-medium" style={{ color: '#b48840' }}>
            Abrir chamado
          </Link>
        </p>
      </div>
    </div>
  )
}
