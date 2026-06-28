import Link from 'next/link'
import { ModuloForm } from './ModuloForm'

export default async function NovoModuloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/admin/produtos" className="text-gray-500 hover:text-gray-800">← Produtos</Link>
        <span className="text-gray-300">/</span>
        <Link href={`/admin/produtos/${id}`} className="text-gray-500 hover:text-gray-800">Produto</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900">Novo módulo</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo módulo</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <ModuloForm productId={id} />
      </div>
    </div>
  )
}
