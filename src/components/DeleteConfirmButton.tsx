'use client'

import { useState, useTransition } from 'react'
import { ConfirmModal } from '@/components/ConfirmModal'

interface Props {
  /** Pode devolver `{ error }` — nesse caso o erro aparece junto ao botão em vez de fechar silenciosamente. */
  onDelete: () => Promise<unknown> | void
  title: string
  message: string
  confirmLabel?: string
  dangerWord?: string
  className?: string
  children?: React.ReactNode
}

function hasErrorMessage(result: unknown): result is { error: string } {
  return typeof result === 'object' && result !== null && 'error' in result && typeof (result as { error: unknown }).error === 'string'
}

export function DeleteConfirmButton({
  onDelete,
  title,
  message,
  confirmLabel = 'Excluir',
  dangerWord,
  className = 'text-xs font-medium text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition',
  children = 'Excluir',
}: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await onDelete()
      if (hasErrorMessage(result)) setError(result.error)
    })
  }

  return (
    <>
      <button type="button" onClick={() => { setError(null); setOpen(true) }} disabled={isPending} className={className}>
        {isPending ? 'Excluindo...' : children}
      </button>
      {error && <span className="ml-2 text-xs text-red-500">{error}</span>}
      <ConfirmModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title={title}
        message={message}
        confirmLabel={confirmLabel}
        dangerWord={dangerWord}
      />
    </>
  )
}
