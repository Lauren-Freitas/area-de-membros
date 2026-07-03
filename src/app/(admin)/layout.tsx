import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, role, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'equipe') redirect('/dashboard')

  return (
    <AdminShell
      userName={profile?.name ?? ''}
      userEmail={profile?.email ?? user.email ?? ''}
      userAvatar={profile?.avatar_url ?? null}
      userId={user.id}
    >
      {children}
    </AdminShell>
  )
}
