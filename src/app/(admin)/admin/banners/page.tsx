import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Banner } from '@/types'
import { deleteBanner } from '@/lib/actions/admin'

const typeLabel: Record<string, string> = { info: 'Info', success: 'Sucesso', warning: 'Aviso', promo: 'Promo' }
const typeColor: Record<string, string> = {
  info: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  promo: '#c9a84c',
}

export default async function BannersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: banners } = await admin.from('banners').select('*').order('sort_order')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Banners</h1>
          <p className="text-sm text-gray-500 mt-0.5">Avisos e promoções exibidos no dashboard dos membros.</p>
        </div>
        <Link
          href="/admin/banners/novo"
          className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#c9a84c' }}
        >
          + Novo banner
        </Link>
      </div>

      {(!banners || banners.length === 0) ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
          <p className="font-medium">Nenhum banner criado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(banners as Banner[]).map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4">
              <span
                className="mt-0.5 px-2 py-0.5 text-xs font-bold rounded-full text-white shrink-0"
                style={{ backgroundColor: typeColor[b.type] }}
              >
                {typeLabel[b.type]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm truncate">{b.title}</p>
                  {!b.is_active && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Inativo</span>}
                  {b.expires_at && new Date(b.expires_at) < new Date() && (
                    <span className="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded-full">Expirado</span>
                  )}
                </div>
                {b.body && <p className="text-xs text-gray-500 mt-0.5 truncate">{b.body}</p>}
                {b.link && <p className="text-xs text-blue-400 mt-0.5 truncate">{b.link}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/banners/${b.id}`}
                  className="text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                >
                  Editar
                </Link>
                <form action={async () => { 'use server'; await deleteBanner(b.id) }}>
                  <button type="submit" className="text-xs font-medium text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition">
                    Excluir
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
