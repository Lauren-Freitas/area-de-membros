import { createClient } from '@/lib/supabase/server'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'
import { Button } from '@/components/Button'

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
            <span className="w-44">Ações</span>
          </div>
          {/* Rows */}
          <div className="divide-y divide-gray-100">
            {products.map((product) => (
              <div key={product.id} className="flex items-center py-3.5 gap-4 hover:bg-gray-50 transition">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{product.title}</p>
                  {product.description && (
                    <p className="text-xs text-gray-400 truncate max-w-sm mt-0.5">{product.description}</p>
                  )}
                  <p className="text-xs text-gray-300 mt-0.5">Ordem {product.sort_order}</p>
                </div>
                <div className="w-20 text-center shrink-0">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      product.is_active
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {product.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="w-44 shrink-0">
                  <div className="flex items-center gap-2">
                    <Button href={`/admin/produtos/${product.id}`} variant="secondary" size="sm">
                      Editar
                    </Button>
                    <DeleteProductButton id={product.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
