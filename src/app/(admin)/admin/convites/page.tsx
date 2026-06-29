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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Convites</h1>
          <p className="text-sm text-gray-500 mt-0.5">Links de cadastro para novos membros.</p>
        </div>
        <Link
          href="/admin/convites/novo"
          className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#c9a84c' }}
        >
          + Novo convite
        </Link>
      </div>

      {(!invites || invites.length === 0) ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
          <p className="font-medium">Nenhum convite criado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invites.map(inv => {
            const link = `${APP_URL}/convite/${inv.code}`
            const expired = inv.expires_at && new Date(inv.expires_at) < new Date()
            const exhausted = inv.max_uses !== null && inv.used_count >= inv.max_uses
            const productNames = (inv.product_ids ?? []).map((id: string) => productMap[id] ?? id).join(', ')

            return (
              <div key={inv.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-bold text-gray-900 text-sm">{inv.code}</span>
                      {expired && <span className="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded-full">Expirado</span>}
                      {exhausted && <span className="text-xs text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full">Esgotado</span>}
                    </div>
                    {inv.note && <p className="text-xs text-gray-500 mb-1">{inv.note}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      <span>Usos: {inv.used_count}{inv.max_uses ? `/${inv.max_uses}` : ''}</span>
                      {inv.expires_at && <span>Expira: {new Date(inv.expires_at).toLocaleDateString('pt-BR')}</span>}
                      {productNames && <span>Acesso: {productNames}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-400 font-mono truncate max-w-xs">{link}</p>
                      <CopyButton text={link} />
                    </div>
                  </div>
                  <form action={async () => { 'use server'; await deleteInvite(inv.id) }}>
                    <button type="submit" className="text-xs font-medium text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition shrink-0">
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
