import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { sendCollaboratorInviteEmail } from '@/lib/resend'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('name, email').eq('id', id).maybeSingle()
  if (!profile) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: profile.email,
    options: {
      redirectTo: `${appUrl}/auth/callback?next=/criar-senha`,
    },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const inviteLink = linkData?.properties?.action_link
  if (!inviteLink) return NextResponse.json({ error: 'Não foi possível gerar o link de convite' }, { status: 500 })

  try {
    await sendCollaboratorInviteEmail({ email: profile.email, name: profile.name, inviteLink })
  } catch (err) {
    return NextResponse.json({ error: `Email não enviado: ${err instanceof Error ? err.message : String(err)}` }, { status: 502 })
  }

  await fireOutboundWebhooks('invite.sent', { user_id: id, email: profile.email, name: profile.name })
  return NextResponse.json({ sent: true })
}
