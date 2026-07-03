import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VendasClient } from './VendasClient'

export default async function VendasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') redirect('/admin')

  const adminClient = createAdminClient()

  const { data } = await adminClient
    .from('user_products')
    .select('id, granted_at, product_id, profiles(name, email), products(title)')
    .order('granted_at', { ascending: false })

  const vendas = (data ?? []).map(v => ({
    id: v.id,
    granted_at: v.granted_at,
    product_id: v.product_id,
    profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
    products: Array.isArray(v.products) ? v.products[0] : v.products,
  }))

  return <VendasClient vendas={vendas} />
}
