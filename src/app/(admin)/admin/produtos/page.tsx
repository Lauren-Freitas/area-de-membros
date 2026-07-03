import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { toggleProductActive } from '@/lib/actions/admin'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'

export default async function AdminProdutosPage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('*').order('sort_order')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#b48840' }}
        >
          + Novo produto
        </Link>
      </div>

      {!products?.length ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
          <p className="font-medium">Nenhum produto cadastrado.</p>
          <p className="text-sm mt-1">Crie o primeiro produto para começar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
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
                  <form action={toggleProductActive.bind(null, product.id, !product.is_active)}>
                    <button
                      type="submit"
                      className={`text-xs font-medium px-2.5 py-1 rounded-full transition hover:opacity-80 ${
                        product.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {product.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </form>
                </div>
                <div className="w-44 shrink-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/produtos/${product.id}`}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border transition hover:bg-gray-50"
                      style={{ borderColor: '#b48840', color: '#7a5c10' }}
                    >
                      Editar
                    </Link>
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
