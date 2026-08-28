'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { markWelcomeSeen } from '@/lib/actions/member'

export function WelcomeModal({ firstName, platformName }: { firstName: string; platformName: string }) {
  const [dismissed, setDismissed] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (dismissed) return null

  function handleStart() {
    setDismissed(true)
    startTransition(async () => { await markWelcomeSeen() })
  }

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl p-8 text-center">
        <p className="text-4xl mb-3">👋</p>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Boas-vindas{firstName ? `, ${firstName}` : ''}!</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-1">
          Obrigado por confiar no meu trabalho. Espero que este conteúdo ajude você a evoluir cada vez mais.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Bom estudo!</p>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-6">{platformName}</p>
        <button
          type="button"
          onClick={handleStart}
          disabled={isPending}
          className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          Começar agora
        </button>
      </div>
    </div>,
    document.body
  )
}
