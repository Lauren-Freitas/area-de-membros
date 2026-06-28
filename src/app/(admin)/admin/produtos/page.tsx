import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { toggleProductActive } from '@/lib/actions/admin'
import { DeleteProductButton } from '@/components/admin/DeleteProductButton'

export default async function AdminProdutosPage() {
  const supabase = await createClient()
  const { data: products } = await supabase.from('products').select('*').order('sort_order')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white text-sm font-semibold rounded-lg transition"
        >
          + Novo produto
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {products?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-6 py-3 font-medium text-gray-500">Produto</th>
                <th className="px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">Tipo</th>
                <th className="px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">Ordem</th>
                <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{product.title}</p>
                    {product.description && (
                      <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{product.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {product.content_type === 'video' ? 'Vídeo' : 'Download'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 hidden sm:table-cell">{product.sort_order}</td>
                  <td className="px-6 py-4">
                    <form action={toggleProductActive.bind(null, product.id, !product.is_active)}>
                      <button
                        type="submit"
                        className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${
                          product.is_active
                            ? 'bg-gold-50 text-gold-700 hover:bg-yellow-50 hover:text-yellow-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gold-50 hover:text-gold-700'
                        }`}
                      >
                        {product.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </form>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 justify-end">
                      <Link
                        href={`/admin/produtos/${product.id}`}
                        className="text-sm text-gold-600 hover:text-gold-800 font-medium transition"
                      >
                        Editar
                      </Link>
                      <DeleteProductButton id={product.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="font-medium">Nenhum produto cadastrado.</p>
            <p className="text-sm mt-1">Crie o primeiro produto para começar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
