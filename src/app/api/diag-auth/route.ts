import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function dump(err: unknown) {
  if (!err || typeof err !== 'object') return err
  try {
    return JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)))
  } catch {
    return String(err)
  }
}

export async function GET(req: Request) {
  const admin = createAdminClient()
  const wantsWrite = new URL(req.url).searchParams.get('write') === '1'

  const listStart = Date.now()
  let listResult: unknown
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    listResult = { ok: !error, ms: Date.now() - listStart, userCount: data?.users?.length ?? null, error: dump(error) }
  } catch (err) {
    listResult = { ok: false, ms: Date.now() - listStart, threw: true, error: dump(err) }
  }

  let createResult: unknown = null
  if (wantsWrite) {
    const createStart = Date.now()
    const testEmail = `diag-${Date.now()}@exemplo.com`
    try {
      const { data, error } = await admin.auth.admin.createUser({
        email: testEmail,
        email_confirm: true,
        user_metadata: { name: 'Diag Test' },
      })
      createResult = { ok: !error, ms: Date.now() - createStart, userId: data?.user?.id ?? null, error: dump(error) }
      if (data?.user?.id) await admin.auth.admin.deleteUser(data.user.id).catch(() => null)
    } catch (err) {
      createResult = { ok: false, ms: Date.now() - createStart, threw: true, error: dump(err) }
    }
  }

  return NextResponse.json({ list: listResult, create: createResult })
}
