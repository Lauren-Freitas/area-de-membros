import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/Button'
import { ProductsList } from '@/components/admin/ProductsList'

export default async function AdminProdutosPage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('*').order('sort_order')
  const count = products?.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {count} {count === 1 ? 'produto cadastrado' : 'produtos cadastrados'}.
          </p>
        </div>
        <Button href="/admin/produtos/novo">+ Novo produto</Button>
      </div>

      <ProductsList initialProducts={products ?? []} />
    </div>
  )
}
