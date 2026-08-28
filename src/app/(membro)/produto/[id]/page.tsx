import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Product, Module, Lesson } from '@/types'
import { Button } from '@/components/Button'
import { CompleteButton } from '@/components/CompleteButton'
import { StarRating } from '@/components/StarRating'
import { rateProduct, markProductComplete, unmarkProductComplete, addProductComment, deleteProductComment } from '@/lib/actions/product-actions'
import { CommentThread } from '@/components/CommentThread'
import { LessonVideoPlayer } from '@/components/LessonVideoPlayer'
import { computeReleaseState } from '@/lib/release'
import { isAccessExpired } from '@/lib/entitlement'

export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: product }, { data: access }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).eq('is_active', true).single(),
    supabase.from('user_products').select('id, is_completed, granted_at, expires_at').eq('user_id', user.id).eq('product_id', id).maybeSingle(),
  ])

  if (!product) redirect('/dashboard')

  const expired = access ? isAccessExpired((access as { expires_at: string | null }).expires_at) : false

  // Sem acesso (ou acesso expirado): prévia in-app (banner, descrição, motivo do bloqueio, CTA de
  // compra/renovação) em vez de sair direto pro WhatsApp/checkout sem mostrar nada da plataforma,
  // e nunca servir o conteúdo em si — a checagem real é feita aqui, não só escondida na Home.
  if (!access || expired) {
    const { data: previewModules } = await supabase.from('modules').select('id, lessons(id, is_published)').eq('product_id', id)
    const isCourse = (previewModules ?? []).length > 0
    const lessonCount = (previewModules ?? []).reduce((acc, m) => acc + (m.lessons?.filter((l: { is_published: boolean }) => l.is_published).length ?? 0), 0)
    return <ProductPreview product={product as Product} isCourse={isCourse} lessonCount={lessonCount} isExpired={expired} />
  }

  const [{ data: modules }, { data: progressRows }, { data: certificate }, { data: profile }] = await Promise.all([
    supabase.from('modules').select('*, lessons(*)').eq('product_id', id).order('sort_order'),
    supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id),
    supabase.from('certificates').select('id').eq('user_id', user.id).eq('product_id', id).maybeSingle(),
    supabase.from('profiles').select('role, name, avatar_url').eq('id', user.id).single(),
  ])

  // Dados extras para produtos sem módulos (carregados condicionalmente)
  const totalLessonsCheck = (modules ?? []).reduce((acc: number, m: { lessons?: { is_published: boolean }[] }) => acc + (m.lessons?.filter((l: { is_published: boolean }) => l.is_published).length ?? 0), 0)
  const needsSimpleView = totalLessonsCheck === 0

  const [ratingResult, commentsResult] = needsSimpleView
    ? await Promise.all([
        supabase.from('product_ratings').select('rating').eq('user_id', user.id).eq('product_id', id).maybeSingle(),
        supabase.from('product_comments').select('id, content, created_at, user_id, profiles(name)').eq('product_id', id).order('created_at', { ascending: true }),
      ])
    : [{ data: null, error: null }, { data: null, error: null }]

  const p = product as Product
  const grantedAt = (access as { granted_at?: string | null }).granted_at ?? null
  const now = new Date()
  const mods = ((modules ?? []) as (Module & { lessons: Lesson[] })[])
    .filter(m => computeReleaseState({
      releaseType: m.release_type, releaseAfterDays: m.release_after_days, releaseAt: m.release_at, grantedAt, now,
    }).isReleased)
    .map(m => ({
      ...m,
      lessons: (m.lessons ?? []).filter(l => {
        if (!l.is_published) return false
        const state = computeReleaseState({
          releaseType: l.release_type, releaseAfterDays: l.release_after_days, releaseAt: l.release_at,
          accessDurationDays: l.access_duration_days, grantedAt, now,
        })
        return state.isReleased && !state.isExpired
      }),
    }))
  const completedSet = new Set(progressRows?.map(r => r.lesson_id) ?? [])
  const isAdmin = profile?.role === 'admin' || profile?.role === 'equipe'
  const isProductCompleted = (access as { is_completed?: boolean | null })?.is_completed ?? false
  const userInitials = (profile as { name?: string } | null)?.name
    ? (profile as { name: string }).name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : 'EU'
  const userAvatarUrl = (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null

  const totalLessons = mods.reduce((acc, m) => acc + (m.lessons?.filter(l => l.is_published).length ?? 0), 0)
  const completedLessons = mods.reduce((acc, m) => {
    return acc + (m.lessons?.filter(l => l.is_published && completedSet.has(l.id)).length ?? 0)
  }, 0)
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  const hasPublishedLessons = totalLessons > 0

  // Aula alvo do botão "Começar curso"/"Continuar curso": primeira não concluída, ou a primeira de todas
  const flatLessons = mods.flatMap(m => (m.lessons ?? []).filter(l => l.is_published).sort((a, b) => a.sort_order - b.sort_order))
  const nextLesson = flatLessons.find(l => !completedSet.has(l.id)) ?? flatLessons[0] ?? null

  // Arquivos disponíveis no curso inteiro (soma dos anexos de todas as aulas)
  let attachmentCount = 0
  if (flatLessons.length > 0) {
    const { count } = await supabase
      .from('lesson_attachments')
      .select('id', { count: 'exact', head: true })
      .in('lesson_id', flatLessons.map(l => l.id))
    attachmentCount = count ?? 0
  }

  const myRating = ratingResult.data?.rating ?? null
  type CommentRow = { id: string; content: string; created_at: string; user_id: string; profiles: { name: string } | null }
  const comments: CommentRow[] = (commentsResult.data as CommentRow[] | null) ?? []

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/biblioteca"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar para a Biblioteca
      </Link>

      {/* Painel do curso — visão geral + portão de entrada, só quando há módulos */}
      {hasPublishedLessons && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1e2030] bg-card">
          {p.banner_url && (
            <div className="aspect-[21/9] sm:aspect-[3/1] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.banner_url} alt={p.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{p.title}</h1>
            {p.description && <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 max-w-2xl">{p.description}</p>}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-5">
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                {mods.length} {mods.length === 1 ? 'módulo' : 'módulos'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-2.72a.75.75 0 011.28.53v7.38a.75.75 0 01-1.28.53l-4.72-2.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-7.5A2.25 2.25 0 0013.5 6.75h-9A2.25 2.25 0 002.25 9v7.5a2.25 2.25 0 002.25 2.25z" />
                </svg>
                {totalLessons} {totalLessons === 1 ? 'aula' : 'aulas'}
              </span>
              {attachmentCount > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                  {attachmentCount} {attachmentCount === 1 ? 'arquivo disponível' : 'arquivos disponíveis'}
                </span>
              )}
            </div>

            {nextLesson && (
              <Button href={`/produto/${id}/aula/${nextLesson.id}`}>
                {completedLessons > 0 ? 'Continuar curso' : 'Começar curso'}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Celebração de conclusão + certificado */}
      {certificate && (
        <div
          className="mb-6 rounded-2xl border px-6 py-8 text-center"
          style={{ backgroundColor: 'var(--brand-bg)', borderColor: 'var(--brand-border)' }}
        >
          <p className="text-4xl mb-2">🎉</p>
          <p className="text-xl font-bold mb-1" style={{ color: 'var(--brand-text)' }}>Parabéns!</p>
          <p className="text-sm mb-6" style={{ color: 'var(--brand-text)', opacity: 0.75 }}>Você concluiu este curso.</p>
          <Button href={`/certificado/${certificate.id}`}>
            Baixar certificado
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </Button>
        </div>
      )}

      {/* Barra de progresso geral */}
      {totalLessons > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span>{completedLessons} de {totalLessons} aulas concluídas</span>
            <span className="font-semibold" style={{ color: 'var(--brand)' }}>{overallPct}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%`, backgroundColor: 'var(--brand)' }}
            />
          </div>
        </div>
      )}

      {hasPublishedLessons ? (
        <div className="space-y-4">
          {mods.map((mod, idx) => {
            const lessons = [...(mod.lessons ?? [])].filter(l => l.is_published).sort((a, b) => a.sort_order - b.sort_order)
            const modCompleted = lessons.filter(l => completedSet.has(l.id)).length
            const modPct = lessons.length > 0 ? Math.round((modCompleted / lessons.length) * 100) : 0
            const modDone = lessons.length > 0 && modCompleted === lessons.length

            return (
              <div key={mod.id} className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 dark:border-[#1e2030]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2.5">
                      {lessons.length > 0 && (
                        modDone ? (
                          <span className="mt-1 shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#22c55e' }}>
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        ) : (
                          <span className="mt-1 shrink-0 w-4 h-4 rounded-full border-2 border-gray-200 dark:border-gray-600" />
                        )
                      )}
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Módulo {idx + 1}</p>
                        <h2 className="font-bold text-gray-900 dark:text-white">{mod.title}</h2>
                        {mod.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{mod.description}</p>}
                      </div>
                    </div>
                    {lessons.length > 0 && (
                      <span className="shrink-0 text-xs font-medium text-gray-400 mt-1">
                        {modCompleted}/{lessons.length}
                      </span>
                    )}
                  </div>
                  {lessons.length > 0 && (
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${modPct}%`, backgroundColor: 'var(--brand)' }}
                      />
                    </div>
                  )}
                </div>

                {lessons.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-gray-400">Nenhuma aula disponível ainda.</div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-gray-700">
                    {lessons.map((lesson, lidx) => {
                      const done = completedSet.has(lesson.id)
                      return (
                        <Link
                          key={lesson.id}
                          href={`/produto/${id}/aula/${lesson.id}`}
                          className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition group"
                        >
                          <span className="text-xs font-bold text-gray-300 dark:text-gray-500 w-5 shrink-0">{lidx + 1}</span>
                          <LessonTypeIcon type={lesson.lesson_type} />
                          <span className={`text-sm font-medium flex-1 group-hover:text-gray-900 dark:group-hover:text-white ${done ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                            {lesson.title}
                          </span>
                          {done ? (
                            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#22c55e' }}>
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          ) : (
                            <svg className="w-4 h-4 text-gray-300 dark:text-gray-500 group-hover:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <SimpleProductView
          product={p}
          productId={id}
          userId={user.id}
          isAdmin={isAdmin}
          isCompleted={isProductCompleted}
          myRating={myRating}
          comments={comments}
          userInitials={userInitials}
          userAvatarUrl={userAvatarUrl}
          title={p.title}
          description={p.description ?? null}
        />
      )}
    </div>
  )
}

function ProductPreview({ product, isCourse, lessonCount, isExpired }: { product: Product; isCourse: boolean; lessonCount: number; isExpired: boolean }) {
  const typeLabel = isCourse ? 'Curso' : product.content_type === 'video' ? 'Vídeo' : 'Arquivo'
  const buyTarget = product.buy_url
    ?? `https://wa.me/5561991900589?text=${encodeURIComponent(`Olá! Tenho interesse em: ${product.title}`)}`

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/biblioteca"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar para a Biblioteca
      </Link>

      <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1e2030] bg-card">
        <div
          className="relative aspect-video overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--brand-bg) 0%, var(--brand-border) 100%)' }}
        >
          {product.banner_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.banner_url} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 opacity-40" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {product.content_type === 'video' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-2.72a.75.75 0 011.28.53v7.38a.75.75 0 01-1.28.53l-4.72-2.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-7.5A2.25 2.25 0 0013.5 6.75h-9A2.25 2.25 0 002.25 9v7.5a2.25 2.25 0 002.25 2.25z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                )}
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
            <svg className="w-10 h-10 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
        </div>

        <div className="p-6 sm:p-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--brand)' }}>
            {typeLabel}{isCourse && lessonCount > 0 ? ` · ${lessonCount} ${lessonCount === 1 ? 'aula' : 'aulas'}` : ''}
          </p>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{product.title}</h1>
          {product.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">{product.description}</p>
          )}

          <div className="inline-flex flex-col items-center gap-3 px-6 py-5 rounded-xl bg-gray-50 dark:bg-[#12162a] max-w-sm">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{isExpired ? 'Acesso expirado' : 'Conteúdo exclusivo'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isExpired ? 'Seu acesso a este conteúdo expirou.' : 'Você ainda não tem acesso a este conteúdo.'}
            </p>
            <Button href={buyTarget}>
              {isExpired ? 'Renovar acesso' : 'Adquirir'}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

type CommentRow = { id: string; content: string; created_at: string; user_id: string; profiles: { name: string } | null }

function SimpleProductView({
  product, productId, userId, isAdmin, isCompleted, myRating, comments, userInitials, userAvatarUrl, title, description,
}: {
  product: Product
  productId: string
  userId: string
  isAdmin: boolean
  isCompleted: boolean
  myRating: number | null
  comments: CommentRow[]
  userInitials: string
  userAvatarUrl: string | null
  title: string
  description: string | null
}) {
  return (
    <div className="space-y-4">
      {/* Conteúdo principal */}
      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] overflow-hidden">
        {product.content_type === 'video' ? (
          <LessonVideoPlayer
            url={product.content_url}
            progressPct={isCompleted ? 100 : 0}
            prevHref={null}
            nextHref={null}
            completionEventKey={`product-complete:${productId}`}
          />
        ) : (
          <FileContent productId={product.id} title={product.title} />
        )}
      </div>

      {/* Título e descrição — abaixo do vídeo */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{description}</p>}
      </div>

      {/* Barra de progresso — mesmo em conteúdo único (sem módulos/aulas) */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
          <span>{isCompleted ? 'Concluído' : 'Não concluído'}</span>
          <span className="font-semibold" style={{ color: 'var(--brand)' }}>{isCompleted ? 100 : 0}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: isCompleted ? '100%' : '0%', backgroundColor: 'var(--brand)' }}
          />
        </div>
      </div>

      {/* Comentários + Ações */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4 items-start">
        <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
          <CommentThread
            currentUserId={userId}
            isAdmin={isAdmin}
            initialComments={comments}
            userInitials={userInitials}
            userAvatarUrl={userAvatarUrl}
            onSubmit={addProductComment.bind(null, productId)}
            onDelete={deleteProductComment.bind(null, productId)}
          />
        </div>

        <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5 flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Avaliação</p>
            <StarRating initialRating={myRating} onRate={rateProduct.bind(null, productId)} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Progresso</p>
            <CompleteButton
              completed={isCompleted}
              onComplete={markProductComplete.bind(null, productId)}
              onIncomplete={unmarkProductComplete.bind(null, productId)}
              completionEventKey={`product-complete:${productId}`}
              fullWidth
            />
          </div>
        </div>
      </div>
    </div>
  )
}

async function FileContent({ productId, title }: { productId: string; title: string }) {
  const supabase = await createClient()
  const { data } = await supabase.storage.from('produtos').createSignedUrl(`${productId}/arquivo`, 3600)
  return (
    <div className="p-8 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-bg)' }}>
        <svg className="w-8 h-8" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 mt-1">Clique para baixar o arquivo</p>
      </div>
      {data?.signedUrl ? (
        <Button href={data.signedUrl} download>
          Baixar arquivo
        </Button>
      ) : (
        <p className="text-sm text-red-500">Arquivo não encontrado.</p>
      )}
    </div>
  )
}

const LESSON_TYPE_PATHS: Record<string, string> = {
  video: 'M15.75 10.5l4.72-2.72a.75.75 0 011.28.53v7.38a.75.75 0 01-1.28.53l-4.72-2.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-7.5A2.25 2.25 0 0013.5 6.75h-9A2.25 2.25 0 002.25 9v7.5a2.25 2.25 0 002.25 2.25z',
  text: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12h7.5m-7.5 3h7.5m-7.5-6h.75m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  file: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  link: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244',
}

function LessonTypeIcon({ type }: { type: string }) {
  const d = LESSON_TYPE_PATHS[type] ?? LESSON_TYPE_PATHS.file
  return (
    <span
      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
      style={{ backgroundColor: 'var(--brand-bg)' }}
    >
      <svg className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      </svg>
    </span>
  )
}
