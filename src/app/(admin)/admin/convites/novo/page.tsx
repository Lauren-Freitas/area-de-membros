import { createAdminClient } from '@/lib/supabase/admin'
import { NovoConviteForm } from './NovoConviteForm'

export default async function NovoConvitePage() {
  const supabase = createAdminClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, title')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo convite</h1>
      <NovoConviteForm products={products ?? []} />
    </div>
  )
}
