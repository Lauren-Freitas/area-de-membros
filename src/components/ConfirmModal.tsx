'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  /** Se fornecido, o utilizador deve digitar esta palavra para confirmar */
  dangerWord?: string
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  dangerWord,
}: Props) {
  const [typed, setTyped] = useState('')

  useEffect(() => {
    if (!isOpen) setTyped('')
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const canConfirm = !dangerWord || typed === dangerWord

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
        {/* Ícone */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-base">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{message}</p>
          </div>
        </div>

        {/* Campo obrigatório */}
        {dangerWord && (
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500 dark:text-gray-400">
              Digite <span className="font-mono font-bold text-red-500">{dangerWord}</span> para confirmar:
            </label>
            <input
              type="text"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2a2f45] bg-white dark:bg-[#0d1020] text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-400"
              autoFocus
              placeholder={dangerWord}
            />
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#252a40] transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => { if (canConfirm) { onConfirm(); onClose() } }}
            disabled={!canConfirm}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
