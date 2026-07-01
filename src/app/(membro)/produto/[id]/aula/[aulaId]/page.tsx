import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lesson } from '@/types'
import { LessonCompleteButton } from '@/components/LessonCompleteButton'
import { LessonComments } from '@/components/LessonComments'
import { LessonSidebar } from '@/components/LessonSidebar'
import { VideoFocusLesson } from '@/components/VideoFocusLesson'
import { LessonRating } from '@/components/LessonRating'
import { LessonComment } from '@/types'

export default async function AulaPage({
  params,
}: {
  params: Promise<{ id: string; aulaId: string }>
}) {
  const { id, aulaId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: access } = await supabase
    .from('user_products')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', id)
    .single()

  if (!access) redirect('/dashboard')

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, modules(title, product_id)')
    .eq('id', aulaId)
    .eq('is_published', true)
    .single()

  if (!lesson) redirect(`/produto/${id}`)

  const l = lesson as Lesson & { modules: { title: string; product_id: string } }

  const [{ data: siblings }, { data: progressRows }, { data: profile }, { data: commentsData }, { data: ratingData }] = await Promise.all([
    supabase
      .from('lessons')
      .select('id, title, sort_order, lesson_type')
      .eq('module_id', l.module_id)
      .eq('is_published', true)
      .order('sort_order'),
    supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('user_id', user.id),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('lesson_comments')
      .select('*, profiles(name)')
      .eq('lesson_id', aulaId)
      .order('created_at', { ascending: true }),
    supabase
      .from('lesson_ratings')
      .select('rating')
      .eq('user_id', user.id)
      .eq('lesson_id', aulaId)
      .maybeSingle(),
  ])

  const completedSet = new Set(progressRows?.map(p => p.lesson_id) ?? [])
  const isCompleted = completedSet.has(aulaId)
  const isAdmin = profile?.role === 'admin'
  const myRating = ratingData?.rating ?? null
  const comments = (commentsData ?? []) as LessonComment[]

  const currentIdx = siblings?.findIndex(s => s.id === aulaId) ?? -1
  const prevLesson = currentIdx > 0 ? siblings![currentIdx - 1] : null
  const nextLesson = siblings && currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null

  const sidebarLessons = (siblings ?? []).map(s => ({
    ...s,
    completed: completedSet.has(s.id),
  }))

  return (
    <div className="max-w-6xl mx-auto">
      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 lg:items-start">

        {/* Coluna principal */}
        <div className="min-w-0 space-y-6">
          <div>
            <Link
              href={`/produto/${id}`}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition mb-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Voltar ao curso
            </Link>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{l.modules?.title}</p>
            <div className="flex items-start gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">{l.title}</h1>
              {isCompleted && (
                <span className="mt-1 shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#22c55e' }}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </div>
            {l.description && <p className="text-gray-500 dark:text-gray-400 text-sm">{l.description}</p>}
          </div>

          {/* Player / conteúdo */}
          <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] overflow-hidden">
            {l.lesson_type === 'video' && <VideoFocusLesson url={l.content_url} />}
            {l.lesson_type === 'text' && <TextLesson content={l.content_text} />}
            {l.lesson_type === 'file' && <FileLesson url={l.content_url} title={l.title} />}
            {l.lesson_type === 'link' && <LinkLesson url={l.content_url} title={l.title} />}
          </div>

          {/* Sidebar no mobile (abaixo do vídeo) */}
          <div className="lg:hidden">
            <LessonSidebar
              productId={id}
              moduleTitle={l.modules?.title ?? 'Módulo'}
              lessons={sidebarLessons}
              currentLessonId={aulaId}
            />
          </div>

          {/* Comentários + Ações lado a lado (igual MemberKit) */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4 items-start">

            {/* Comentários */}
            <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
              <LessonComments
                lessonId={aulaId}
                productId={id}
                currentUserId={user.id}
                isAdmin={isAdmin}
                initialComments={comments}
              />
            </div>

            {/* Painel de ações */}
            <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5 flex flex-col gap-5">
              {/* Avaliação */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Avaliação</p>
                <LessonRating lessonId={aulaId} productId={id} initialRating={myRating} />
              </div>

              {/* Marcar como concluído */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Progresso</p>
                <LessonCompleteButton lessonId={aulaId} productId={id} completed={isCompleted} />
              </div>

              {/* Navegação */}
              {(prevLesson || nextLesson) && (
                <div className="flex flex-col gap-2 pt-1 border-t border-gray-100 dark:border-[#1e2030]">
                  {prevLesson && (
                    <Link
                      href={`/produto/${id}/aula/${prevLesson.id}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      Anterior
                    </Link>
                  )}
                  {nextLesson && (
                    <Link
                      href={`/produto/${id}/aula/${nextLesson.id}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: '#b48840' }}
                    >
                      Próxima aula
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar no desktop */}
        <div className="hidden lg:block sticky top-20">
          <LessonSidebar
            productId={id}
            moduleTitle={l.modules?.title ?? 'Módulo'}
            lessons={sidebarLessons}
            currentLessonId={aulaId}
          />
        </div>

      </div>
    </div>
  )
}

function TextLesson({ content }: { content: string | null }) {
  if (!content) return <div className="p-8 text-gray-400 text-center">Conteúdo não disponível.</div>
  return (
    <div className="p-6 sm:p-8 prose prose-gray dark:prose-invert max-w-none text-sm leading-relaxed">
      {content.split('\n').map((line, i) => (
        <p key={i} className="mb-3 text-gray-700 dark:text-gray-300">{line || ' '}</p>
      ))}
    </div>
  )
}

function FileLesson({ url, title }: { url: string | null; title: string }) {
  if (!url) return <div className="p-8 text-gray-400 text-center">Arquivo não disponível.</div>
  return (
    <div className="p-8 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f5efe3' }}>
        <svg className="w-8 h-8" style={{ color: '#b48840' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 mt-1">Clique para baixar</p>
      </div>
      <a href={url} download target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
        style={{ backgroundColor: '#b48840' }}
      >
        Baixar arquivo
      </a>
    </div>
  )
}

function LinkLesson({ url, title }: { url: string | null; title: string }) {
  if (!url) return <div className="p-8 text-gray-400 text-center">Link não disponível.</div>
  return (
    <div className="p-8 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f5efe3' }}>
        <svg className="w-8 h-8" style={{ color: '#b48840' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 mt-1 break-all">{url}</p>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
        style={{ backgroundColor: '#b48840' }}
      >
        Acessar link
      </a>
    </div>
  )
}
