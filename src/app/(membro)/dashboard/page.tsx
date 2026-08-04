import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
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

  // Suporte a modo "ver como membro"
  const cookieStore = await cookies()
  const viewAsMemberId = cookieStore.get('view_as')?.value
  let targetUserId = user.id
  if (viewAsMemberId) {
    const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (me?.role === 'admin' || me?.role === 'equipe') targetUserId = viewAsMemberId
  }

  const [{ data: products }, { data: accesses }, { data: bannersData }, { data: certsData }, { data: cohortMembership }, { data: offersData }, { data: siteConfigData }, { data: profileData }] = await Promise.all([
    adminClient.from('products').select('*').eq('is_active', true).order('sort_order'),
    adminClient.from('user_products').select('product_id, expires_at, payment_status').eq('user_id', targetUserId),
    adminClient.from('banners').select('*').eq('is_active', true).or(`expires_at.is.null,expires_at.gt.${now}`).order('sort_order'),
    adminClient.from('certificates').select('id, product_id').eq('user_id', targetUserId),
    adminClient.from('cohort_members').select('cohorts(id, name, description, starts_at, ends_at, products(title))').eq('user_id', targetUserId).limit(1).maybeSingle(),
    adminClient.from('offers').select('id, title, description, original_price, promo_price, coupon_code, ends_at, product_id, products(title, buy_url)').eq('is_active', true).or(`ends_at.is.null,ends_at.gt.${now}`).order('sort_order'),
    adminClient.from('site_config').select('key, value').in('key', ['welcome_message']),
    adminClient.from('profiles').select('name, last_login_at').eq('id', targetUserId).single(),
  ])

  const banners = (bannersData ?? []) as Banner[]
  const certByProduct = Object.fromEntries((certsData ?? []).map(c => [c.product_id, c.id]))
  const cohort = cohortMembership
    ? (Array.isArray(cohortMembership.cohorts) ? cohortMembership.cohorts[0] : cohortMembership.cohorts)
    : null

  const siteConfig = Object.fromEntries((siteConfigData ?? []).map(r => [r.key, r.value]))
  const welcomeMessage = siteConfig['welcome_message']
    || 'Todo o conteúdo abaixo foi preparado para ajudar você na sua evolução. Bom estudo!'
  const firstName = (profileData?.name ?? '').trim().split(' ')[0] || 'aluno'

  const lastLoginAt = profileData?.last_login_at ? new Date(profileData.last_login_at) : null
  const lastLoginLabel = lastLoginAt && (() => {
    const isToday = lastLoginAt.toDateString() === new Date().toDateString()
    const time = lastLoginAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return isToday ? `Hoje às ${time}` : `${lastLoginAt.toLocaleDateString('pt-BR')} às ${time}`
  })()

  // Mapa de product_id → expires_at / payment_status
  type AccessRow = { product_id: string; expires_at?: string | null; payment_status?: string | null }
  const accessMap = new Map<string, string | null>(
    (accesses ?? []).map((a) => [a.product_id, (a as AccessRow).expires_at ?? null])
  )
  const paymentStatusMap = new Map<string, string | null>(
    (accesses ?? []).map((a) => [a.product_id, (a as AccessRow).payment_status ?? null])
  )
  const unlockedIds = new Set(accessMap.keys())

  // Mostrar ofertas apenas para produtos que o membro ainda não tem
  const visibleOffers = (offersData ?? []).filter(o =>
    !o.product_id || !unlockedIds.has(o.product_id)
  )
  const allProducts: Product[] = products ?? []
  const myProducts = allProducts.filter((p) => unlockedIds.has(p.id))
  const storeProducts = allProducts.filter((p) => !unlockedIds.has(p.id))
  const hasActiveSubscription = myProducts.some(p => p.billing_cycle && paymentStatusMap.get(p.id) === 'confirmed')

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
  const featuredProduct = myProducts.find(p => p.is_featured) ?? null

  // Calcula contagem de aulas (todos os produtos, pra mostrar no card mesmo bloqueado) e progresso (só desbloqueados)
  const progressByProduct: Record<string, { total: number; completed: number }> = {}
  const isCourseByProduct: Record<string, boolean> = {}
  if (allProducts.length > 0) {
    const allProductIds = allProducts.map(p => p.id)

    const [{ data: allModules }, { data: userProgress }] = await Promise.all([
      supabase.from('modules').select('id, product_id').in('product_id', allProductIds),
      supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id),
    ])

    const moduleIds = allModules?.map(m => m.id) ?? []
    const moduleToProduct = Object.fromEntries(allModules?.map(m => [m.id, m.product_id]) ?? [])
    for (const pid of allProductIds) {
      isCourseByProduct[pid] = (allModules ?? []).some(m => m.product_id === pid)
    }

    if (moduleIds.length > 0) {
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id, module_id')
        .in('module_id', moduleIds)
        .eq('is_published', true)

      const completedSet = new Set(userProgress?.map(p => p.lesson_id) ?? [])

      for (const pid of allProductIds) {
        const lessons = allLessons?.filter(l => moduleToProduct[l.module_id] === pid) ?? []
        progressByProduct[pid] = {
          total: lessons.length,
          completed: lessons.filter(l => completedSet.has(l.id)).length,
        }
      }
    }
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Olá, {firstName} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-xl">
          {welcomeMessage}
        </p>
        {(myProducts.length > 0 || hasActiveSubscription || lastLoginLabel) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500 dark:text-gray-400">
            {myProducts.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--brand)' }} />
                {myProducts.length} {myProducts.length === 1 ? 'conteúdo liberado' : 'conteúdos liberados'}
              </span>
            )}
            {hasActiveSubscription && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Assinatura ativa
              </span>
            )}
            {lastLoginLabel && (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                Último acesso: {lastLoginLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo em destaque */}
      {featuredProduct && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Em destaque</h2>
          <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1e2030] bg-card sm:flex">
            {featuredProduct.banner_url && (
              <div className="sm:w-2/5 aspect-video sm:aspect-auto overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featuredProduct.banner_url} alt={featuredProduct.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 p-6 flex flex-col justify-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">{featuredProduct.title}</h3>
              {featuredProduct.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{featuredProduct.description}</p>
              )}
              <Link
                href={`/produto/${featuredProduct.id}`}
                className="inline-flex items-center gap-2 self-start px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition hover:opacity-90"
                style={{ backgroundColor: 'var(--brand)' }}
              >
                {(progressByProduct[featuredProduct.id]?.completed ?? 0) > 0 ? 'Continuar' : 'Começar agora'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

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
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030]">
              <p className="text-lg font-medium">Você ainda não tem nenhum conteúdo.</p>
              <p className="text-sm mt-1">Confira os conteúdos disponíveis abaixo.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {myGroups.map(({ label, products: group }) => (
                <div key={label ?? '_all'}>
                  {label && (
                    <h2 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: 'var(--brand)' }} />
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
                        isCourse={isCourseByProduct[product.id] ?? false}
                        lessonCount={progressByProduct[product.id]?.total ?? 0}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Conteúdos exclusivos — produtos bloqueados */}
      {storeProducts.length > 0 && tab !== 'meus' && (
        <section id="disponiveis">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Conteúdos exclusivos</h2>
          <div className="space-y-8">
            {storeGroups.map(({ label, products: group }) => (
              <div key={label ?? '_store'}>
                {label && (
                  <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: 'var(--brand)' }} />
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
                      isCourse={isCourseByProduct[product.id] ?? false}
                      lessonCount={progressByProduct[product.id]?.total ?? 0}
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

      {/* Novidades */}
      {banners.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Novidades</h2>
          <BannerList banners={banners} />
        </section>
      )}
    </div>
  )
}
