'use client'

import { useEffect } from 'react'
import { Button } from '@/components/Button'

/**
 * Boundary do grupo (admin) -- AdminShell (sidebar) continua de pé ao redor,
 * só o conteúdo de {children} é substituído por esta tela quando algo não
 * previsto quebra o render de uma página admin.
 */
export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Algo deu errado</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        Não conseguimos carregar esta página agora. Tente novamente — se o problema continuar, verifique os logs.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => unstable_retry()}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Tentar novamente
        </Button>
        <Button href="/admin" variant="secondary">
          Voltar ao início
        </Button>
      </div>
    </div>
  )
}
