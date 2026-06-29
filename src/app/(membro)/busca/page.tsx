import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const query = q?.trim() ?? ''

  if (query.length < 2) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pesquisar</h1>
        <p className="text-gray-500 dark:text-gray-400">Digite pelo menos 2 caracteres para buscar.</p>
      </div>
    )
  }

  const { data: accesses } = await supabase
    .from('user_products')
    .select('product_id')
    .eq('user_id', user.id)

  const unlockedIds = accesses?.map(a => a.product_id) ?? []

  const [{ data: productResults }, { data: moduleResults }, { data: allModules }] = await Promise.all([
    supabase
      .from('products')
      .select('id, title, description, content_type, banner_url')
      .eq('is_active', true)
      .in('id', unlockedIds.length ? unlockedIds : ['_'])
      .ilike('title', `%${query}%`)
      .limit(5),
    supabase
      .from('modules')
      .select('id, title, product_id, products(title)')
      .in('product_id', unlockedIds.length ? unlockedIds : ['_'])
      .ilike('title', `%${query}%`)
      .limit(5),
    supabase
      .from('modules')
      .select('id, product_id')
      .in('product_id', unlockedIds.length ? unlockedIds : ['_']),
  ])

  const moduleIds = allModules?.map(m => m.id) ?? []
  const moduleToProduct = Object.fromEntries(allModules?.map(m => [m.id, m.product_id]) ?? [])

  const { data: lessonResults } = moduleIds.length
    ? await supabase
        .from('lessons')
        .select('id, title, lesson_type, module_id, modules(title)')
        .in('module_id', moduleIds)
        .eq('is_published', true)
        .ilike('title', `%${query}%`)
        .limit(8)
    : { data: [] }

  const totalResults = (productResults?.length ?? 0) + (moduleResults?.length ?? 0) + (lessonResults?.length ?? 0)

  const lessonTypeLabel: Record<string, string> = {
    video: 'Vídeo',
    text: 'Texto',
    file: 'Arquivo',
    link: 'Link',
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Resultados para <span style={{ color: '#c9a84c' }}>&ldquo;{query}&rdquo;</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {totalResults === 0 ? 'Nenhum resultado encontrado.' : `${totalResults} resultado${totalResults !== 1 ? 's' : ''} encontrado${totalResults !== 1 ? 's' : ''}.`}
        </p>
      </div>

      {totalResults === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-gray-400 dark:text-gray-500 font-medium">Nenhum conteúdo encontrado.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente buscar por outro termo.</p>
          <Link href="/dashboard" className="inline-block mt-4 text-sm font-semibold" style={{ color: '#c9a84c' }}>
            Voltar ao dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Produtos */}
          {(productResults?.length ?? 0) > 0 && (
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Produtos</h2>
              <div className="space-y-2">
                {productResults!.map(p => (
                  <Link
                    key={p.id}
                    href={`/produto/${p.id}`}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-700 transition group"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fdf8e6, #f8eecc)' }}>
                      {p.banner_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.banner_url} alt="" className="w-full h-full object-cover" />
                        : <span style={{ color: '#c9a84c' }}>{p.content_type === 'video' ? '▶' : '📄'}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-yellow-700 dark:group-hover:text-yellow-400">{p.title}</p>
                      {p.description && <p className="text-xs text-gray-400 truncate mt-0.5">{p.description}</p>}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Módulos */}
          {(moduleResults?.length ?? 0) > 0 && (
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Módulos</h2>
              <div className="space-y-2">
                {moduleResults!.map(m => {
                  const prod = (Array.isArray(m.products) ? m.products[0] : m.products) as { title: string } | null
                  return (
                    <Link
                      key={m.id}
                      href={`/produto/${m.product_id}`}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-700 transition group"
                    >
                      <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-lg" style={{ backgroundColor: '#fdf8e6' }}>
                        📚
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-yellow-700 dark:group-hover:text-yellow-400">{m.title}</p>
                        {prod && <p className="text-xs text-gray-400 truncate mt-0.5">em {prod.title}</p>}
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {/* Aulas */}
          {(lessonResults?.length ?? 0) > 0 && (
            <section>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Aulas</h2>
              <div className="space-y-2">
                {lessonResults!.map(l => {
                  const mod = (Array.isArray(l.modules) ? l.modules[0] : l.modules) as { title: string } | null
                  const productId = moduleToProduct[l.module_id]
                  return (
                    <Link
                      key={l.id}
                      href={`/produto/${productId}/aula/${l.id}`}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-700 transition group"
                    >
                      <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-lg" style={{ backgroundColor: '#fdf8e6' }}>
                        {l.lesson_type === 'video' ? '▶' : l.lesson_type === 'text' ? '📝' : l.lesson_type === 'file' ? '📄' : '🔗'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-yellow-700 dark:group-hover:text-yellow-400">{l.title}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {lessonTypeLabel[l.lesson_type]} {mod ? `· ${mod.title}` : ''}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-yellow-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
