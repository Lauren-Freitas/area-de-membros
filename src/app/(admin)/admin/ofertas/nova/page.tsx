import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { OfertaForm } from '../OfertaForm'

export default async function NovaOfertaPage() {
  const adminClient = createAdminClient()
  const { data: products } = await adminClient.from('products').select('id, title').eq('is_active', true).order('sort_order')
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/ofertas" className="hover:text-gray-800 transition">Ofertas</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Nova oferta</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900">Criar oferta</h1>
      <OfertaForm products={products ?? []} />
    </div>
  )
}
