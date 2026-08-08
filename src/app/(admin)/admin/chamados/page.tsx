import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ChamadosClient } from './ChamadosClient'

export const dynamic = 'force-dynamic'

export default async function ChamadosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin' && me?.role !== 'equipe') redirect('/admin')

  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('support_tickets')
    .select('id, subject, message, status, created_at, admin_response, responded_at, profiles(name, email), products(title)')
    .order('created_at', { ascending: false })
    .limit(200)

  const tickets = (data ?? []).map(t => ({
    ...t,
    profiles: Array.isArray(t.profiles) ? t.profiles[0] : t.profiles,
    products: Array.isArray(t.products) ? t.products[0] : t.products,
  }))

  return <ChamadosClient tickets={tickets} />
}
