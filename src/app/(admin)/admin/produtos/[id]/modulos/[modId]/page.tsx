import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ModuloForm } from '../novo/ModuloForm'
import { Module, Lesson } from '@/types'
import { DeleteLessonButton } from '@/components/admin/DeleteLessonButton'

const lessonTypeLabel: Record<string, string> = {
  video: '▶ Vídeo',
  text: '📝 Texto',
  file: '📄 Arquivo',
  link: '🔗 Link',
}

export default async function EditModuloPage({
  params,
}: {
  params: Promise<{ id: string; modId: string }>
}) {
  const { id, modId } = await params
  const supabase = await createClient()

  const [{ data: mod }, { data: lessons }] = await Promise.all([
    supabase.from('modules').select('*').eq('id', modId).single(),
    supabase.from('lessons').select('*').eq('module_id', modId).order('sort_order'),
  ])

  if (!mod) redirect(`/admin/produtos/${id}`)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/admin/produtos" className="text-gray-500 hover:text-gray-800">← Produtos</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/admin/produtos/${id}`} className="text-gray-500 hover:text-gray-800">Produto</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900">{(mod as Module).title}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar módulo</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <ModuloForm productId={id} module={mod as Module} />
      </div>

      {/* Aulas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Aulas</h2>
          <Link
            href={`/admin/produtos/${id}/modulos/${modId}/aulas/novo`}
            className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: '#b48840' }}
          >
            + Nova aula
          </Link>
        </div>

        {!lessons?.length ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
            <p className="font-medium">Nenhuma aula criada.</p>
            <p className="text-sm mt-1">
              <Link href={`/admin/produtos/${id}/modulos/${modId}/aulas/novo`} className="underline">Criar primeira aula</Link>
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {(lessons as Lesson[]).map((lesson, idx) => (
              <div key={lesson.id} className="flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-300 w-5">{idx + 1}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{lessonTypeLabel[lesson.lesson_type]}</span>
                      <p className="text-sm font-medium text-gray-900">{lesson.title}</p>
                      {!lesson.is_published && (
                        <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">Rascunho</span>
                      )}
                    </div>
                    {lesson.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{lesson.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/produtos/${id}/modulos/${modId}/aulas/${lesson.id}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Editar
                  </Link>
                  <DeleteLessonButton lessonId={lesson.id} moduleId={modId} productId={id} lessonTitle={lesson.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
