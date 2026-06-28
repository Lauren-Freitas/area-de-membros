import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()

  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: totalMembers },
    { count: totalAccesses },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member'),
    supabase.from('user_products').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Visão geral</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Produtos ativos', value: activeProducts ?? 0 },
          { label: 'Total de produtos', value: totalProducts ?? 0 },
          { label: 'Membros', value: totalMembers ?? 0 },
          { label: 'Acessos liberados', value: totalAccesses ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/produtos"
          className="px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-white text-sm font-semibold rounded-lg transition"
        >
          Gerenciar produtos
        </Link>
        <Link
          href="/admin/usuarios"
          className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition"
        >
          Gerenciar usuários
        </Link>
      </div>
    </div>
  )
}
