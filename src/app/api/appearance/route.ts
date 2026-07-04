import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { APPEARANCE_DEFAULTS } from '@/lib/appearance-defaults'

export async function POST(request: Request) {
  try {
    const values: Record<string, string> = await request.json()
    const adminClient = createAdminClient()
    const rows = Object.entries(values).map(([key, value]) => ({ key, value: String(value) }))
    const { error } = await adminClient.from('site_config').upsert(rows, { onConflict: 'key' })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const adminClient = createAdminClient()
    const rows = Object.entries(APPEARANCE_DEFAULTS).map(([key, value]) => ({ key, value }))
    const { error } = await adminClient.from('site_config').upsert(rows, { onConflict: 'key' })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, defaults: APPEARANCE_DEFAULTS })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
