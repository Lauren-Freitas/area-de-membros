import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ConfiguracoesForm } from './ConfiguracoesForm'
import { ThemeSection } from './ThemeSection'
import { EquipeExcluirButton } from '@/components/admin/EquipeExcluirButton'
import Link from 'next/link'

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase() || '?'
}

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: teamMembers }] = await Promise.all([
    supabase.from('profiles').select('name, email, avatar_url, role').eq('id', user?.id ?? '').single(),
    adminClient.from('profiles').select('id, name, email, avatar_url, role').in('role', ['admin', 'equipe']).order('created_at'),
  ])

  const currentUserIsAdmin = profile?.role === 'admin'

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Conta & Equipe</h1>

      {/* Meu perfil */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Meu perfil</h2>
        <ConfiguracoesForm
          name={profile?.name ?? ''}
          email={profile?.email ?? ''}
          avatarUrl={profile?.avatar_url ?? null}
        />
      </div>

      {/* Tema */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Tema</h2>
        <p className="text-sm text-gray-500 mb-4">Escolha entre modo claro e escuro.</p>
        <ThemeSection />
      </div>

      {/* Equipe */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">Equipe</h2>
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-semibold text-gray-900">Colaboradores</p>
              <p className="text-sm text-gray-500 mt-0.5">Administradores com acesso ao painel.</p>
            </div>
            <Link
              href="/admin/usuarios/novo?equipe=true&from=equipe"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg hover:opacity-90 transition"
              style={{ backgroundColor: '#b48840' }}
            >
              + Adicionar
            </Link>
          </div>

          <div className="space-y-2">
            {(teamMembers ?? []).map((member) => {
              const isMe = member.id === user?.id
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  {member.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatar_url}
                      alt={member.name ?? ''}
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: '#b48840' }}
                    >
                      {initials(member.name ?? '')}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {member.name ?? '(sem nome)'}
                      {isMe && <span className="ml-1.5 text-xs text-gray-400 font-normal">(você)</span>}
                      <span className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        member.role === 'admin'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {member.role === 'admin' ? 'Admin' : 'Equipe'}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 truncate">{member.email}</p>
                  </div>
                  {/* Admin vê botões para todos; Equipe só vê botões para outros de Equipe */}
                  {(currentUserIsAdmin || member.role === 'equipe') && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/admin/usuarios/${member.id}?from=equipe`}
                        className="text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200 dark:border-gray-600 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                      >
                        Editar
                      </Link>
                      {!isMe && (
                        <EquipeExcluirButton userId={member.id} name={member.name ?? '(sem nome)'} />
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {!teamMembers?.length && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum colaborador cadastrado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
