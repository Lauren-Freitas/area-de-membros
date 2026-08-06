'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/Button'

interface Props {
  onClose: () => void
  productTitle: string
  currentExpiresAt: string | null
  onSave: (expiresAt: string | null) => void
}

/**
 * "Editar validade" — permanente ou até uma data específica. Sem prop
 * `isOpen`: o chamador só monta este componente quando quiser mostrá-lo
 * (`{editing && <AccessExpiryModal ... />}`), então cada abertura já nasce
 * com o valor atual do produto — sem precisar de um effect pra sincronizar.
 */
export function AccessExpiryModal({ onClose, productTitle, currentExpiresAt, onSave }: Props) {
  const [mode, setMode] = useState<'permanent' | 'date'>(currentExpiresAt ? 'date' : 'permanent')
  const [dateVal, setDateVal] = useState(currentExpiresAt ? currentExpiresAt.slice(0, 10) : '')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSave() {
    const expiresAt = mode === 'date' && dateVal ? new Date(dateVal).toISOString() : null
    onSave(expiresAt)
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
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-base">Editar validade</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{productTitle}</p>
        </div>

        <div className="flex flex-col gap-2">
          {([
            { value: 'permanent', label: 'Permanente' },
            { value: 'date', label: 'Expira em data' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition"
              style={mode === opt.value
                ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' }
                : { borderColor: 'var(--brand-border)' }}
            >
              <span
                className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                style={{ borderColor: mode === opt.value ? 'var(--brand)' : '#d1d5db' }}
              >
                {mode === opt.value && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand)' }} />}
              </span>
              {opt.label}
            </button>
          ))}
        </div>

        {mode === 'date' && (
          <input
            type="date"
            value={dateVal}
            onChange={e => setDateVal(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2a2f45] bg-card text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
          />
        )}

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={mode === 'date' && !dateVal}>Salvar</Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
