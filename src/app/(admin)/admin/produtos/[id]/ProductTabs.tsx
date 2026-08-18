'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ProductForm } from './ProductForm'
import { ModulesManager } from '@/components/admin/ModulesManager'
import { DeleteConfirmButton } from '@/components/DeleteConfirmButton'
import { Badge, type BadgeTone } from '@/components/Badge'
import { EmptyState } from '@/components/EmptyState'
import { grantAccess, revokeAccess } from '@/lib/actions/admin'
import { PaymentStatusBadge } from '@/components/admin/PaymentStatusBadge'
import { Product, Module, Lesson, PaymentStatus } from '@/types'

export interface AccessRow {
  id: string
  user_id: string
  granted_at: string
  granted_by: string
  expires_at: string | null
  payment_status: string | null
  value: number | null
  is_completed: boolean | null
  profile: { name: string; email: string } | null
}

const ORIGIN_LABEL: Record<string, string> = { purchase: 'Compra', pack: 'Pacote', manual: 'Manual', api: 'API' }
const TABS = [
  { key: 'visao', label: 'Visão geral' },
  { key: 'conteudo', label: 'Conteúdo' },
  { key: 'acessos', label: 'Acessos' },
  { key: 'vendas', label: 'Vendas' },
  { key: 'config', label: 'Configurações' },
] as const
type TabKey = typeof TABS[number]['key']

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ProductTabs({
  productId,
  product,
  modules,
  accessRows,
  availableMembers,
}: {
  productId: string
  product: Product
  modules: (Module & { lessons: Lesson[] })[]
  accessRows: AccessRow[]
  availableMembers: { id: string; name: string; email: string }[]
}) {
  const [tab, setTab] = useState<TabKey>('visao')

  const now = new Date()
  const activeAccesses = accessRows.filter(a => !a.expires_at || new Date(a.expires_at) > now)
  const sales = accessRows.filter(a => a.granted_by === 'purchase' || a.granted_by === 'pack')
  const revenue = sales.reduce((sum, a) => sum + (a.value ?? 0), 0)
  const isCourse = modules.length > 0
  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.filter(l => l.is_published).length ?? 0), 0)
  const completedCount = accessRows.filter(a => a.is_completed).length
  const completionPct = accessRows.length > 0 ? Math.round((completedCount / accessRows.length) * 100) : 0

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-100 overflow-x-auto scrollbar-none">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${
              tab === t.key ? 'border-current' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
            style={tab === t.key ? { color: 'var(--brand)', borderColor: 'var(--brand)' } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'visao' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Membros com acesso" value={accessRows.length} />
            <StatCard label="Acessos ativos" value={activeAccesses.length} />
            <StatCard label="Vendas" value={sales.length} />
            <StatCard label="Receita gerada" value={fmtCurrency(revenue)} />
          </div>
          {isCourse && accessRows.length > 0 && (
            <div className="bg-card rounded-2xl border border-gray-100 p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Taxa de conclusão</p>
              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold" style={{ color: 'var(--brand)' }}>{completionPct}%</p>
                <p className="text-sm text-gray-500">{completedCount} de {accessRows.length} concluíram o curso ({totalLessons} aulas)</p>
              </div>
            </div>
          )}
          {accessRows.length === 0 && (
            <div className="bg-card rounded-2xl border border-dashed border-gray-200">
              <EmptyState title="Ainda sem membros com acesso a este produto." />
            </div>
          )}
        </div>
      )}

      {tab === 'conteudo' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Módulos</h2>
            <Link
              href={`/admin/produtos/${productId}/modulos/novo`}
              className="px-4 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              + Novo módulo
            </Link>
          </div>
          <ModulesManager productId={productId} initialModules={modules} />
        </div>
      )}

      {tab === 'acessos' && (
        <AcessosTab productId={productId} accessRows={accessRows} availableMembers={availableMembers} />
      )}

      {tab === 'vendas' && (
        <div className="bg-card rounded-2xl border border-gray-100 p-5">
          {sales.length === 0 ? (
            <EmptyState title="Nenhuma venda deste produto ainda." />
          ) : (
            <>
              <div className="flex items-center pb-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <span className="flex-1">Membro</span>
                <span className="w-28 text-right">Valor</span>
                <span className="w-36">Data</span>
                <span className="w-28">Status</span>
              </div>
              <div className="divide-y divide-gray-100">
                {sales.map(s => (
                  <div key={s.id} className="flex items-center py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{s.profile?.name ?? '-'}</p>
                      <p className="text-xs text-gray-400">{s.profile?.email}</p>
                    </div>
                    <div className="w-28 text-right text-sm text-gray-700 shrink-0">
                      {s.value != null ? fmtCurrency(s.value) : '-'}
                    </div>
                    <div className="w-36 text-sm text-gray-400 shrink-0">{fmtDate(s.granted_at)}</div>
                    <div className="w-28 shrink-0">
                      <PaymentStatusBadge status={s.payment_status as PaymentStatus | null} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'config' && (
        <div className="bg-card rounded-2xl border border-gray-100 p-6 sm:p-8">
          <ProductForm product={product} />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card rounded-2xl border border-gray-100 p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold" style={{ color: 'var(--brand)' }}>{value}</p>
    </div>
  )
}

function AcessosTab({
  productId,
  accessRows,
  availableMembers,
}: {
  productId: string
  accessRows: AccessRow[]
  availableMembers: { id: string; name: string; email: string }[]
}) {
  const [selectedMember, setSelectedMember] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleGrant() {
    if (!selectedMember) return
    setError(null)
    startTransition(async () => {
      const result = await grantAccess(selectedMember, productId)
      if (result && typeof result === 'object' && 'error' in result && result.error) setError(String(result.error))
      else setSelectedMember('')
    })
  }

  return (
    <div className="space-y-4">
      {availableMembers.length > 0 && (
        <div className="bg-card rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
          <select
            value={selectedMember}
            onChange={e => setSelectedMember(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:border-transparent"
          >
            <option value="">Selecione um membro pra conceder acesso...</option>
            {availableMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
            ))}
          </select>
          <button
            onClick={handleGrant}
            disabled={!selectedMember || isPending}
            className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-50 shrink-0"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            {isPending ? 'Concedendo...' : 'Conceder acesso'}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="bg-card rounded-2xl border border-gray-100 p-5">
        {accessRows.length === 0 ? (
          <EmptyState title="Nenhum membro com acesso a este produto ainda." />
        ) : (
          <>
            <div className="flex items-center pb-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span className="flex-1">Membro</span>
              <span className="w-24">Origem</span>
              <span className="w-36">Concedido em</span>
              <span className="w-36">Validade</span>
              <span className="w-24 text-right">Ações</span>
            </div>
            <div className="divide-y divide-gray-100">
              {accessRows.map(a => {
                const expired = a.expires_at ? new Date(a.expires_at) < new Date() : false
                const tone: BadgeTone = a.granted_by === 'manual' ? 'neutral' : 'brand'
                return (
                  <div key={a.id} className="flex items-center py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{a.profile?.name ?? '-'}</p>
                      <p className="text-xs text-gray-400">{a.profile?.email}</p>
                    </div>
                    <div className="w-24 shrink-0">
                      <Badge tone={tone}>{ORIGIN_LABEL[a.granted_by] ?? a.granted_by}</Badge>
                    </div>
                    <div className="w-36 text-sm text-gray-400 shrink-0">{fmtDate(a.granted_at)}</div>
                    <div className="w-36 text-sm shrink-0">
                      {a.expires_at ? (
                        <span className={expired ? 'text-red-500' : 'text-gray-500'}>
                          {expired ? 'Expirado em ' : ''}{fmtDate(a.expires_at)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--brand)' }}>Vitalício</span>
                      )}
                    </div>
                    <div className="w-24 shrink-0 flex justify-end">
                      <DeleteConfirmButton
                        onDelete={() => revokeAccess(a.user_id, productId)}
                        title="Revogar acesso"
                        message={`O acesso de ${a.profile?.name ?? 'este membro'} a este produto será revogado.`}
                        confirmLabel="Revogar"
                        className="text-xs font-medium text-red-400 hover:text-red-600 px-2.5 py-1 rounded-lg border border-red-100 hover:bg-red-50 transition"
                      >
                        Revogar
                      </DeleteConfirmButton>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
