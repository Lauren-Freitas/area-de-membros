import { createAdminClient } from '@/lib/supabase/admin'
import { updateUser } from '@/lib/actions/admin'
import { startViewAs } from '@/lib/actions/view-as'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EditarUsuarioForm } from './EditarUsuarioForm'

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (me?.role !== 'admin' && me?.role !== 'equipe') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: target } = await admin
    .from('profiles')
    .select('id, name, email, role, is_active, created_at')
    .eq('id', id)
    .single()

  if (!target) redirect('/admin/usuarios')

  // Equipe não pode editar contas Admin
  if (me?.role === 'equipe' && target.role === 'admin') redirect('/admin/configuracoes')

  const canViewAs = target.role === 'membro' && target.id !== user.id

  return (
    <div>
      {canViewAs && (
        <div className="mb-4 flex justify-end">
          <form action={startViewAs.bind(null, id)}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              <span>👁️</span>
              Ver como este membro
            </button>
          </form>
        </div>
      )}
      <EditarUsuarioForm
        profile={{ ...target, is_active: target.is_active !== false }}
        action={updateUser.bind(null, id)}
        userId={id}
      />
    </div>
  )
}
