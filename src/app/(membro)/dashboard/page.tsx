import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { ProductCard } from '@/components/ProductCard'
import { BannerList } from '@/components/BannerList'
import { OfertaCard } from '@/components/OfertaCard'
import { WelcomeModal } from '@/components/WelcomeModal'
import { getLevelInfo } from '@/lib/xp'
import { getSiteConfig } from '@/lib/branding'
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

  const [{ data: products }, { data: accesses }, { data: bannersData }, { data: certsData }, { data: cohortMembership }, { data: offersData }, siteConfig, { data: profileData }, { data: xpData }] = await Promise.all([
    adminClient.from('products').select('*').eq('is_active', true).order('sort_order'),
    adminClient.from('user_products').select('product_id, expires_at, payment_status').eq('user_id', targetUserId),
    adminClient.from('banners').select('*').eq('is_active', true).or(`expires_at.is.null,expires_at.gt.${now}`).order('sort_order'),
    adminClient.from('certificates').select('id, product_id').eq('user_id', targetUserId),
    adminClient.from('cohort_members').select('cohorts(id, name, description, starts_at, ends_at, products(title))').eq('user_id', targetUserId).limit(1).maybeSingle(),
    adminClient.from('offers').select('id, title, description, original_price, promo_price, coupon_code, ends_at, product_id, products(title, buy_url)').eq('is_active', true).or(`ends_at.is.null,ends_at.gt.${now}`).order('sort_order'),
    getSiteConfig(),
    adminClient.from('profiles').select('name, last_login_at, welcome_seen_at, last_lesson_id, last_lesson_viewed_at').eq('id', targetUserId).single(),
    adminClient.from('user_xp_totals').select('total_xp').eq('user_id', targetUserId).maybeSingle(),
  ])

  const banners = (bannersData ?? []) as Banner[]
  const certByProduct = Object.fromEntries((certsData ?? []).map(c => [c.product_id, c.id]))
  const cohort = cohortMembership
    ? (Array.isArray(cohortMembership.cohorts) ? cohortMembership.cohorts[0] : cohortMembership.cohorts)
    : null

  const welcomeMessage = siteConfig['welcome_message']
    || 'Todo o conteúdo abaixo foi preparado para ajudar você na sua evolução. Bom estudo!'
  const firstName = (profileData?.name ?? '').trim().split(' ')[0] || 'aluno'
  const totalXp = (xpData as { total_xp?: number } | null)?.total_xp ?? 0
  const { cur: currentLevel, pct: levelPct } = getLevelInfo(totalXp)

  const showWelcome = targetUserId === user.id && !profileData?.welcome_seen_at

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

  // Continue de onde parou — última aula vista, se ainda não concluída e ainda acessível
  let continueLesson: { id: string; title: string; productId: string; productTitle: string; bannerUrl: string | null } | null = null
  if (targetUserId === user.id && profileData?.last_lesson_id) {
    const { data: lessonRow } = await supabase
      .from('lessons')
      .select('id, title, is_published, modules(product_id, products(title, banner_url))')
      .eq('id', profileData.last_lesson_id)
      .eq('is_published', true)
      .maybeSingle()

    if (lessonRow) {
      const mod = Array.isArray(lessonRow.modules) ? lessonRow.modules[0] : lessonRow.modules
      const prod = mod ? (Array.isArray(mod.products) ? mod.products[0] : mod.products) : null
      const { data: prog } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('lesson_id', profileData.last_lesson_id)
        .maybeSingle()

      if (mod && prod && unlockedIds.has(mod.product_id) && !prog) {
        continueLesson = {
          id: lessonRow.id,
          title: lessonRow.title,
          productId: mod.product_id,
          productTitle: prod.title,
          bannerUrl: prod.banner_url ?? null,
        }
      }
    }
  }

  return (
    <div className="space-y-12">
      {showWelcome && <WelcomeModal firstName={firstName} />}

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

      {/* Novidades — só aparece quando há algo não lido; some sozinho quando tudo é dispensado */}
      <BannerList banners={banners} />

      {/* Continue de onde parou */}
      {continueLesson && (
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Continue de onde parou</h2>
          <Link
            href={`/produto/${continueLesson.productId}/aula/${continueLesson.id}`}
            className="rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1e2030] bg-card flex items-center gap-4 p-4 hover:shadow-md transition group"
          >
            {continueLesson.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={continueLesson.bannerUrl} alt={continueLesson.productTitle} className="w-20 h-20 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: 'var(--brand-bg)' }}>
                <svg className="w-8 h-8" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-2.72a.75.75 0 011.28.53v7.38a.75.75 0 01-1.28.53l-4.72-2.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-7.5A2.25 2.25 0 0013.5 6.75h-9A2.25 2.25 0 002.25 9v7.5a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5 truncate">{continueLesson.productTitle}</p>
              <p className="font-semibold text-gray-900 dark:text-white truncate">{continueLesson.title}</p>
            </div>
            <span
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition group-hover:opacity-90"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </span>
          </Link>
        </section>
      )}

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
              <Button href={`/produto/${featuredProduct.id}`} className="self-start">
                {(progressByProduct[featuredProduct.id]?.completed ?? 0) > 0 ? 'Continuar' : 'Começar agora'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Card de turma */}
      {cohort && (
        <div className="flex items-start gap-4 px-5 py-4 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/40">
          <span className="text-2xl mt-0.5">🏫</span>
          <div>
            <p className="font-semibold text-sm text-blue-900 dark:text-blue-200">Você faz parte da turma: <strong>{cohort.name}</strong></p>
            {cohort.description && <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">{cohort.description}</p>}
            {(cohort.starts_at || cohort.ends_at) && (
              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Meus conteúdos</h2>

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

      {/* Meu progresso — compacto, secundário ao conteúdo, linka pro perfil completo */}
      {totalXp > 0 && (
        <Link
          href="/progresso"
          className="flex items-center gap-4 px-5 py-4 bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] hover:shadow-md transition group"
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            Nv.{currentLevel.level}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{currentLevel.label}</p>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mt-1.5 max-w-xs">
              <div
                className="h-full rounded-full"
                style={{ width: `${levelPct}%`, background: 'linear-gradient(90deg, var(--brand), #f5c842)' }}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold" style={{ color: 'var(--brand)' }}>{totalXp} XP</p>
            <p className="text-[11px] text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition">Ver perfil</p>
          </div>
        </Link>
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
