'use client'

import { useState, useTransition } from 'react'
import { grantAccess, revokeAccess, updateAccessExpiry } from '@/lib/actions/admin'
import { DeleteConfirmButton } from '@/components/DeleteConfirmButton'

interface Props {
  userId: string
  productId: string
  title: string
  hasAccess: boolean
  expiresAt: string | null
}

export function AccessCard({ userId, productId, title, hasAccess: initialHasAccess, expiresAt: initialExpiresAt }: Props) {
  const [hasAccess, setHasAccess] = useState(initialHasAccess)
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [accessType, setAccessType] = useState<'permanent' | 'date' | 'days'>(initialExpiresAt ? 'date' : 'permanent')
  const [dateVal, setDateVal] = useState(initialExpiresAt ? initialExpiresAt.slice(0, 10) : '')
  const [days, setDays] = useState(30)

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false

  function handleGrant() {
    startTransition(async () => {
      await grantAccess(userId, productId)
      setHasAccess(true)
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
    })
  }

  if (!hasAccess) {
    return (
      <button
        type="button"
        onClick={handleGrant}
        disabled={isPending}
        className="flex items-center gap-2 p-3.5 rounded-xl border border-dashed border-gray-200 text-sm text-gray-500 hover:border-gray-300 hover:bg-gray-50 transition disabled:opacity-60"
      >
        <span style={{ color: 'var(--brand)' }}>+</span>
        <span className="truncate">{isPending ? 'Liberando...' : title}</span>
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="font-semibold text-sm text-gray-900 truncate">{title}</p>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${isExpired ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'}`}>
          {isExpired ? 'Expirado' : 'Ativo'}
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        {expiresAt ? `Válido até ${new Date(expiresAt).toLocaleDateString('pt-BR')}` : 'Acesso permanente'}
      </p>

      {editing ? (
        <div className="space-y-2 border-t border-gray-100 pt-3">
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
                className="px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                style={accessType === opt.value ? { backgroundColor: 'var(--brand)', color: '#fff' } : { backgroundColor: '#f3f4f6', color: '#374151' }}
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
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2"
            />
          )}
          {accessType === 'days' && (
            <div className="flex items-center gap-1.5">
              {[30, 90, 365].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                  style={days === d ? { backgroundColor: 'var(--brand)', color: '#fff' } : { backgroundColor: '#f3f4f6', color: '#374151' }}
                >
                  {d}
                </button>
              ))}
              <input
                type="number"
                min={1}
                value={days}
                onChange={e => setDays(parseInt(e.target.value) || 0)}
                className="w-16 px-2 py-1 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2"
              />
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveValidity}
              disabled={isPending}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition disabled:opacity-60"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            Editar
          </button>
          <DeleteConfirmButton
            onDelete={async () => { await revokeAccess(userId, productId); setHasAccess(false) }}
            title="Remover acesso"
            message={`O acesso a "${title}" será revogado imediatamente.`}
            confirmLabel="Remover"
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition"
          >
            Remover
          </DeleteConfirmButton>
        </div>
      )}
    </div>
  )
}
