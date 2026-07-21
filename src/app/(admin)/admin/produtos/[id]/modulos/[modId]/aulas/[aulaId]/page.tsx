import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AulaForm } from '../novo/AulaForm'
import { Lesson, LessonAttachment } from '@/types'

export default async function EditAulaPage({
  params,
}: {
  params: Promise<{ id: string; modId: string; aulaId: string }>
}) {
  const { id, modId, aulaId } = await params
  const supabase = await createClient()

  const [{ data: lesson }, { data: attachments }] = await Promise.all([
    supabase.from('lessons').select('*').eq('id', aulaId).single(),
    supabase.from('lesson_attachments').select('*').eq('lesson_id', aulaId).order('sort_order'),
  ])
  if (!lesson) redirect(`/admin/produtos/${id}/modulos/${modId}`)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href={`/admin/produtos/${id}`} className="text-gray-500 hover:text-gray-800">Produto</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/admin/produtos/${id}/modulos/${modId}`} className="text-gray-500 hover:text-gray-800">Módulo</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900">{(lesson as Lesson).title}</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar aula</h1>
      <div className="bg-card rounded-2xl border border-gray-100 p-6">
        <AulaForm productId={id} moduleId={modId} lesson={lesson as Lesson} attachments={(attachments ?? []) as LessonAttachment[]} />
      </div>
    </div>
  )
}
