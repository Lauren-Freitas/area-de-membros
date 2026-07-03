import { createAdminClient } from '@/lib/supabase/admin'
import { NovoUsuarioForm } from './NovoUsuarioForm'
import Link from 'next/link'

export default async function NovoUsuarioPage({ searchParams }: { searchParams: Promise<{ equipe?: string }> }) {
  const { equipe } = await searchParams
  const isEquipe = equipe === 'true'
  const adminClient = createAdminClient()

  const { data: products } = isEquipe ? { data: [] } : await adminClient
    .from('products')
    .select('id, title')
    .eq('is_active', true)
    .order('sort_order')

  const backHref = isEquipe ? '/admin/configuracoes' : '/admin/usuarios'
  const backLabel = isEquipe ? 'Configurações' : 'Membros'
  const title = isEquipe ? 'Novo colaborador' : 'Novo membro'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href={backHref} className="text-sm text-gray-400 hover:text-gray-600">
          {backLabel}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700 font-medium">{title}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>

      <NovoUsuarioForm products={products ?? []} isEquipe={isEquipe} />
    </div>
  )
}
