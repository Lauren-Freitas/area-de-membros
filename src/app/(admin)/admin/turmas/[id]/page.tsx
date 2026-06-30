import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CohortForm } from '../CohortForm'
import { addCohortMember, removeCohortMember } from '@/lib/actions/cohorts'

export default async function GerenciarTurmaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminClient = createAdminClient()

  const [{ data: cohort }, { data: products }, { data: members }, { data: allUsers }] = await Promise.all([
    adminClient.from('cohorts').select('*, products(title)').eq('id', id).single(),
    adminClient.from('products').select('id, title').eq('is_active', true).order('sort_order'),
    adminClient.from('cohort_members').select('user_id, profiles(id, name, email)').eq('cohort_id', id),
    adminClient.from('profiles').select('id, name, email').eq('role', 'member').order('name'),
  ])

  if (!cohort) redirect('/admin/turmas')

  const memberIds = new Set(members?.map(m => m.user_id) ?? [])
  const nonMembers = (allUsers ?? []).filter(u => !memberIds.has(u.id))

  function formatDate(d: string | null) {
    if (!d) return null
    return new Date(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const product = Array.isArray(cohort.products) ? cohort.products[0] : cohort.products

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/turmas" className="hover:text-gray-800 transition">Turmas</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{cohort.name}</span>
      </div>

      {/* Info rápida */}
      <div className="flex flex-wrap gap-4">
        {product && (
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium" style={{ backgroundColor: '#fdf8e6', color: '#92710a' }}>
            📚 {product.title}
          </span>
        )}
        {cohort.starts_at && (
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 font-medium">
            📅 {formatDate(cohort.starts_at)} → {formatDate(cohort.ends_at) ?? 'sem fim'}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 font-medium">
          👥 {members?.length ?? 0} membros
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editar turma */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-4">Editar turma</h2>
          <CohortForm cohort={cohort} products={products ?? []} />
        </div>

        {/* Membros */}
        <div className="space-y-4">
          {/* Adicionar membro */}
          {nonMembers.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-3">Adicionar membro</h2>
              <form action={async (fd: FormData) => {
                'use server'
                const userId = fd.get('user_id') as string
                if (userId) await addCohortMember(id, userId)
              }} className="flex gap-2">
                <select
                  name="user_id"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white"
                >
                  <option value="">Selecionar membro...</option>
                  {nonMembers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 shrink-0"
                  style={{ backgroundColor: '#c9a84c' }}
                >
                  Adicionar
                </button>
              </form>
            </div>
          )}

          {/* Lista de membros */}
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">
              Membros da turma{members?.length ? ` (${members.length})` : ''}
            </h2>
            {!members?.length ? (
              <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400 text-sm">
                Nenhum membro na turma ainda.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {members.map((m) => {
                    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
                    return (
                      <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-100 text-gray-500 shrink-0">
                          {profile?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{profile?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                        </div>
                        <form action={async () => {
                          'use server'
                          await removeCohortMember(id, m.user_id)
                        }}>
                          <button type="submit" className="text-xs text-red-400 hover:text-red-600 transition font-medium">
                            Remover
                          </button>
                        </form>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
