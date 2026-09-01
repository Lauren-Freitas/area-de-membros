import { redirect } from 'next/navigation'

/** Território saiu da navegação da Biblioteca -- link antigo cai na experiência atual, sem filtro. */
export default async function TerritorioRedirectPage() {
  redirect('/biblioteca')
}
