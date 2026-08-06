import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkApiKey } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  if (!(await checkApiKey(req)).ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sales: data })
}
