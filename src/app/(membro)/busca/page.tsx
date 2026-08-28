import { redirect } from 'next/navigation'

/** A Biblioteca é a experiência oficial de descoberta agora -- busca antiga só redireciona, preservando o termo. */
export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  redirect(q?.trim() ? `/biblioteca?q=${encodeURIComponent(q.trim())}` : '/biblioteca')
}
