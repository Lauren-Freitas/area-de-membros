'use client'

import { useState, useTransition } from 'react'
import { deleteUser } from '@/lib/actions/admin'
import { useRouter } from 'next/navigation'

export function EquipeExcluirButton({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUser(userId)
      if (result?.error) {
        setError(result.error)
      } else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setConfirmText(''); setError(null) }}
        className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
      >
        Excluir
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Excluir colaborador</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Isso removerá <span className="font-medium text-gray-700 dark:text-gray-200">{name}</span> permanentemente.
              Digite <span className="font-mono font-bold text-red-500">excluir</span> para confirmar.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="excluir"
              autoFocus
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={confirmText !== 'excluir' || isPending}
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 disabled:opacity-40 transition"
              >
                {isPending ? 'Excluindo...' : 'Confirmar exclusão'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
