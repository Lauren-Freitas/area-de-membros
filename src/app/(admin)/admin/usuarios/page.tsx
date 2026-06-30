import { createClient } from '@/lib/supabase/server'
import { grantAccess, revokeAccess } from '@/lib/actions/admin'
import { DeleteUserButton } from '@/components/admin/DeleteUserButton'
import { Profile, Product } from '@/types'
import Link from 'next/link'

export default async function AdminUsuariosPage() {
  const supabase = await createClient()

  const [
    { data: profiles },
    { data: products },
    { data: accesses },
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('id, title').eq('is_active', true).order('sort_order'),
    supabase.from('user_products').select('user_id, product_id'),
  ])

  const accessMap = new Map<string, Set<string>>()
  accesses?.forEach((a) => {
    if (!accessMap.has(a.user_id)) accessMap.set(a.user_id, new Set())
    accessMap.get(a.user_id)!.add(a.product_id)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <Link
          href="/admin/usuarios/novo"
          className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#b48840' }}
        >
          + Novo usuário
        </Link>
      </div>

      {profiles?.length ? (
        <div className="space-y-4">
          {(profiles as Profile[]).map((profile) => (
            <div key={profile.id} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900">{profile.name || '(sem nome)'}</p>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      profile.role === 'admin'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {profile.role === 'admin' ? 'Admin' : 'Membro'}
                  </span>
                  {profile.role !== 'admin' && (
                    <DeleteUserButton userId={profile.id} userName={profile.name || profile.email} />
                  )}
                </div>
              </div>

              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Acesso aos produtos
              </p>

              <div className="flex flex-wrap gap-2">
                {(products as Product[])?.map((product) => {
                  const hasAccess = accessMap.get(profile.id)?.has(product.id) ?? false
                  return (
                    <form
                      key={product.id}
                      action={
                        hasAccess
                          ? revokeAccess.bind(null, profile.id, product.id)
                          : grantAccess.bind(null, profile.id, product.id)
                      }
                    >
                      <button
                        type="submit"
                        title={hasAccess ? 'Clique para revogar acesso' : 'Clique para liberar acesso'}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                          hasAccess
                            ? 'bg-gold-50 text-gold-700 border-gold-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gold-50 hover:text-gold-700 hover:border-gold-200'
                        }`}
                      >
                        {hasAccess ? '✓ ' : '+ '}
                        {product.title}
                      </button>
                    </form>
                  )
                })}

                {!products?.length && (
                  <p className="text-sm text-gray-400">Nenhum produto ativo cadastrado.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <p className="font-medium">Nenhum usuário cadastrado ainda.</p>
          <p className="text-sm mt-1">
            <Link href="/admin/usuarios/novo" className="underline">Criar o primeiro usuário</Link>
          </p>
        </div>
      )}
    </div>
  )
}
