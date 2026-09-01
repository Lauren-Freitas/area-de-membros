'use client'

import { useTransition } from 'react'
import { toggleCategoryActive } from '@/lib/actions/admin'

export function ToggleCategoryButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await toggleCategoryActive(id, !isActive)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition disabled:opacity-50 ${
        isActive
          ? 'text-red-600 border-red-100 hover:bg-red-50'
          : 'text-green-700 border-green-100 hover:bg-green-50'
      }`}
    >
      {isPending ? '...' : isActive ? 'Desativar' : 'Reativar'}
    </button>
  )
}
