import { redirect } from 'next/navigation'

/** Ranking virou uma aba dentro de Progresso. */
export default function RankingRedirectPage() {
  redirect('/progresso?tab=ranking')
}
