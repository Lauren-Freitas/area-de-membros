'use client'

import { useRef, useState } from 'react'
import { deleteModule } from '@/lib/actions/admin'
import { ConfirmModal } from '@/components/ConfirmModal'

interface Props {
  moduleId: string
  productId: string
  moduleTitle: string
}

export function DeleteModuleButton({ moduleId, productId, moduleTitle }: Props) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <>
      <form ref={formRef} action={deleteModule.bind(null, moduleId, productId)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition"
        >
          Excluir
        </button>
      </form>
      <ConfirmModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => formRef.current?.requestSubmit()}
        title="Excluir módulo"
        message={`O módulo "${moduleTitle}" e todas as suas aulas serão excluídos permanentemente.`}
        confirmLabel="Excluir módulo"
      />
    </>
  )
}
