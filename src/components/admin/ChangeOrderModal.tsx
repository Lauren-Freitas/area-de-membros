'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/Button'

interface Props {
  isOpen: boolean
  onClose: () => void
  currentOrder: number
  onSave: (order: number) => void
}

export function ChangeOrderModal({ isOpen, onClose, currentOrder, onSave }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handleSave() {
    onSave(parseInt(inputRef.current?.value ?? '') || 0)
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1f35] rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-base">Alterar ordem</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Posição do produto na listagem — menor aparece primeiro.</p>
        </div>

        {/* Não controlado de propósito: o componente já desmonta o input inteiro ao
            fechar (return null acima), então ele sempre nasce com o valor atual —
            sem precisar sincronizar via effect. */}
        <input
          ref={inputRef}
          type="number"
          defaultValue={currentOrder}
          autoFocus
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2a2f45] bg-card text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
        />

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
