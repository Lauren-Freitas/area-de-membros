import { createAdminClient } from '@/lib/supabase/admin'
import { updateUser } from '@/lib/actions/admin'
import { startViewAs } from '@/lib/actions/view-as'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { describeActivity } from '@/lib/activity-labels'
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
    .select('id, name, email, phone, role, is_active, last_login_at, created_at')
    .eq('id', id)
    .single()

  if (!target) redirect('/admin/usuarios')

  // Equipe não pode editar contas Admin
  if (me?.role === 'equipe' && target.role === 'admin') redirect('/admin/configuracoes')

  const isMember = target.role === 'membro' || !target.role
  const canViewAs = isMember && target.id !== user.id

  const [{ data: products }, { data: accesses }, { data: activity }] = await Promise.all([
    isMember ? admin.from('products').select('id, title').eq('is_active', true).order('sort_order') : Promise.resolve({ data: null }),
    isMember ? admin.from('user_products').select('product_id, expires_at').eq('user_id', id) : Promise.resolve({ data: null }),
    admin.from('activity_logs').select('id, action, entity, entity_name, user_name, created_at').eq('entity_id', id).order('created_at', { ascending: false }).limit(10),
  ])

  const accessMap = new Map((accesses ?? []).map(a => [a.product_id as string, a.expires_at as string | null]))
  const productAccess = (products ?? []).map(p => ({
    id: p.id,
    title: p.title,
    hasAccess: accessMap.has(p.id),
    expiresAt: accessMap.get(p.id) ?? null,
  }))

  const activityEntries = (activity ?? []).map(a => ({
    id: a.id,
    description: describeActivity(a),
    actor: a.user_name,
    created_at: a.created_at,
  }))

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
        products={productAccess}
        activity={activityEntries}
      />
    </div>
  )
}
