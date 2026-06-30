import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { CohortForm } from '../CohortForm'

export default async function NovaTurmaPage() {
  const adminClient = createAdminClient()
  const { data: products } = await adminClient
    .from('products')
    .select('id, title')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/turmas" className="hover:text-gray-800 transition">Turmas</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">Nova turma</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900">Criar turma</h1>
      <CohortForm products={products ?? []} />
    </div>
  )
}
