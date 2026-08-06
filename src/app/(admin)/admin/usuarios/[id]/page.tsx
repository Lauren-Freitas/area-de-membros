import { createAdminClient } from '@/lib/supabase/admin'
import { updateUser } from '@/lib/actions/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { describeActivity } from '@/lib/activity-labels'
import { EditarUsuarioForm } from './EditarUsuarioForm'

/**
 * Só serve o formulário de edição pra colaboradores (admin/equipe) — membros
 * são editados só dentro do drawer de "Gerenciar Membros" (não existe mais
 * uma segunda tela duplicando a mesma coisa). Esta rota continua existindo
 * pra manter link compartilhável/bookmark funcionando: se o alvo for membro,
 * só redireciona pro contexto certo.
 */
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
    .select('id, name, email, phone, role, is_active, last_login_at, created_at')
    .eq('id', id)
    .single()

  if (!target) redirect('/admin/usuarios')

  // Equipe não pode editar contas Admin
  if (me?.role === 'equipe' && target.role === 'admin') redirect('/admin/configuracoes')

  const isMember = target.role === 'membro' || !target.role
  if (isMember) redirect(`/admin/usuarios?open=${id}&view=editar`)

  const { data: activity } = await admin
    .from('activity_logs')
    .select('id, action, entity, entity_name, user_name, created_at')
    .eq('entity_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const activityEntries = (activity ?? []).map(a => ({
    id: a.id,
    description: describeActivity(a),
    actor: a.user_name,
    created_at: a.created_at,
  }))

  return (
    <EditarUsuarioForm
      profile={{ ...target, is_active: target.is_active !== false }}
      action={updateUser.bind(null, id)}
      userId={id}
      products={[]}
      activity={activityEntries}
    />
  )
}
