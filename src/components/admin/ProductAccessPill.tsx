'use client'

import { useState, useTransition } from 'react'
import { grantAccess, revokeAccess } from '@/lib/actions/admin'

interface Props {
  title: string
  hasAccess: boolean
  userId: string
  productId: string
}

export function ProductAccessPill({ title, hasAccess: initialAccess, userId, productId }: Props) {
  const [hasAccess, setHasAccess] = useState(initialAccess)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      if (hasAccess) {
        await revokeAccess(userId, productId)
        setHasAccess(false)
      } else {
        await grantAccess(userId, productId)
        setHasAccess(true)
      }
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={hasAccess ? 'Clique para revogar acesso' : 'Clique para liberar acesso'}
      className="text-xs font-medium px-3 py-1.5 rounded-full border transition-all disabled:opacity-50"
      style={hasAccess
        ? { backgroundColor: '#fdf6e8', color: '#7a5c10', borderColor: '#e8d5a3' }
        : { backgroundColor: '#f9fafb', color: '#6b7280', borderColor: '#e5e7eb' }
      }
      onMouseEnter={e => {
        if (isPending) return
        const el = e.currentTarget
        el.style.backgroundColor = hasAccess ? '#fef2f2' : '#fdf6e8'
        el.style.color = hasAccess ? '#dc2626' : '#7a5c10'
        el.style.borderColor = hasAccess ? '#fecaca' : '#e8d5a3'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.backgroundColor = hasAccess ? '#fdf6e8' : '#f9fafb'
        el.style.color = hasAccess ? '#7a5c10' : '#6b7280'
        el.style.borderColor = hasAccess ? '#e8d5a3' : '#e5e7eb'
      }}
    >
      {isPending ? '...' : hasAccess ? '✓ ' : '+ '}
      {title}
    </button>
  )
}
