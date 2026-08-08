import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ProductForm } from './ProductForm'
import { Product, Module, Lesson } from '@/types'
import { ProductTabs, type AccessRow } from './ProductTabs'

export default async function AdminProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const isNew = id === 'novo'

  if (isNew) {
    return (
      <div>
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link href="/admin/produtos" className="text-gray-500 hover:text-gray-800 transition">
            Produtos
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">Novo produto</span>
        </div>
        <div className="bg-card rounded-2xl border border-gray-100 p-6 sm:p-8">
          <ProductForm />
        </div>
      </div>
    )
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()
  const [{ data: prod }, { data: mods }, { data: accesses }, { data: members }] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    supabase.from('modules').select('*, lessons(*)').eq('product_id', id).order('sort_order'),
    adminClient
      .from('user_products')
      .select('id, user_id, granted_at, granted_by, expires_at, payment_status, value, is_completed, profiles(name, email)')
      .eq('product_id', id)
      .order('granted_at', { ascending: false }),
    adminClient.from('profiles').select('id, name, email').eq('role', 'membro').order('name'),
  ])
  if (!prod) redirect('/admin/produtos')

  const product = prod as Product
  const modules = (mods ?? []) as (Module & { lessons: Lesson[] })[]
  const accessRows: AccessRow[] = (accesses ?? []).map(a => ({
    id: a.id,
    user_id: a.user_id,
    granted_at: a.granted_at,
    granted_by: a.granted_by,
    expires_at: a.expires_at,
    payment_status: a.payment_status,
    value: a.value,
    is_completed: a.is_completed,
    profile: Array.isArray(a.profiles) ? a.profiles[0] : a.profiles,
  }))
  const accessorIds = new Set(accessRows.map(a => a.user_id))
  const availableMembers = (members ?? []).filter(m => !accessorIds.has(m.id))

  return (
    <div>
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/admin/produtos" className="text-gray-500 hover:text-gray-800 transition">
          Produtos
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900">{product.title}</span>
      </div>

      <ProductTabs
        productId={id}
        product={product}
        modules={modules}
        accessRows={accessRows}
        availableMembers={availableMembers}
      />
    </div>
  )
}
