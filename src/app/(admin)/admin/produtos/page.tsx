import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/Button'
import { ProductRow } from '@/components/admin/ProductRow'

export default async function AdminProdutosPage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('*').order('sort_order')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <Button href="/admin/produtos/novo">+ Novo produto</Button>
      </div>

      {!products?.length ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-gray-200 text-gray-400">
          <p className="font-medium">Nenhum produto cadastrado.</p>
          <p className="text-sm mt-1">Crie o primeiro produto para começar.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-gray-100 p-5">
          {/* Header */}
          <div className="flex items-center pb-3 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide gap-4">
            <span className="flex-1">Produto</span>
            <span className="w-20 text-center">Status</span>
            <span className="w-10 shrink-0" />
          </div>
          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
