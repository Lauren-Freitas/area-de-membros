import { redirect } from 'next/navigation'

/** Assinatura virou uma aba dentro de Conta. */
export default function AssinaturaRedirectPage() {
  redirect('/conta?tab=assinatura')
}
