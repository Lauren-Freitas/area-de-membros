'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/log-activity'
import { redirect } from 'next/navigation'

export async function startViewAs(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin' && me?.role !== 'equipe') return

  const admin = createAdminClient()
  const { data: target } = await admin.from('profiles').select('name').eq('id', memberId).single()
  if (!target) return

  const cookieStore = await cookies()
  cookieStore.set('view_as', memberId, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 })
  cookieStore.set('view_as_name', target.name ?? 'Membro', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 })

  await logActivity({ action: 'ver_como', entity: 'membro', entityId: memberId, entityName: target.name })
  redirect('/dashboard')
}

export async function stopViewAs() {
  const cookieStore = await cookies()
  cookieStore.delete('view_as')
  cookieStore.delete('view_as_name')
  redirect('/admin/usuarios')
}
