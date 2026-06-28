import Link from 'next/link'
import { AulaForm } from './AulaForm'

export default async function NovaAulaPage({
  params,
}: {
  params: Promise<{ id: string; modId: string }>
}) {
  const { id, modId } = await params

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href={`/admin/produtos/${id}`} className="text-gray-500 hover:text-gray-800">← Produto</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/admin/produtos/${id}/modulos/${modId}`} className="text-gray-500 hover:text-gray-800">Módulo</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900">Nova aula</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova aula</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <AulaForm productId={id} moduleId={modId} />
      </div>
    </div>
  )
}
