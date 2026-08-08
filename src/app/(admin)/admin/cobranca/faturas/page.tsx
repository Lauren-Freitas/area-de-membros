import { redirect } from 'next/navigation'

// "Faturas" foi renomeada pra "Acessos" — o nome antigo não refletia o que a
// página mostra de verdade (não existe documento de fatura no schema, é
// histórico de concessões de acesso). Redirect por segurança, caso alguém
// tenha essa URL salva.
export default function FaturasRedirectPage() {
  redirect('/admin/cobranca/acessos')
}
