import { redirect } from 'next/navigation'

/** XP, conquistas e ranking foram consolidados em uma única área — Progresso. */
export default function PerfilRedirectPage() {
  redirect('/progresso')
}
