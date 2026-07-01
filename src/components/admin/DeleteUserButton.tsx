'use client'

import { useState } from 'react'
import { deleteUser } from '@/lib/actions/admin'
import { ConfirmModal } from '@/components/ConfirmModal'

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false)

  async function handleConfirm() {
    await deleteUser(userId)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium px-3 py-1.5 rounded-full border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition"
      >
        Excluir
      </button>
      <ConfirmModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title="Excluir usuário"
        message={`O usuário "${userName}" será excluído permanentemente. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        dangerWord="EXCLUIR"
      />
    </>
  )
}
