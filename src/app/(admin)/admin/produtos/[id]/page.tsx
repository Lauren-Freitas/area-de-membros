import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProductForm } from './ProductForm'
import { Product, Module, Lesson } from '@/types'
import { deleteModule } from '@/lib/actions/admin'

export default async function AdminProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const isNew = id === 'novo'

  let product: Product | undefined
  let modules: (Module & { lessons: Lesson[] })[] = []

  if (!isNew) {
    const supabase = await createClient()
    const [{ data: prod }, { data: mods }] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase
        .from('modules')
        .select('*, lessons(*)')
        .eq('product_id', id)
        .order('sort_order'),
    ])
    if (!prod) redirect('/admin/produtos')
    product = prod as Product
    modules = (mods ?? []) as (Module & { lessons: Lesson[] })[]
  }

  const lessonTypeLabel: Record<string, string> = {
    video: '▶ Vídeo',
    text: '📝 Texto',
    file: '📄 Arquivo',
    link: '🔗 Link',
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/admin/produtos" className="text-gray-500 hover:text-gray-800 transition">
          ← Produtos
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900">{isNew ? 'Novo produto' : product?.title}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {isNew ? 'Criar produto' : 'Editar produto'}
      </h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 mb-8">
        <ProductForm product={product} />
      </div>

      {/* Módulos — só mostra para produtos existentes */}
      {!isNew && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Módulos</h2>
            <Link
              href={`/admin/produtos/${id}/modulos/novo`}
              className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: '#b48840' }}
            >
              + Novo módulo
            </Link>
          </div>

          {modules.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
              <p className="font-medium">Nenhum módulo criado.</p>
              <p className="text-sm mt-1">Crie módulos para organizar as aulas deste produto.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((mod, idx) => (
                <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-300 w-5">{idx + 1}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{mod.title}</p>
                        {mod.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{mod.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {mod.lessons?.length ?? 0} aula{(mod.lessons?.length ?? 0) !== 1 ? 's' : ''}
                      </span>
                      <Link
                        href={`/admin/produtos/${id}/modulos/${mod.id}`}
                        className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                      >
                        Editar
                      </Link>
                      <form action={deleteModule.bind(null, mod.id, id)}>
                        <button
                          type="submit"
                          onClick={(e) => {
                            if (!confirm(`Excluir o módulo "${mod.title}" e todas as suas aulas?`)) e.preventDefault()
                          }}
                          className="text-xs font-medium px-3 py-1.5 rounded-full border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition"
                        >
                          Excluir
                        </button>
                      </form>
                    </div>
                  </div>

                  {(mod.lessons?.length ?? 0) > 0 && (
                    <div className="border-t border-gray-50 px-5 py-3 space-y-1">
                      {mod.lessons.sort((a, b) => a.sort_order - b.sort_order).map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{lessonTypeLabel[lesson.lesson_type]}</span>
                            <span className="text-sm text-gray-700">{lesson.title}</span>
                            {!lesson.is_published && (
                              <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Rascunho</span>
                            )}
                          </div>
                          <Link
                            href={`/admin/produtos/${id}/modulos/${mod.id}/aulas/${lesson.id}`}
                            className="text-xs text-gray-400 hover:text-gray-700 transition"
                          >
                            Editar
                          </Link>
                        </div>
                      ))}
                      <Link
                        href={`/admin/produtos/${id}/modulos/${mod.id}/aulas/novo`}
                        className="block text-xs text-center py-2 mt-2 rounded-lg border border-dashed border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition"
                      >
                        + Adicionar aula
                      </Link>
                    </div>
                  )}

                  {(mod.lessons?.length ?? 0) === 0 && (
                    <div className="border-t border-gray-50 px-5 py-3">
                      <Link
                        href={`/admin/produtos/${id}/modulos/${mod.id}/aulas/novo`}
                        className="block text-xs text-center py-2 rounded-lg border border-dashed border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition"
                      >
                        + Adicionar primeira aula
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
