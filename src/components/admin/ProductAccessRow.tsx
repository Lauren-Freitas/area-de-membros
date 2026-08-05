'use client'

import { useState, useTransition } from 'react'
import { grantAccess, revokeAccess, updateAccessExpiry } from '@/lib/actions/admin'
import { ConfirmModal } from '@/components/ConfirmModal'

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
  const [editing, setEditing] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [accessType, setAccessType] = useState<'permanent' | 'date' | 'days'>(initialExpiresAt ? 'date' : 'permanent')
  const [dateVal, setDateVal] = useState(initialExpiresAt ? initialExpiresAt.slice(0, 10) : '')
  const [days, setDays] = useState(30)

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
      setEditing(false)
      onChanged?.(false, null)
    })
  }

  function handleSaveValidity() {
    let newExpiresAt: string | null = null
    if (accessType === 'date' && dateVal) newExpiresAt = new Date(dateVal).toISOString()
    if (accessType === 'days') {
      const d = new Date()
      d.setDate(d.getDate() + days)
      newExpiresAt = d.toISOString()
    }
    startTransition(async () => {
      await updateAccessExpiry(userId, productId, newExpiresAt)
      setExpiresAt(newExpiresAt)
      setEditing(false)
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
        {/* Clicar no nome expande a validade inline — o checkbox é o único jeito de revogar, pra não confundir os dois gestos. */}
        <button
          type="button"
          onClick={() => setEditing(v => !v)}
          className="flex-1 min-w-0 text-left text-sm font-medium text-gray-900 dark:text-white truncate"
        >
          {title}
        </button>
      </div>

      {editing ? (
        <div className="mt-2 ml-6 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {([
              { value: 'permanent', label: 'Permanente' },
              { value: 'date', label: 'Até uma data' },
              { value: 'days', label: 'Por dias' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAccessType(opt.value)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition"
                style={accessType === opt.value ? { backgroundColor: 'var(--brand)', color: '#fff' } : { backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {accessType === 'date' && (
            <input
              type="date"
              value={dateVal}
              onChange={e => setDateVal(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-[#2a2f45] text-xs bg-card focus:outline-none"
            />
          )}
          {accessType === 'days' && (
            <div className="flex items-center gap-1.5">
              {[30, 90, 365].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition"
                  style={days === d ? { backgroundColor: 'var(--brand)', color: '#fff' } : { backgroundColor: 'var(--brand-bg)', color: 'var(--brand-text)' }}
                >
                  {d}
                </button>
              ))}
              <input
                type="number"
                min={1}
                value={days}
                onChange={e => setDays(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-[#2a2f45] text-xs bg-card focus:outline-none"
              />
            </div>
          )}
          <div className="flex gap-2 pt-0.5">
            <button type="button" onClick={handleSaveValidity} disabled={isPending} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition disabled:opacity-60" style={{ backgroundColor: 'var(--brand)' }}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs font-medium px-3 py-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a2035] transition">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ml-6 mt-1 flex items-center justify-between gap-2 w-[calc(100%-1.5rem)] text-left group"
        >
          <span className="text-xs text-gray-400">{expiresAt ? `Expira em ${fmtDate(expiresAt)}` : 'Acesso permanente'}</span>
          <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition shrink-0" style={{ color: 'var(--brand)' }}>
            Editar validade
          </span>
        </button>
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
