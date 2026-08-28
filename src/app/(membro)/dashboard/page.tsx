import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { BannerList } from '@/components/BannerList'
import { OfertaCard } from '@/components/OfertaCard'
import { WelcomeModal } from '@/components/WelcomeModal'
import { getLevelInfo } from '@/lib/xp'
import { getSiteConfig } from '@/lib/branding'
import { isAccessExpired } from '@/lib/entitlement'
import { Banner } from '@/types'

interface AccessedProduct {
  id: string
  title: string
  description: string
  banner_url: string | null
  content_type: string
  buy_url: string | null
  is_active: boolean
  is_featured: boolean
}

export default async function DashboardPage() {
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

  const [{ data: bannersData }, { data: cohortMembership }, { data: offersData }, siteConfig, { data: profileData }, { data: xpData }, { data: accessRows }, { count: lessonsCompleted }] = await Promise.all([
    adminClient.from('banners').select('*').eq('is_active', true).or(`expires_at.is.null,expires_at.gt.${now}`).order('sort_order'),
    adminClient.from('cohort_members').select('cohorts(id, name, description, starts_at, ends_at, products(title))').eq('user_id', targetUserId).limit(1).maybeSingle(),
    adminClient.from('offers').select('id, title, description, original_price, promo_price, coupon_code, ends_at, product_id, products(title, buy_url)').eq('is_active', true).or(`ends_at.is.null,ends_at.gt.${now}`).order('sort_order'),
    getSiteConfig(),
    adminClient.from('profiles').select('name, welcome_seen_at, last_lesson_id').eq('id', targetUserId).single(),
    adminClient.from('user_xp_totals').select('total_xp').eq('user_id', targetUserId).maybeSingle(),
    adminClient.from('user_products').select('product_id, expires_at, products(id, title, description, banner_url, content_type, buy_url, is_active, is_featured)').eq('user_id', targetUserId),
    supabase.from('lesson_progress').select('*', { count: 'exact', head: true }).eq('user_id', targetUserId),
  ])

  const banners = (bannersData ?? []) as Banner[]
  const cohort = cohortMembership
    ? (Array.isArray(cohortMembership.cohorts) ? cohortMembership.cohorts[0] : cohortMembership.cohorts)
    : null

  const platformName = siteConfig.platform_name || 'Thiago Cantalovo'
  const welcomeMessage = siteConfig['welcome_message']
    || 'Todo o conteúdo abaixo foi preparado para ajudar você na sua evolução. Bom estudo!'
  const firstName = (profileData?.name ?? '').trim().split(' ')[0] || 'aluno'
  const totalXp = (xpData as { total_xp?: number } | null)?.total_xp ?? 0
  const { cur: currentLevel, pct: levelPct } = getLevelInfo(totalXp)

  const showWelcome = targetUserId === user.id && !profileData?.welcome_seen_at

  // Acessos do membro -- uma query só, já traz o produto embutido (evita
  // buscar o catálogo inteiro só pra saber quantos/quais o membro tem).
  const accesses = (accessRows ?? []).map(row => ({
    productId: row.product_id as string,
    expiresAt: row.expires_at as string | null,
    product: (Array.isArray(row.products) ? row.products[0] : row.products) as AccessedProduct | null,
  }))
  const unlockedIds = new Set(accesses.map(a => a.productId))
  const availableCount = accesses.filter(a => a.product?.is_active && !isAccessExpired(a.expiresAt)).length
  const featuredProduct = accesses.find(a => a.product?.is_active && a.product?.is_featured && !isAccessExpired(a.expiresAt))?.product ?? null

  // Destaque comercial -- só um slot: oferta ativa relevante tem prioridade
  // sobre o produto em destaque; nunca os dois ao mesmo tempo.
  const activeOffer = (offersData ?? []).find(o => !o.product_id || !unlockedIds.has(o.product_id)) ?? null
  const activeOfferProduct = activeOffer
    ? (Array.isArray(activeOffer.products) ? activeOffer.products[0] : activeOffer.products)
    : null

  // Continue de onde parou -- última aula vista, se ainda não concluída e ainda acessível
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
    <div className="max-w-2xl mx-auto space-y-10">
      {showWelcome && <WelcomeModal firstName={firstName} platformName={platformName} />}

      {/* Saudação */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Olá, {firstName}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
          {welcomeMessage}
        </p>
      </div>

      {/* Continue de onde parou -- a próxima ação, quando existe */}
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

      {/* Meu progresso -- resumo; o detalhe completo vive em /progresso */}
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
            <p className="text-sm font-bold" style={{ color: 'var(--brand)' }}>
              {totalXp} XP · {lessonsCompleted ?? 0} {(lessonsCompleted ?? 0) === 1 ? 'aula' : 'aulas'}
            </p>
            <p className="text-[11px] text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition">Ver meu progresso</p>
          </div>
        </Link>
      )}

      {/* Novidades -- só aparece quando há algo não lido; some sozinho quando tudo é dispensado */}
      <BannerList banners={banners} />

      {/* Seus conteúdos -- resumo, não o catálogo. Descoberta completa é papel da Biblioteca. */}
      <Link
        href="/biblioteca"
        className="flex items-center gap-4 px-5 py-4 bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] hover:shadow-md transition group"
      >
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--brand-bg)' }}>
          <svg className="w-5 h-5" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white">{availableCount > 0 ? 'Seus conteúdos' : 'Explore a Biblioteca'}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {availableCount > 0
              ? `Você tem ${availableCount} ${availableCount === 1 ? 'conteúdo disponível' : 'conteúdos disponíveis'}.`
              : 'Encontre conteúdos para o momento que você está vivendo.'}
          </p>
        </div>
        <span
          className="shrink-0 text-sm font-semibold transition"
          style={{ color: 'var(--brand)' }}
        >
          Explorar biblioteca →
        </span>
      </Link>

      {/* Destaque comercial -- um único slot: oferta ativa tem prioridade sobre produto em destaque */}
      {activeOffer ? (
        <OfertaCard offer={{ ...activeOffer, products: activeOfferProduct ?? null }} />
      ) : featuredProduct ? (
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
                Explorar
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
