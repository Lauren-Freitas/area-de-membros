import { Button } from '@/components/Button'

/** Conteúdo tipo link externo (ex: material no Notion) — usado por aula e produto avulso. */
export function LinkContent({ url, title }: { url: string | null; title: string }) {
  if (!url) return <div className="p-8 text-gray-400 text-center">Link não disponível.</div>
  return (
    <div className="p-8 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--brand-bg)' }}>
        <svg className="w-8 h-8" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 mt-1 break-all">{url}</p>
      </div>
      <Button href={url}>
        Acessar link
      </Button>
    </div>
  )
}
