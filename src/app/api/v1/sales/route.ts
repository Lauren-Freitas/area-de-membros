import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'
import { apiSuccess, Errors } from '@/lib/api-response'
import { hasScope } from '@/lib/api-scopes'

/** Somente leitura — populado pelos webhooks de entrada do Asaas/Kiwify ou por concessões manuais com granted_by='purchase'/'pack'. */
export async function GET(req: NextRequest) {
  const auth = await checkApiKey(req)
  if (!auth.ok) return Errors.unauthorized()
  if (!hasScope(auth, 'sales:read')) return Errors.forbidden('sales:read')

  const { searchParams } = req.nextUrl
  const user_id = searchParams.get('user_id')
  const product_id = searchParams.get('product_id')
  const payment_status = searchParams.get('payment_status')

  const admin = createAdminClient()
  let query = admin
    .from('user_products')
    .select('id, user_id, product_id, granted_at, granted_by, value, billing_type, payment_status, invoice_url, asaas_payment_id')
    .in('granted_by', ['purchase', 'pack'])
    .order('granted_at', { ascending: false })

  if (user_id) query = query.eq('user_id', user_id)
  if (product_id) query = query.eq('product_id', product_id)
  if (payment_status) query = query.eq('payment_status', payment_status)

  const { data, error } = await query
  if (error) return Errors.internal(error.message)
  return apiSuccess({ sales: data })
}
