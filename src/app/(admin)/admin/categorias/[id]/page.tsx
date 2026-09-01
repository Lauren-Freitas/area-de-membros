import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SkillTrack } from '@/types'
import { CategoryForm } from '../CategoryForm'

export default async function EditarCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'equipe') redirect('/dashboard')

  const admin = createAdminClient()
  const { data: category } = await admin.from('skill_tracks').select('*').eq('id', id).single()
  if (!category) redirect('/admin/categorias')

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Editar categoria</h1>
      <CategoryForm category={category as SkillTrack} />
    </div>
  )
}
