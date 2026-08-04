'use client'

import { useState, useTransition } from 'react'
import { ConfirmModal } from '@/components/ConfirmModal'

interface Props {
  onDelete: () => Promise<unknown> | void
  title: string
  message: string
  confirmLabel?: string
  dangerWord?: string
  className?: string
  children?: React.ReactNode
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
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => { await onDelete() })
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={isPending} className={className}>
        {isPending ? 'Excluindo...' : children}
      </button>
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
