import { createClient } from '@/lib/supabase/server'
import { MemberRow } from '@/components/admin/MemberRow'
import { Profile, Product } from '@/types'
import Link from 'next/link'
import { Button } from '@/components/Button'

export default async function AdminUsuariosPage() {
  const supabase = await createClient()

  const [
    { data: profiles },
    { data: products },
    { data: accesses },
  ] = await Promise.all([
    supabase.from('profiles').select('*').or('role.eq.membro,role.is.null').order('created_at', { ascending: false }),
    supabase.from('products').select('id, title').eq('is_active', true).order('sort_order'),
    supabase.from('user_products').select('user_id, product_id, expires_at'),
  ])

  const accessMap = new Map<string, Map<string, string | null>>()
  accesses?.forEach((a) => {
    if (!accessMap.has(a.user_id)) accessMap.set(a.user_id, new Map())
    accessMap.get(a.user_id)!.set(a.product_id, a.expires_at)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Membros</h1>
        <Button href="/admin/usuarios/novo">+ Novo membro</Button>
      </div>

      {profiles?.length ? (
        <div className="bg-card rounded-2xl border border-gray-100 p-4 overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header */}
            <div className="flex items-center gap-4 pb-2 px-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <span className="flex-1">Membro</span>
              <span className="w-20 shrink-0">Últ. acesso</span>
              <span className="w-20 shrink-0">Cadastro</span>
              <span className="w-56 shrink-0">Conteúdos</span>
              <span className="w-24 shrink-0">Expira</span>
              <span className="w-8 shrink-0" />
            </div>
            <div className="divide-y divide-gray-50 dark:divide-[#1a1f30]">
              {(profiles as Profile[]).map((profile) => {
                const userAccess = accessMap.get(profile.id)
                const productAccess = (products as Product[] ?? []).map((product) => ({
                  id: product.id,
                  title: product.title,
                  hasAccess: userAccess?.has(product.id) ?? false,
                  expiresAt: userAccess?.get(product.id) ?? null,
                }))
                return (
                  <MemberRow
                    key={profile.id}
                    profile={{
                      id: profile.id,
                      name: profile.name,
                      email: profile.email,
                      role: profile.role,
                      is_active: profile.is_active !== false,
                      avatar_url: profile.avatar_url ?? null,
                      last_login_at: (profile as { last_login_at?: string | null }).last_login_at ?? null,
                      created_at: profile.created_at,
                    }}
                    products={productAccess}
                  />
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 bg-card rounded-2xl border border-gray-100">
          <p className="font-medium">Nenhum membro cadastrado ainda.</p>
          <p className="text-sm mt-1">
            <Link href="/admin/usuarios/novo" className="underline">Criar o primeiro membro</Link>
          </p>
        </div>
      )}
    </div>
  )
}
