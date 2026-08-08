import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Achado na revisão de UX/IA: Integrações já era escondida do menu do "equipe"
// (adminOnly na nav), mas nenhuma das 8 páginas sob essa rota checava role de
// verdade — um equipe que soubesse a URL entrava normalmente. Aparência e
// Documentação/API pública expõem segredos reais (chaves de API, tokens de
// integração de pagamento), então o guard cobre a seção inteira aqui, uma vez,
// em vez de repetir a checagem em cada page.tsx.
export default async function IntegracoesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') redirect('/admin')

  return children
}
