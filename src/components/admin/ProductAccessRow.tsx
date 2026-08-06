'use client'

import { useState, useTransition } from 'react'
import { grantAccess, revokeAccess, updateAccessExpiry } from '@/lib/actions/admin'
import { ConfirmModal } from '@/components/ConfirmModal'
import { AccessExpiryModal } from '@/components/admin/AccessExpiryModal'

interface Props {
  userId: string
  productId: string
  title: string
  hasAccess: boolean
  expiresAt: string | null
  onChanged?: (hasAccess: boolean, expiresAt: string | null) => void
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function ProductAccessRow({ userId, productId, title, hasAccess: initialHasAccess, expiresAt: initialExpiresAt, onChanged }: Props) {
  const [hasAccess, setHasAccess] = useState(initialHasAccess)
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt)
  const [editingValidity, setEditingValidity] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleGrant() {
    startTransition(async () => {
      await grantAccess(userId, productId)
      setHasAccess(true)
      onChanged?.(true, null)
    })
  }

  function handleConfirmRevoke() {
    startTransition(async () => {
      await revokeAccess(userId, productId)
      setHasAccess(false)
      setExpiresAt(null)
      onChanged?.(false, null)
    })
  }

  function handleSaveValidity(newExpiresAt: string | null) {
    startTransition(async () => {
      await updateAccessExpiry(userId, productId, newExpiresAt)
      setExpiresAt(newExpiresAt)
      onChanged?.(true, newExpiresAt)
    })
  }

  if (!hasAccess) {
    return (
      <div
        onClick={handleGrant}
        className="py-2.5 flex items-center gap-2.5 cursor-pointer group"
      >
        <input type="checkbox" checked={false} readOnly disabled={isPending} className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 pointer-events-none shrink-0 disabled:opacity-50" />
        <span className="flex-1 min-w-0 text-sm text-gray-500 dark:text-gray-400 truncate">{title}</span>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); handleGrant() }}
          disabled={isPending}
          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition disabled:opacity-60 group-hover:brightness-95"
          style={{ backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Liberar
        </button>
      </div>
    )
  }

  return (
    <div className="py-2.5">
      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          checked
          disabled={isPending}
          onChange={() => setConfirmRevoke(true)}
          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 cursor-pointer shrink-0 disabled:opacity-50"
          style={{ accentColor: 'var(--brand)' }}
        />
        {/* Clicar no nome abre o modal de validade — o checkbox é o único jeito de revogar, pra não confundir os dois gestos. */}
        <button
          type="button"
          onClick={() => setEditingValidity(true)}
          className="flex-1 min-w-0 text-left text-sm font-medium text-gray-900 dark:text-white truncate"
        >
          {title}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setEditingValidity(true)}
        className="ml-6 mt-1 flex items-center justify-between gap-2 w-[calc(100%-1.5rem)] text-left group"
      >
        <span className="text-xs text-gray-400">{expiresAt ? `Expira em ${fmtDate(expiresAt)}` : 'Acesso permanente'}</span>
        <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition shrink-0" style={{ color: 'var(--brand)' }}>
          Editar validade
        </span>
      </button>

      {editingValidity && (
        <AccessExpiryModal
          productTitle={title}
          currentExpiresAt={expiresAt}
          onSave={handleSaveValidity}
          onClose={() => setEditingValidity(false)}
        />
      )}

      <ConfirmModal
        isOpen={confirmRevoke}
        onClose={() => setConfirmRevoke(false)}
        onConfirm={handleConfirmRevoke}
        title="Remover acesso"
        message={`O acesso a "${title}" será revogado imediatamente.`}
        confirmLabel="Remover"
      />
    </div>
  )
}
