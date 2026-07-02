import { createClient } from '@/lib/supabase/server'
import { NovoUsuarioForm } from './NovoUsuarioForm'
import Link from 'next/link'

export default async function NovoUsuarioPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, title')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/usuarios" className="text-sm text-gray-400 hover:text-gray-600">
          Membros
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">Novo membro</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo membro</h1>

      <NovoUsuarioForm products={products ?? []} />
    </div>
  )
}
