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
  const myProducts = allProducts.filter((p) => unlockedIds.has(p.id))
  const storeProducts = allProducts.filter((p) => !unlockedIds.has(p.id))

  return (
    <div className="space-y-10">
      {/* Meus conteúdos */}
      <section>
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus conteúdos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {myProducts.length === 0
              ? 'Você ainda não tem nenhum conteúdo desbloqueado.'
              : `${myProducts.length} conteúdo${myProducts.length !== 1 ? 's' : ''} disponível${myProducts.length !== 1 ? 'is' : ''}.`}
          </p>
        </div>

        {myProducts.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
            <p className="font-medium">Nenhum conteúdo desbloqueado ainda.</p>
            <p className="text-sm mt-1">Confira os produtos disponíveis abaixo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {myProducts.map((product) => (
              <ProductCard key={product.id} product={product} unlocked={true} />
            ))}
          </div>
        )}
      </section>

      {/* Vitrine — produtos não adquiridos */}
      {storeProducts.length > 0 && (
        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Também disponível para você</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Conteúdos que você ainda pode adquirir.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {storeProducts.map((product) => (
              <ProductCard key={product.id} product={product} unlocked={false} />
            ))}
          </div>
        </section>
      )}

      {allProducts.length === 0 && (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <p className="text-lg font-medium">Nenhum conteúdo disponível ainda.</p>
          <p className="text-sm mt-1">Os produtos aparecerão aqui quando forem publicados.</p>
        </div>
      )}
    </div>
  )
}
