import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import Link from 'next/link'
import sanitizeHtml from 'sanitize-html'
import { Lesson, LessonAttachment } from '@/types'
import { Button } from '@/components/Button'
import { CompleteButton } from '@/components/CompleteButton'
import { CommentThread } from '@/components/CommentThread'
import { LessonSidebar } from '@/components/LessonSidebar'
import { LessonVideoPlayer } from '@/components/LessonVideoPlayer'
import { StarRating } from '@/components/StarRating'
import { rateLesson } from '@/lib/actions/ratings'
import { postComment, deleteComment } from '@/lib/actions/comments'
import { toggleLessonComplete } from '@/lib/actions/progress'
import { LessonComment } from '@/types'
import { computeReleaseState } from '@/lib/release'
import { isAccessExpired } from '@/lib/entitlement'

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
    .select('id, granted_at, expires_at')
    .eq('user_id', user.id)
    .eq('product_id', id)
    .maybeSingle()

  // Mesma regra de autorização da página do produto: sem linha de acesso, ou
  // linha existente mas expirada, nunca serve o conteúdo — manda pro portão
  // (/produto/[id]), que já sabe mostrar "expirado" vs. "nunca teve acesso".
  if (!access || isAccessExpired((access as { expires_at: string | null }).expires_at)) redirect(`/produto/${id}`)

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*, modules(title, product_id)')
    .eq('id', aulaId)
    .eq('is_published', true)
    .single()

  if (!lesson) redirect(`/produto/${id}`)

  const l = lesson as Lesson & { modules: { title: string; product_id: string } }

  if (l.modules?.product_id !== id) redirect(`/produto/${id}`)

  const releaseState = computeReleaseState({
    releaseType: l.release_type,
    releaseAfterDays: l.release_after_days,
    releaseAt: l.release_at,
    accessDurationDays: l.access_duration_days,
    grantedAt: (access as { granted_at?: string | null }).granted_at ?? null,
  })
  if (!releaseState.isReleased || releaseState.isExpired) redirect(`/produto/${id}`)

  const admin = createAdminClient()

  // "Continue de onde parou" — grava a última aula vista, depois da resposta
  after(async () => {
    await admin.from('profiles').update({ last_lesson_id: aulaId, last_lesson_viewed_at: new Date().toISOString() }).eq('id', user.id)
  })
  const { data: attachmentRows } = await admin
    .from('lesson_attachments')
    .select('*')
    .eq('lesson_id', aulaId)
    .order('sort_order')
  const attachments = await Promise.all(
    ((attachmentRows ?? []) as LessonAttachment[]).map(async a => {
      const { data } = await admin.storage.from('lesson-attachments').createSignedUrl(a.file_path, 3600, { download: a.file_name })
      return { ...a, url: data?.signedUrl ?? null }
    })
  )

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
    supabase.from('profiles').select('role, name, avatar_url').eq('id', user.id).single(),
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
  const isAdmin = profile?.role === 'admin' || profile?.role === 'equipe'
  const userInitials = (profile as { name?: string } | null)?.name
    ? (profile as { name: string }).name.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
    : 'EU'
  const userAvatarUrl = (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null
  const myRating = ratingData?.rating ?? null
  const comments = (commentsData ?? []) as LessonComment[]

  const currentIdx = siblings?.findIndex(s => s.id === aulaId) ?? -1
  const prevLesson = currentIdx > 0 ? siblings![currentIdx - 1] : null
  const nextLesson = siblings && currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null

  const modTotal = siblings?.length ?? 0
  const modDone = (siblings ?? []).filter(s => completedSet.has(s.id)).length
  const modPct = modTotal > 0 ? Math.round((modDone / modTotal) * 100) : 0

  const prevHref = prevLesson ? `/produto/${id}/aula/${prevLesson.id}` : null
  const nextHref = nextLesson ? `/produto/${id}/aula/${nextLesson.id}` : null

  const sidebarLessons = (siblings ?? []).map(s => ({
    ...s,
    completed: completedSet.has(s.id),
  }))

  return (
    <div className="max-w-6xl mx-auto">
      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 lg:items-start">

        {/* Coluna principal */}
        <div className="min-w-0 space-y-4">
          <Link
            href={`/produto/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao curso
          </Link>

          {/* Vídeo — vem primeiro. Aulas antigas do tipo arquivo/link mantêm o formato anterior. */}
          {l.lesson_type === 'file' || l.lesson_type === 'link' ? (
            <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] overflow-hidden">
              {l.lesson_type === 'file' && <FileLesson url={l.content_url} title={l.title} />}
              {l.lesson_type === 'link' && <LinkLesson url={l.content_url} title={l.title} />}
            </div>
          ) : (
            l.content_url && (
              <LessonVideoPlayer url={l.content_url} progressPct={modPct} prevHref={prevHref} nextHref={nextHref} />
            )
          )}

          {/* Título e descrição da aula */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{l.modules?.title}</p>
            <div className="flex items-start gap-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">{l.title}</h1>
              {isCompleted && (
                <span className="mt-1 shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#22c55e' }}>
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
            </div>
            {l.description && <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{l.description}</p>}
          </div>

          {/* Conteúdo em texto da aula, quando houver */}
          {l.lesson_type !== 'file' && l.lesson_type !== 'link' && (l.content_html || l.content_text) && (
            <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] overflow-hidden">
              {l.content_html ? <RichTextContent html={l.content_html} /> : <TextLesson content={l.content_text} />}
            </div>
          )}
          {l.lesson_type !== 'file' && l.lesson_type !== 'link' && !l.content_url && !l.content_html && !l.content_text && (
            <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-8 text-center text-gray-400">
              Conteúdo não disponível.
            </div>
          )}

          {/* Arquivos da aula */}
          {attachments.length > 0 && <AttachmentsList attachments={attachments} />}

          {/* Sidebar no mobile (abaixo do vídeo) */}
          <div id="lesson-sidebar" className="lg:hidden">
            <LessonSidebar
              productId={id}
              moduleTitle={l.modules?.title ?? 'Módulo'}
              lessons={sidebarLessons}
              currentLessonId={aulaId}
            />
          </div>

          {/* Comentários */}
          <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
            <CommentThread
              currentUserId={user.id}
              isAdmin={isAdmin}
              initialComments={comments}
              userInitials={userInitials}
              userAvatarUrl={userAvatarUrl}
              onSubmit={postComment.bind(null, aulaId, id)}
              onDelete={deleteComment.bind(null, aulaId, id)}
            />
          </div>

          {/* Avaliação */}
          <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Avaliação</p>
            <StarRating size="sm" showLabel initialRating={myRating} onRate={rateLesson.bind(null, aulaId, id)} />
          </div>

          {/* Progresso + navegação pra próxima aula */}
          <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5 flex flex-col gap-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Progresso</p>
              <CompleteButton
                completed={isCompleted}
                onComplete={toggleLessonComplete.bind(null, aulaId, id, false)}
                onIncomplete={toggleLessonComplete.bind(null, aulaId, id, true)}
                pendingLabel="Marcar como concluída"
                doneLabel="Concluída"
              />
            </div>

            {(prevLesson || nextLesson) && (
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-[#1e2030]">
                {prevLesson && (
                  <Button href={`/produto/${id}/aula/${prevLesson.id}`} variant="secondary">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Anterior
                  </Button>
                )}
                {nextLesson && (
                  <Button href={`/produto/${id}/aula/${nextLesson.id}`} className="flex-1">
                    Próxima aula
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                )}
              </div>
            )}
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

function RichTextContent({ html }: { html: string }) {
  const clean = sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'blockquote', 'code', 'pre', 'img', 'span', 'div'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      '*': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  })
  return (
    <div
      className="p-6 sm:p-8 prose prose-gray dark:prose-invert max-w-none text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}

const FILE_TYPE_BY_EXT: Record<string, { label: string; d: string }> = {
  pdf: {
    label: 'PDF',
    d: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12h7.5m-7.5 3h7.5m-7.5-6h.75m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  },
  xls: { label: 'Planilha', d: 'M3 3.75A.75.75 0 013.75 3h16.5a.75.75 0 01.75.75V20.25a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75V3.75zM3.75 9h16.5M3.75 15h16.5M9 3.75v16.5' },
  xlsx: { label: 'Planilha', d: 'M3 3.75A.75.75 0 013.75 3h16.5a.75.75 0 01.75.75V20.25a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75V3.75zM3.75 9h16.5M3.75 15h16.5M9 3.75v16.5' },
  csv: { label: 'Planilha', d: 'M3 3.75A.75.75 0 013.75 3h16.5a.75.75 0 01.75.75V20.25a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75V3.75zM3.75 9h16.5M3.75 15h16.5M9 3.75v16.5' },
  doc: { label: 'Documento', d: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  docx: { label: 'Documento', d: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' },
  ppt: { label: 'Apresentação', d: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25' },
  pptx: { label: 'Apresentação', d: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25' },
  zip: { label: 'Arquivo compactado', d: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
  rar: { label: 'Arquivo compactado', d: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
  png: { label: 'Imagem', d: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 22.5H6a2.25 2.25 0 01-2.25-2.25V3.75A2.25 2.25 0 016 1.5h12a2.25 2.25 0 012.25 2.25V20.25A2.25 2.25 0 0118 22.5zM10.5 8.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' },
  jpg: { label: 'Imagem', d: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 22.5H6a2.25 2.25 0 01-2.25-2.25V3.75A2.25 2.25 0 016 1.5h12a2.25 2.25 0 012.25 2.25V20.25A2.25 2.25 0 0118 22.5zM10.5 8.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' },
  jpeg: { label: 'Imagem', d: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 22.5H6a2.25 2.25 0 01-2.25-2.25V3.75A2.25 2.25 0 016 1.5h12a2.25 2.25 0 012.25 2.25V20.25A2.25 2.25 0 0118 22.5zM10.5 8.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' },
}
const FILE_TYPE_DEFAULT = { label: 'Arquivo', d: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' }

function AttachmentsList({ attachments }: { attachments: (LessonAttachment & { url: string | null })[] }) {
  function formatSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  function fileType(fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
    return FILE_TYPE_BY_EXT[ext] ?? FILE_TYPE_DEFAULT
  }
  return (
    <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Arquivos da aula</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attachments.map(a => {
          const type = fileType(a.file_name)
          return (
            <div key={a.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-[#1e2030]">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--brand-bg)' }}>
                <svg className="w-4.5 h-4.5" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={type.d} />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{a.file_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {type.label} · {formatSize(a.file_size)} · {new Date(a.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {a.url ? (
                <Button href={a.url} download={a.file_name} size="sm" className="shrink-0">
                  Baixar
                </Button>
              ) : (
                <span className="text-xs text-gray-300 shrink-0">Indisponível</span>
              )}
            </div>
          )
        })}
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
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-bg)' }}>
        <svg className="w-8 h-8" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 mt-1">Clique para baixar</p>
      </div>
      <Button href={url} download>
        Baixar arquivo
      </Button>
    </div>
  )
}

function LinkLesson({ url, title }: { url: string | null; title: string }) {
  if (!url) return <div className="p-8 text-gray-400 text-center">Link não disponível.</div>
  return (
    <div className="p-8 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-bg)' }}>
        <svg className="w-8 h-8" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 mt-1 break-all">{url}</p>
      </div>
      <Button href={url}>
        Acessar link
      </Button>
    </div>
  )
}
