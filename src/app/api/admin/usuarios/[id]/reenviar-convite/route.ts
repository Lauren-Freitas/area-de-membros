import { NextRequest, NextResponse } from 'next/server'
import { checkApiKey } from '@/lib/api-auth'
import { getApiActor } from '@/lib/core/actor'
import { resendAccess } from '@/lib/core/members'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const result = await resendAccess(id, getApiActor(auth.keyName))
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ sent: true })
}
