import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { deleteCohort } from '@/lib/actions/cohorts'

export default async function TurmasPage() {
  const adminClient = createAdminClient()
  const { data: cohorts } = await adminClient
    .from('cohorts')
    .select('*, products(title), cohort_members(count)')
    .order('created_at', { ascending: false })

  function formatDate(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Turmas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Grupos de membros com período definido</p>
        </div>
        <Link
          href="/admin/turmas/nova"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#c9a84c' }}
        >
          + Nova turma
        </Link>
      </div>

      {!cohorts?.length ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
          <p className="font-medium">Nenhuma turma criada ainda.</p>
          <p className="text-sm mt-1">Crie sua primeira turma para organizar grupos de alunos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Produto</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Período</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Membros</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cohorts.map((c) => {
                const memberCount = Array.isArray(c.cohort_members)
                  ? c.cohort_members.reduce((acc: number, r: { count: number }) => acc + (r.count ?? 0), 0)
                  : 0
                const product = Array.isArray(c.products) ? c.products[0] : c.products
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      <Link href={`/admin/turmas/${c.id}`} className="hover:underline" style={{ color: '#92710a' }}>
                        {c.name}
                      </Link>
                      {c.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{c.description}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{product?.title ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">
                      {c.starts_at || c.ends_at ? `${formatDate(c.starts_at)} → ${formatDate(c.ends_at)}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center text-gray-700 font-semibold">{memberCount}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/turmas/${c.id}`}
                          className="text-xs px-3 py-1.5 rounded-lg border transition hover:bg-gray-50"
                          style={{ borderColor: '#c9a84c', color: '#92710a' }}
                        >
                          Gerenciar
                        </Link>
                        <form action={async () => { 'use server'; await deleteCohort(c.id) }}>
                          <button type="submit" className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 transition hover:bg-red-50">
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
