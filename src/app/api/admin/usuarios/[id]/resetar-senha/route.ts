import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { fireOutboundWebhooks } from '@/lib/fire-webhooks'

/**
 * Diferente de /reenviar-convite (link de primeiro acesso, e-mail customizado
 * via Resend): aqui é um pedido de redefinição de senha pra uma conta que já
 * existe, usando o mesmo mecanismo (e e-mail padrão do Supabase) do fluxo de
 * autoatendimento em /esqueceu-senha.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await checkApiKey(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('email').eq('id', id).maybeSingle()
  if (!profile) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const { error } = await admin.auth.resetPasswordForEmail(profile.email, {
    redirectTo: `${appUrl}/auth/callback?next=/nova-senha`,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await fireOutboundWebhooks('password.reset', { user_id: id, email: profile.email })
  return NextResponse.json({ sent: true })
}
