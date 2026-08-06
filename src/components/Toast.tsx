'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  message: string | null
}

/**
 * Toast discreto, auto-some sozinho — sem fila/contexto global de propósito,
 * é só pra confirmações rápidas tipo "Ordem salva" onde nada mais precisa
 * saber que ele existe. `visible` já nasce true: o chamador deve trocar a
 * `key` a cada nova mensagem pra forçar remount (senão duas mensagens iguais
 * seguidas não reiniciam o timer de exibição).
 */
export function Toast({ message }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (!message) return null

  return createPortal(
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[1000] transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-900 dark:bg-[#1a1f35] text-white text-sm shadow-lg">
        <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        {message}
      </div>
    </div>,
    document.body
  )
}
