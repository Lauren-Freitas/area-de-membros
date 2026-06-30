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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: target } = await admin
    .from('profiles')
    .select('id, name, email, role, created_at')
    .eq('id', id)
    .single()

  if (!target) redirect('/admin/usuarios')

  const action = updateUser.bind(null, id)

  return <EditarUsuarioForm profile={target} action={action} />
}
