import { redirect } from 'next/navigation'

/** URL amigável/compartilhável pra categoria -- a experiência real é uma só, em /biblioteca. */
export default async function TrilhaRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/biblioteca?categoria=${encodeURIComponent(slug)}`)
}
