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

  // Só transações comerciais de verdade — acesso concedido manualmente
  // (granted_by='manual') não é uma venda e não deve aparecer aqui (era um
  // bug real: essa página não filtrava por granted_by, então acesso manual
  // aparecia misturado como se fosse venda). Ver "Acessos" pro histórico
  // completo de concessões, incluindo as manuais.
  const { data } = await adminClient
    .from('user_products')
    .select('id, granted_at, product_id, value, payment_status, invoice_url, profiles(name, email), products(title)')
    .in('granted_by', ['purchase', 'pack'])
    .order('granted_at', { ascending: false })

  const vendas = (data ?? []).map(v => ({
    id: v.id,
    granted_at: v.granted_at,
    product_id: v.product_id,
    value: v.value,
    payment_status: v.payment_status,
    invoice_url: v.invoice_url,
    profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
    products: Array.isArray(v.products) ? v.products[0] : v.products,
  }))

  return <VendasClient vendas={vendas} />
}
