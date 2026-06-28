import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lesson } from '@/types'

export default async function AulaPage({
  params,
}: {
  params: Promise<{ id: string; aulaId: string }>
}) {
  const { id, aulaId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verifica acesso ao produto
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

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/produto/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar ao curso
      </Link>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{l.modules?.title}</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{l.title}</h1>
      {l.description && <p className="text-gray-500 text-sm mb-6">{l.description}</p>}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {l.lesson_type === 'video' && <VideoLesson url={l.content_url} />}
        {l.lesson_type === 'text' && <TextLesson content={l.content_text} />}
        {l.lesson_type === 'file' && <FileLesson url={l.content_url} title={l.title} />}
        {l.lesson_type === 'link' && <LinkLesson url={l.content_url} title={l.title} />}
      </div>
    </div>
  )
}

function VideoLesson({ url }: { url: string | null }) {
  if (!url) return (
    <div className="aspect-video flex items-center justify-center bg-gray-50 text-gray-400">Vídeo não configurado.</div>
  )
  const embedUrl = url
    .replace('watch?v=', 'embed/')
    .replace('youtu.be/', 'www.youtube.com/embed/')
    .replace('vimeo.com/', 'player.vimeo.com/video/')
  return (
    <div className="aspect-video">
      <iframe src={embedUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
    </div>
  )
}

function TextLesson({ content }: { content: string | null }) {
  if (!content) return <div className="p-8 text-gray-400 text-center">Conteúdo não disponível.</div>
  return (
    <div className="p-6 sm:p-8 prose prose-gray max-w-none text-sm leading-relaxed">
      {content.split('\n').map((line, i) => (
        <p key={i} className="mb-3 text-gray-700">{line || ' '}</p>
      ))}
    </div>
  )
}

function FileLesson({ url, title }: { url: string | null; title: string }) {
  if (!url) return <div className="p-8 text-gray-400 text-center">Arquivo não disponível.</div>
  return (
    <div className="p-8 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fdf8e6' }}>
        <svg className="w-8 h-8" style={{ color: '#c9a84c' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 mt-1">Clique para baixar</p>
      </div>
      <a href={url} download target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
        style={{ backgroundColor: '#c9a84c' }}
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
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fdf8e6' }}>
        <svg className="w-8 h-8" style={{ color: '#c9a84c' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 mt-1 break-all">{url}</p>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
        style={{ backgroundColor: '#c9a84c' }}
      >
        Acessar link
      </a>
    </div>
  )
}
