'use client'

import { useRef, useState } from 'react'
import { deleteLesson } from '@/lib/actions/admin'
import { ConfirmModal } from '@/components/ConfirmModal'

interface Props {
  lessonId: string
  moduleId: string
  productId: string
  lessonTitle: string
}

export function DeleteLessonButton({ lessonId, moduleId, productId, lessonTitle }: Props) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <>
      <form ref={formRef} action={deleteLesson.bind(null, lessonId, moduleId, productId)}>
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
        title="Excluir aula"
        message={`A aula "${lessonTitle}" será excluída permanentemente.`}
        confirmLabel="Excluir aula"
      />
    </>
  )
}
