import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Product, Module, Lesson } from '@/types'

export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: product }, { data: access }, { data: modules }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).eq('is_active', true).single(),
    supabase.from('user_products').select('id').eq('user_id', user.id).eq('product_id', id).single(),
    supabase.from('modules').select('*, lessons(*)').eq('product_id', id).order('sort_order'),
  ])

  if (!product || !access) redirect('/dashboard')

  const p = product as Product
  const mods = (modules ?? []) as (Module & { lessons: Lesson[] })[]
  const hasModules = mods.length > 0

  const lessonTypeIcon: Record<string, string> = {
    video: '▶',
    text: '📝',
    file: '📄',
    link: '🔗',
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar para meus conteúdos
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">{p.title}</h1>
      {p.description && <p className="text-gray-500 text-sm mb-6">{p.description}</p>}

      {hasModules ? (
        <div className="space-y-4">
          {mods.map((mod, idx) => {
            const lessons = [...(mod.lessons ?? [])].filter(l => l.is_published).sort((a, b) => a.sort_order - b.sort_order)
            return (
              <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Módulo {idx + 1}</p>
                  <h2 className="font-bold text-gray-900">{mod.title}</h2>
                  {mod.description && <p className="text-sm text-gray-500 mt-0.5">{mod.description}</p>}
                </div>
                {lessons.length === 0 ? (
                  <div className="px-5 py-4 text-sm text-gray-400">Nenhuma aula disponível ainda.</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {lessons.map((lesson, lidx) => (
                      <Link
                        key={lesson.id}
                        href={`/produto/${id}/aula/${lesson.id}`}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition group"
                      >
                        <span className="text-xs font-bold text-gray-300 w-5 shrink-0">{lidx + 1}</span>
                        <span className="text-base shrink-0">{lessonTypeIcon[lesson.lesson_type]}</span>
                        <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900 flex-1">{lesson.title}</span>
                        <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        // Produto sem módulos — conteúdo direto (backward compatible)
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {p.content_type === 'video' ? (
            <VideoContent url={p.content_url} />
          ) : (
            <FileContent productId={p.id} title={p.title} />
          )}
        </div>
      )}
    </div>
  )
}

function VideoContent({ url }: { url: string | null }) {
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

async function FileContent({ productId, title }: { productId: string; title: string }) {
  const supabase = await createClient()
  const { data } = await supabase.storage.from('produtos').createSignedUrl(`${productId}/arquivo`, 3600)
  return (
    <div className="p-8 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-full bg-gold-50 flex items-center justify-center">
        <svg className="w-8 h-8 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 mt-1">Clique para baixar o arquivo</p>
      </div>
      {data?.signedUrl ? (
        <a href={data.signedUrl} download className="inline-flex items-center gap-2 px-6 py-3 text-white text-sm font-semibold rounded-lg transition hover:opacity-90" style={{ backgroundColor: '#c9a84c' }}>
          Baixar arquivo
        </a>
      ) : (
        <p className="text-sm text-red-500">Arquivo não encontrado.</p>
      )}
    </div>
  )
}
