import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProductCard } from '@/components/ProductCard'
import { Product } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: products }, { data: accesses }] = await Promise.all([
    supabase.from('products').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('user_products').select('product_id').eq('user_id', user.id),
  ])

  const unlockedIds = new Set(accesses?.map((a) => a.product_id) ?? [])
  const allProducts: Product[] = products ?? []
  const unlockedCount = allProducts.filter((p) => unlockedIds.has(p.id)).length

  return (
    <div>
      {/* Cabeçalho da página */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meus conteúdos</h1>
        {allProducts.length > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            {unlockedCount === allProducts.length
              ? 'Você tem acesso a todos os conteúdos.'
              : `${unlockedCount} de ${allProducts.length} conteúdos desbloqueados.`}
          </p>
        )}
      </div>

      {/* Grid de produtos */}
      {allProducts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">Nenhum conteúdo disponível ainda.</p>
          <p className="text-sm mt-1">Os produtos aparecerão aqui quando forem publicados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              unlocked={unlockedIds.has(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
