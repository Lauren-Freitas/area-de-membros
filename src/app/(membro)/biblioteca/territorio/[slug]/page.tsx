import { redirect } from 'next/navigation'

/** URL amigável/compartilhável pro território -- a experiência real é uma só, em /biblioteca. */
export default async function TerritorioRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/biblioteca?territorio=${encodeURIComponent(slug)}`)
}
