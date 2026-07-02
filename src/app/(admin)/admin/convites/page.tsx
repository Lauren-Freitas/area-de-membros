import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { deleteInvite } from '@/lib/actions/admin'
import { CopyButton } from '@/components/admin/CopyButton'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://membros.thiagocantalovo.com'

export default async function ConvitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const [{ data: invites }, { data: products }] = await Promise.all([
    admin.from('invites').select('*').order('created_at', { ascending: false }),
    admin.from('products').select('id, title').eq('is_active', true).order('sort_order'),
  ])

  const productMap = Object.fromEntries((products ?? []).map(p => [p.id, p.title]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Convites</h1>
          <p className="text-sm text-gray-500 mt-0.5">Links de cadastro para novos membros.</p>
        </div>
        <Link
          href="/admin/convites/novo"
          className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#b48840' }}
        >
          + Novo convite
        </Link>
      </div>

      {(!invites || invites.length === 0) ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
          <p className="font-medium">Nenhum convite criado ainda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Produtos</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Usos</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Expira</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invites.map(inv => {
                const link = `${APP_URL}/convite/${inv.code}`
                const expired = inv.expires_at && new Date(inv.expires_at) < new Date()
                const exhausted = inv.max_uses !== null && inv.used_count >= inv.max_uses
                const productNames = (inv.product_ids ?? []).map((id: string) => productMap[id] ?? id).join(', ')
                return (
                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900">{inv.code}</span>
                        <CopyButton text={link} />
                      </div>
                      {inv.note && <p className="text-xs text-gray-400 mt-0.5">{inv.note}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">
                      {productNames || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">
                      {inv.used_count}{inv.max_uses ? `/${inv.max_uses}` : ''}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">
                      {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {expired
                        ? <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-500">Expirado</span>
                        : exhausted
                          ? <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-orange-50 text-orange-500">Esgotado</span>
                          : <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600">Ativo</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/convites/${inv.id}`}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border transition hover:bg-gray-50"
                          style={{ borderColor: '#b48840', color: '#7a5c10' }}
                        >
                          Editar
                        </Link>
                        <form action={async () => { 'use server'; await deleteInvite(inv.id) }}>
                          <button type="submit" className="text-xs font-medium text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition">
                            Excluir
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
