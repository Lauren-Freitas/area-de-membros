import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Product, Module, Lesson } from '@/types'
import { ProductCompleteButton } from '@/components/ProductCompleteButton'
import { ProductRating } from '@/components/ProductRating'
import { ProductComments } from '@/components/ProductComments'
import { LessonVideoPlayer } from '@/components/LessonVideoPlayer'
import { computeReleaseState } from '@/lib/release'

export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: product }, { data: access }, { data: modules }, { data: progressRows }, { data: certificate }, { data: profile }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).eq('is_active', true).single(),
    supabase.from('user_products').select('id, is_completed, granted_at').eq('user_id', user.id).eq('product_id', id).single(),
    supabase.from('modules').select('*, lessons(*)').eq('product_id', id).order('sort_order'),
    supabase.from('lesson_progress').select('lesson_id').eq('user_id', user.id),
    supabase.from('certificates').select('id').eq('user_id', user.id).eq('product_id', id).maybeSingle(),
    supabase.from('profiles').select('role, name, avatar_url').eq('id', user.id).single(),
  ])

  if (!product || !access) redirect('/dashboard')

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

  const myRating = ratingResult.data?.rating ?? null
  type CommentRow = { id: string; content: string; created_at: string; user_id: string; profiles: { name: string } | null }
  const comments: CommentRow[] = (commentsResult.data as CommentRow[] | null) ?? []

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar para meus conteúdos
      </Link>

      {/* Título e descrição ficam acima apenas quando há módulos (visão de curso) */}
      {hasPublishedLessons && (
        <>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{p.title}</h1>
          {p.description && <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{p.description}</p>}
        </>
      )}

      {/* Banner de certificado */}
      {certificate && (
        <div className="mb-6 flex items-center justify-between gap-4 px-5 py-4 rounded-xl border" style={{ backgroundColor: 'var(--brand-bg)', borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--brand-text)' }}>Curso concluído! Parabéns!</p>
              <p className="text-xs" style={{ color: '#9a7230' }}>Seu certificado está disponível.</p>
            </div>
          </div>
          <a
            href={`/certificado/${certificate.id}`}
            className="shrink-0 px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            Ver certificado
          </a>
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

            return (
              <div key={mod.id} className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 dark:border-[#1e2030]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Módulo {idx + 1}</p>
                      <h2 className="font-bold text-gray-900 dark:text-white">{mod.title}</h2>
                      {mod.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{mod.description}</p>}
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

      {/* Comentários + Ações */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4 items-start">
        <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
          <ProductComments
            productId={productId}
            currentUserId={userId}
            isAdmin={isAdmin}
            initialComments={comments}
            userInitials={userInitials}
            userAvatarUrl={userAvatarUrl}
          />
        </div>

        <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5 flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Avaliação</p>
            <ProductRating productId={productId} initialRating={myRating} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Progresso</p>
            <ProductCompleteButton
            productId={productId}
            completed={isCompleted}
            completionEventKey={`product-complete:${productId}`}
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
        <a href={data.signedUrl} download className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-lg transition hover:opacity-90" style={{ backgroundColor: 'var(--brand)' }}>
          Baixar arquivo
        </a>
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
