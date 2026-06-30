import { createAdminClient } from '@/lib/supabase/admin'
import { updateUser, grantAccess, revokeAccess } from '@/lib/actions/admin'
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
  if (me?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const [{ data: target }, { data: products }, { data: accesses }] = await Promise.all([
    admin.from('profiles').select('id, name, email, role, created_at').eq('id', id).single(),
    admin.from('products').select('id, title').eq('is_active', true).order('sort_order'),
    admin.from('user_products').select('product_id').eq('user_id', id),
  ])

  if (!target) redirect('/admin/usuarios')

  const accessSet = new Set((accesses ?? []).map(a => a.product_id))

  const productList = (products ?? []).map(p => ({
    id: p.id,
    title: p.title,
    hasAccess: accessSet.has(p.id),
    action: accessSet.has(p.id)
      ? revokeAccess.bind(null, id, p.id)
      : grantAccess.bind(null, id, p.id),
  }))

  return (
    <EditarUsuarioForm
      profile={target}
      action={updateUser.bind(null, id)}
      products={productList}
    />
  )
}
