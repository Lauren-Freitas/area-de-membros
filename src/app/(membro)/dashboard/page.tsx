import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { ProductCard } from '@/components/ProductCard'
import { BannerList } from '@/components/BannerList'
import { OfertaCard } from '@/components/OfertaCard'
import { Product, Banner } from '@/types'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  const [{ data: products }, { data: accesses }, { data: bannersData }, { data: certsData }, { data: cohortMembership }, { data: offersData }, { data: siteConfigData }] = await Promise.all([
    supabase.from('products').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('user_products').select('product_id, expires_at').eq('user_id', user.id),
    adminClient.from('banners').select('*').eq('is_active', true).or(`expires_at.is.null,expires_at.gt.${now}`).order('sort_order'),
    supabase.from('certificates').select('id, product_id').eq('user_id', user.id),
    adminClient.from('cohort_members').select('cohorts(id, name, description, starts_at, ends_at, products(title))').eq('user_id', user.id).limit(1).maybeSingle(),
    adminClient.from('offers').select('id, title, description, original_price, promo_price, coupon_code, ends_at, product_id, products(title, buy_url)').eq('is_active', true).or(`ends_at.is.null,ends_at.gt.${now}`).order('sort_order'),
    adminClient.from('site_config').select('key, value').in('key', ['welcome_message']),
  ])

  const banners = (bannersData ?? []) as Banner[]
  const certByProduct = Object.fromEntries((certsData ?? []).map(c => [c.product_id, c.id]))
  const cohort = cohortMembership
    ? (Array.isArray(cohortMembership.cohorts) ? cohortMembership.cohorts[0] : cohortMembership.cohorts)
    : null

  const siteConfig = Object.fromEntries((siteConfigData ?? []).map(r => [r.key, r.value]))
  const welcomeMessage = siteConfig['welcome_message'] ?? ''

  // Mapa de product_id → expires_at
  const accessMap = new Map<string, string | null>(
    (accesses ?? []).map((a) => [a.product_id, (a as { product_id: string; expires_at?: string | null }).expires_at ?? null])
  )
  const unlockedIds = new Set(accessMap.keys())

  // Mostrar ofertas apenas para produtos que o membro ainda não tem
  const visibleOffers = (offersData ?? []).filter(o =>
    !o.product_id || !unlockedIds.has(o.product_id)
  )
  const allProducts: Product[] = products ?? []
  const myProducts = allProducts.filter((p) => unlockedIds.has(p.id))
  const storeProducts = allProducts.filter((p) => !unlockedIds.has(p.id))

  // Agrupamento por categoria (se houver algum produto com categoria definida)
  const hasCategories = allProducts.some(p => p.category)
  function groupByCategory(items: Product[]): { label: string | null; products: Product[] }[] {
    if (!hasCategories) return [{ label: null, products: items }]
    const map = new Map<string, Product[]>()
    for (const p of items) {
      const key = p.category ?? 'Outros'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return Array.from(map.entries()).map(([label, products]) => ({ label, products }))
  }
  const myGroups = groupByCategory(myProducts)
  const storeGroups = groupByCategory(storeProducts)

  // Calcula progresso para produtos desbloqueados
  const progressByProduct: Record<string, { total: number; completed: number }> = {}
  if (myProducts.length > 0) {
    const myProductIds = myProducts.map(p => p.id)

    const [{ data: allModules }, { data: userProgress }] = await Promise.all([
      supabase.from('modules').select('id, product_id').in('product_id', myProductIds),
      supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id),
    ])

    const moduleIds = allModules?.map(m => m.id) ?? []
    if (moduleIds.length > 0) {
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id, module_id')
        .in('module_id', moduleIds)
        .eq('is_published', true)

      const completedSet = new Set(userProgress?.map(p => p.lesson_id) ?? [])
      const moduleToProduct = Object.fromEntries(allModules?.map(m => [m.id, m.product_id]) ?? [])

      for (const pid of myProductIds) {
        const lessons = allLessons?.filter(l => moduleToProduct[l.module_id] === pid) ?? []
        progressByProduct[pid] = {
          total: lessons.length,
          completed: lessons.filter(l => completedSet.has(l.id)).length,
        }
      }
    }
  }

  return (
    <div className="space-y-10">
      {welcomeMessage && (
        <p className="text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-[#0d1020] px-5 py-3 rounded-xl border border-gray-100 dark:border-[#1e2030]">
          {welcomeMessage}
        </p>
      )}
      <BannerList banners={banners} />

      {/* Card de turma */}
      {cohort && (
        <div className="flex items-start gap-4 px-5 py-4 rounded-xl border" style={{ backgroundColor: '#f0f7ff', borderColor: '#bfdbfe' }}>
          <span className="text-2xl mt-0.5">🏫</span>
          <div>
            <p className="font-semibold text-sm text-blue-900">Você faz parte da turma: <strong>{cohort.name}</strong></p>
            {cohort.description && <p className="text-xs text-blue-700 mt-0.5">{cohort.description}</p>}
            {(cohort.starts_at || cohort.ends_at) && (
              <p className="text-xs text-blue-500 mt-1">
                {cohort.starts_at && `Início: ${new Date(cohort.starts_at).toLocaleDateString('pt-BR')}`}
                {cohort.starts_at && cohort.ends_at && ' · '}
                {cohort.ends_at && `Encerramento: ${new Date(cohort.ends_at).toLocaleDateString('pt-BR')}`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Meus conteúdos — apenas produtos desbloqueados */}
      {tab !== 'disponiveis' && (
        <section id="meus-conteudos">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Meus conteúdos</h1>

          {myProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030]">
              <p className="text-lg font-medium">Você ainda não tem nenhum conteúdo.</p>
              <p className="text-sm mt-1">Confira os conteúdos disponíveis abaixo.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {myGroups.map(({ label, products: group }) => (
                <div key={label ?? '_all'}>
                  {label && (
                    <h2 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: '#b48840' }} />
                      {label}
                    </h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {group.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        unlocked={true}
                        expiresAt={accessMap.get(product.id) ?? null}
                        progress={progressByProduct[product.id] ?? null}
                        certificateId={certByProduct[product.id] ?? null}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Disponíveis para compra — produtos bloqueados */}
      {storeProducts.length > 0 && tab !== 'meus' && (
        <section id="disponiveis">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Disponíveis para compra</h2>
          <div className="space-y-8">
            {storeGroups.map(({ label, products: group }) => (
              <div key={label ?? '_store'}>
                {label && (
                  <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: '#b48840' }} />
                    {label}
                  </h3>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      unlocked={false}
                      expiresAt={null}
                      progress={null}
                      certificateId={null}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ofertas relâmpago */}
      {visibleOffers.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">⚡ Ofertas especiais</h2>
          <div className="space-y-4">
            {visibleOffers.map((offer) => {
              const product = Array.isArray(offer.products) ? offer.products[0] : offer.products
              return (
                <OfertaCard
                  key={offer.id}
                  offer={{ ...offer, products: product ?? null }}
                />
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
