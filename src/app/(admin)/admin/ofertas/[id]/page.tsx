import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { OfertaForm } from '../OfertaForm'

export default async function EditarOfertaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminClient = createAdminClient()
  const [{ data: offer }, { data: products }] = await Promise.all([
    adminClient.from('offers').select('*').eq('id', id).single(),
    adminClient.from('products').select('id, title').eq('is_active', true).order('sort_order'),
  ])
  if (!offer) redirect('/admin/ofertas')
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/ofertas" className="hover:text-gray-800 transition">Ofertas</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{offer.title}</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900">Editar oferta</h1>
      <OfertaForm offer={offer} products={products ?? []} />
    </div>
  )
}
