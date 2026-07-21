import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { APPEARANCE_DEFAULTS } from '@/lib/appearance-defaults'
import { logActivity } from '@/lib/log-activity'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' || profile?.role === 'equipe'
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 })
  }
  try {
    const values: Record<string, string> = await request.json()
    const adminClient = createAdminClient()
    const rows = Object.entries(values).map(([key, value]) => ({ key, value: String(value) }))
    const { error } = await adminClient.from('site_config').upsert(rows, { onConflict: 'key' })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    await logActivity({ action: 'salvar_aparencia', entity: 'aparencia' })
    revalidatePath('/', 'layout')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!await requireAdmin()) {
    return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 })
  }
  try {
    const adminClient = createAdminClient()
    const rows = Object.entries(APPEARANCE_DEFAULTS).map(([key, value]) => ({ key, value }))
    const { error } = await adminClient.from('site_config').upsert(rows, { onConflict: 'key' })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    await logActivity({ action: 'restaurar_aparencia', entity: 'aparencia' })
    revalidatePath('/', 'layout')
    return NextResponse.json({ ok: true, defaults: APPEARANCE_DEFAULTS })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
