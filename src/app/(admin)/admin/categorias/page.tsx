import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SkillTrack } from '@/types'
import { ToggleCategoryButton } from './ToggleCategoryButton'

export default async function CategoriasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'equipe') redirect('/dashboard')

  const admin = createAdminClient()
  const [{ data: categories }, { data: links }] = await Promise.all([
    admin.from('skill_tracks').select('*').order('sort_order'),
    admin.from('content_skill_tracks').select('skill_track_id'),
  ])

  const countByTrack = new Map<string, number>()
  for (const row of links ?? []) {
    countByTrack.set(row.skill_track_id, (countByTrack.get(row.skill_track_id) ?? 0) + 1)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categorias</h1>
          <p className="text-sm text-gray-500 mt-0.5">Assuntos usados pra organizar a Biblioteca (&quot;O que você precisa agora?&quot;).</p>
        </div>
        <Link
          href="/admin/categorias/novo"
          className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          + Nova categoria
        </Link>
      </div>

      {(!categories || categories.length === 0) ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-gray-200 text-gray-400">
          <p className="font-medium">Nenhuma categoria criada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(categories as SkillTrack[]).map(c => {
            const count = countByTrack.get(c.id) ?? 0
            return (
              <div key={c.id} className="bg-card rounded-xl border border-gray-100 p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{c.title}</p>
                    {!c.is_active && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Inativa</span>}
                  </div>
                  {c.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{c.description}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{count} {count === 1 ? 'material associado' : 'materiais associados'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/categorias/${c.id}`}
                    className="text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                  >
                    Editar
                  </Link>
                  <ToggleCategoryButton id={c.id} isActive={c.is_active} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
