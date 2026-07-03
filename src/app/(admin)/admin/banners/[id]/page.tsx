import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Banner } from '@/types'
import { BannerForm } from '../BannerForm'

export default async function EditarBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'equipe') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: banner } = await admin.from('banners').select('*').eq('id', id).single()
  if (!banner) redirect('/admin/banners')

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Editar banner</h1>
      <BannerForm banner={banner as Banner} />
    </div>
  )
}
