'use client'

import { useState } from 'react'
import { ProductAccessRow } from '@/components/admin/ProductAccessRow'
import type { MemberProductAccess } from '@/lib/actions/members'

interface Props {
  userId: string
  products: MemberProductAccess[]
}

/**
 * Lista de produtos agrupada em Ativos/Disponíveis — o único lugar que
 * gerencia acesso a produtos (vive na página de edição do membro).
 */
export function ProductAccessList({ userId, products: initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts)

  function handleChanged(productId: string, hasAccess: boolean, expiresAt: string | null) {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, hasAccess, expiresAt } : p))
  }

  const active = products.filter(p => p.hasAccess)
  const available = products.filter(p => !p.hasAccess)

  if (products.length === 0) {
    return <p className="text-sm text-gray-400">Nenhum produto ativo cadastrado.</p>
  }

  return (
    <div>
      {active.length > 0 && (
        <div className="mb-1">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-3 pb-1">Ativos</p>
          <div className="divide-y divide-gray-100 dark:divide-[#1e2030]">
            {active.map(p => (
              <ProductAccessRow
                key={p.id}
                userId={userId}
                productId={p.id}
                title={p.title}
                hasAccess={p.hasAccess}
                expiresAt={p.expiresAt}
                onChanged={(hasAccess, expiresAt) => handleChanged(p.id, hasAccess, expiresAt)}
              />
            ))}
          </div>
        </div>
      )}

      {available.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-3 pb-1">Disponíveis</p>
          <div className="divide-y divide-gray-100 dark:divide-[#1e2030]">
            {available.map(p => (
              <ProductAccessRow
                key={p.id}
                userId={userId}
                productId={p.id}
                title={p.title}
                hasAccess={p.hasAccess}
                expiresAt={p.expiresAt}
                onChanged={(hasAccess, expiresAt) => handleChanged(p.id, hasAccess, expiresAt)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
