import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AtendimentoForm } from './AtendimentoForm'

export default async function AtendimentoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: products }, { data: tickets }] = await Promise.all([
    supabase.from('user_products').select('products(id, title)').eq('user_id', user.id),
    supabase
      .from('support_tickets')
      .select('id, subject, message, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const myProducts = (products ?? [])
    .map((p: { products: unknown }) => {
      const prod = Array.isArray(p.products) ? p.products[0] : p.products
      return prod as { id: string; title: string } | null
    })
    .filter(Boolean) as { id: string; title: string }[]

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Atendimento</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Tire suas dúvidas ou abra um chamado de suporte. Respondemos em até 24 horas úteis.
        </p>
      </div>

      <AtendimentoForm products={myProducts} tickets={tickets ?? []} />
    </div>
  )
}
