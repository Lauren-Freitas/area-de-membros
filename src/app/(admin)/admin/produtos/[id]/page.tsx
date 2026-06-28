import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProductForm } from './ProductForm'
import { Product } from '@/types'

export default async function AdminProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const isNew = id === 'novo'

  let product: Product | undefined

  if (!isNew) {
    const supabase = await createClient()
    const { data } = await supabase.from('products').select('*').eq('id', id).single()
    if (!data) redirect('/admin/produtos')
    product = data as Product
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/admin/produtos" className="text-gray-500 hover:text-gray-800 transition">
          ← Produtos
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900">{isNew ? 'Novo produto' : product?.title}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {isNew ? 'Criar produto' : 'Editar produto'}
      </h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        <ProductForm product={product} />
      </div>
    </div>
  )
}
