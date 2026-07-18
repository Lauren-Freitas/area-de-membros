import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const admin = createAdminClient()
  const start = Date.now()
  try {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 })
    return NextResponse.json({
      ok: !error,
      ms: Date.now() - start,
      userCount: data?.users?.length ?? null,
      error: error ? { name: error.name, status: error.status, message: error.message } : null,
    })
  } catch (err) {
    const anyErr = err as Record<string, unknown>
    return NextResponse.json({
      ok: false,
      ms: Date.now() - start,
      threw: true,
      error: { name: anyErr?.name, status: anyErr?.status, message: anyErr?.message },
    })
  }
}
