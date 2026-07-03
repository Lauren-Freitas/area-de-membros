import { createAdminClient } from '@/lib/supabase/admin'
import { updateUser } from '@/lib/actions/admin'
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
  const [{ data: target }, { data: products }, { data: accesses }] = await Promise.all([
    admin.from('profiles').select('id, name, email, role, is_active, created_at').eq('id', id).single(),
    admin.from('products').select('id, title').eq('is_active', true).order('sort_order'),
    admin.from('user_products').select('product_id').eq('user_id', id),
  ])

  if (!target) redirect('/admin/usuarios')

  // Equipe não pode editar contas Admin
  if (me?.role === 'equipe' && target.role === 'admin') redirect('/admin/configuracoes')

  const accessSet = new Set((accesses ?? []).map((a: { product_id: string }) => a.product_id))

  const productList = (products ?? []).map((p: { id: string; title: string }) => ({
    id: p.id,
    title: p.title,
    hasAccess: accessSet.has(p.id),
  }))

  return (
    <EditarUsuarioForm
      profile={{ ...target, is_active: target.is_active !== false }}
      action={updateUser.bind(null, id)}
      products={productList}
      userId={id}
    />
  )
}
