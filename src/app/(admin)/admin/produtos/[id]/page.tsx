import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProductForm } from './ProductForm'
import { Product, Module, Lesson } from '@/types'
import { ModulesManager } from '@/components/admin/ModulesManager'

export default async function AdminProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const isNew = id === 'novo'

  let product: Product | undefined
  let modules: (Module & { lessons: Lesson[] })[] = []

  if (!isNew) {
    const supabase = await createClient()
    const [{ data: prod }, { data: mods }] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase
        .from('modules')
        .select('*, lessons(*)')
        .eq('product_id', id)
        .order('sort_order'),
    ])
    if (!prod) redirect('/admin/produtos')
    product = prod as Product
    modules = (mods ?? []) as (Module & { lessons: Lesson[] })[]
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/admin/produtos" className="text-gray-500 hover:text-gray-800 transition">
          Produtos
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900">{isNew ? 'Novo produto' : product?.title}</span>
      </div>

      <div className="bg-card rounded-2xl border border-gray-100 p-6 sm:p-8 mb-8">
        <ProductForm product={product} />
      </div>

      {/* Módulos — só mostra para produtos existentes */}
      {!isNew && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Módulos</h2>
            <Link
              href={`/admin/produtos/${id}/modulos/novo`}
              className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              + Novo módulo
            </Link>
          </div>

          <ModulesManager productId={id} initialModules={modules} />
        </div>
      )}
    </div>
  )
}
