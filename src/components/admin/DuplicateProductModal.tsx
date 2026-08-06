'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/Button'
import type { DuplicateMode } from '@/lib/core/products'

interface Props {
  productTitle: string
  onClose: () => void
  onConfirm: (mode: DuplicateMode) => void
  pending?: boolean
}

const OPTIONS: { value: DuplicateMode; label: string; description: string }[] = [
  { value: 'full', label: 'Cópia completa', description: 'Produto, módulos, aulas e anexos. Ideal para criar uma nova turma a partir desta.' },
  { value: 'shallow', label: 'Apenas produto', description: 'Só o cadastro — sem módulos, aulas ou anexos. Mais rápido.' },
]

/** Duplicar sempre pergunta o modo — nunca copia certificados (recibo de conclusão por aluno, não conteúdo). */
export function DuplicateProductModal({ productTitle, onClose, onConfirm, pending = false }: Props) {
  const [mode, setMode] = useState<DuplicateMode>('full')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !pending) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, pending])

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={() => !pending && onClose()}
    >
      <div
        className="bg-white dark:bg-[#1a1f35] rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-base">Duplicar produto</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{productTitle}</p>
        </div>

        <div className="flex flex-col gap-2">
          {OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition"
              style={mode === opt.value
                ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand-bg)' }
                : { borderColor: 'var(--brand-border)' }}
            >
              <span
                className="w-4 h-4 mt-0.5 rounded-full border-2 shrink-0 flex items-center justify-center"
                style={{ borderColor: mode === opt.value ? 'var(--brand)' : '#d1d5db' }}
              >
                {mode === opt.value && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--brand)' }} />}
              </span>
              <span>
                <span className="block text-sm font-medium" style={mode === opt.value ? { color: 'var(--brand-text)' } : { color: 'var(--foreground)' }}>
                  {opt.label}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.description}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="secondary" onClick={onClose} disabled={pending}>Cancelar</Button>
          <Button onClick={() => onConfirm(mode)} disabled={pending}>{pending ? 'Duplicando...' : 'Duplicar'}</Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
