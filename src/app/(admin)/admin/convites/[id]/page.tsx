import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ConviteEditForm } from './ConviteEditForm'

export default async function EditarConvitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const [{ data: invite }, { data: products }] = await Promise.all([
    admin.from('invites').select('*').eq('id', id).single(),
    admin.from('products').select('id, title').eq('is_active', true).order('sort_order'),
  ])

  if (!invite) redirect('/admin/convites')

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/convites" className="hover:text-gray-800 transition">Convites</Link>
        <span>/</span>
        <span className="font-mono font-bold text-gray-900">{invite.code}</span>
      </div>

      <ConviteEditForm id={id} invite={invite} products={products ?? []} />
    </div>
  )
}
