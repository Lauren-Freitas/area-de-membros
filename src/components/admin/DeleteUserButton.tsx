'use client'

import { deleteUser } from '@/lib/actions/admin'

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  async function handleDelete() {
    if (!confirm(`Excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) return
    await deleteUser(userId)
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs font-medium px-3 py-1.5 rounded-full border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition"
    >
      Excluir
    </button>
  )
}
