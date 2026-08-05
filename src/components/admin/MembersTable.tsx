'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/Button'
import { MemberActionsMenu } from '@/components/admin/MemberActionsMenu'
import { MemberDrawer } from '@/components/admin/MemberDrawer'
import { ManageAccessModal } from '@/components/admin/ManageAccessModal'
import {
  listMembers, getMemberDetail,
  type MemberSummary, type MemberFilter, type MemberSort, type MemberProductAccess,
} from '@/lib/actions/members'

const PAGE_SIZE = 25

const FILTERS: { value: MemberFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'expiring', label: 'Expirando' },
  { value: 'no-access', label: 'Sem acesso' },
  { value: 'subscribers', label: 'Assinantes' },
]

const SORTS: { value: MemberSort; label: string }[] = [
  { value: 'created', label: 'Cadastro (recente)' },
  { value: 'name', label: 'Nome (A-Z)' },
  { value: 'last_login', label: 'Último acesso' },
  { value: 'expiry', label: 'Expiração' },
]

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase() || '?'
}

function fmtRelativeDate(iso: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  const days = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (days <= 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  if (days < 30) return `${days} dias atrás`
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function expiryInfo(member: MemberSummary): { label: string; tone: 'muted' | 'warning' | 'danger' } {
  if (member.products_count === 0) return { label: '—', tone: 'muted' }
  if (!member.next_expiry) return { label: 'Permanente', tone: 'muted' }
  const diffDays = Math.ceil((new Date(member.next_expiry).getTime() - Date.now()) / 86400000)
  if (diffDays < 0) return { label: `Expirou há ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}`, tone: 'danger' }
  if (diffDays === 0) return { label: 'Expira hoje', tone: 'warning' }
  return { label: `Expira em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`, tone: diffDays <= 7 ? 'warning' : 'muted' }
}

function statusInfo(member: MemberSummary): { color: string; label: string } {
  if (member.is_active === false) return { color: 'bg-red-500', label: 'Inativo' }
  if (member.next_expiry) {
    const diffDays = Math.ceil((new Date(member.next_expiry).getTime() - Date.now()) / 86400000)
    if (diffDays === 0) return { color: 'bg-amber-500', label: 'Expira hoje' }
    if (diffDays > 0 && diffDays <= 7) return { color: 'bg-orange-500', label: 'Expira em breve' }
  }
  return { color: 'bg-green-500', label: 'Ativo' }
}

function ProductChips({ titles }: { titles: string[] }) {
  if (titles.length === 0) return <span className="text-xs text-gray-300">—</span>
  const visible = titles.slice(0, 3)
  const rest = titles.slice(3)
  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map(t => (
        <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1a2035] text-gray-600 dark:text-gray-300 truncate max-w-[100px]" title={t}>
          {t}
        </span>
      ))}
      {rest.length > 0 && (
        <span className="relative group/tip">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1a2035] text-gray-500 dark:text-gray-400 cursor-default">
            +{rest.length}
          </span>
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover/tip:block whitespace-nowrap rounded-lg bg-gray-900 text-white text-[11px] px-2.5 py-1.5 shadow-lg z-20">
            {rest.join(', ')}
          </span>
        </span>
      )}
    </div>
  )
}

interface Props {
  initialMembers: MemberSummary[]
  initialTotal: number
}

export function MembersTable({ initialMembers, initialTotal }: Props) {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<MemberFilter>('all')
  const [sort, setSort] = useState<MemberSort>('created')
  const [page, setPage] = useState(1)
  const [members, setMembers] = useState(initialMembers)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const isFirstRender = useRef(true)

  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [manageAccess, setManageAccess] = useState<{ userId: string; name: string; products: MemberProductAccess[] } | null>(null)

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchPage = useCallback(async () => {
    setLoading(true)
    const result = await listMembers({ search, filter, sort, page, pageSize: PAGE_SIZE })
    setMembers(result.members)
    setTotal(result.total)
    setLoading(false)
  }, [search, filter, sort, page])

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    fetchPage()
  }, [fetchPage])

  function handleFilterChange(f: MemberFilter) { setFilter(f); setPage(1) }
  function handleSortChange(s: MemberSort) { setSort(s); setPage(1) }

  async function openManageAccess(userId: string, name: string) {
    const detail = await getMemberDetail(userId)
    if (detail) setManageAccess({ userId, name, products: detail.productAccess })
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar membros</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gerencie acessos, permissões e assinaturas dos membros da plataforma.</p>
        </div>
        <Button href="/admin/usuarios/novo" className="shrink-0">Novo membro</Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-gray-200 dark:border-[#2a2f45] rounded-lg px-3 py-2 flex-1 min-w-[200px] max-w-xs bg-card">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Pesquisar membro..."
            className="flex-1 text-sm bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition ${
                filter === f.value ? 'text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a2035]'
              }`}
              style={filter === f.value ? { backgroundColor: 'var(--brand)' } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={e => handleSortChange(e.target.value as MemberSort)}
          className="ml-auto text-sm border border-gray-200 dark:border-[#2a2f45] rounded-lg px-3 py-2 bg-card text-gray-600 dark:text-gray-300 outline-none"
        >
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Tabela — sem overflow-x-auto de propósito: isso cliparia o menu "⋯" de linhas
          mais abaixo (overflow-x auto força overflow-y para auto também, cortando
          dropdowns que abrem pra baixo). Ferramenta desktop-first; aceita scroll de
          página inteira em telas muito estreitas em troca do menu nunca ser cortado. */}
      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030]">
        <div className={`transition-opacity duration-150 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 dark:border-[#1e2030] text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            <span className="flex-1">Membro</span>
            <span className="w-28 shrink-0">Status</span>
            <span className="w-56 shrink-0">Produtos</span>
            <span className="w-32 shrink-0">Expiração</span>
            <span className="w-24 shrink-0">Último acesso</span>
            <span className="w-8 shrink-0" />
          </div>

          {members.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              {search || filter !== 'all' ? 'Nenhum membro encontrado com esses filtros.' : 'Nenhum membro cadastrado ainda.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-[#161a2c]">
              {members.map(m => {
                const status = statusInfo(m)
                const expiry = expiryInfo(m)
                return (
                  <div
                    key={m.id}
                    onClick={() => setDrawerId(m.id)}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#12162a] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {m.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.avatar_url} alt={m.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ backgroundColor: 'var(--brand)' }}>
                          {getInitials(m.name || m.email)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.name || '(sem nome)'}</p>
                        <p className="text-xs text-gray-400 truncate">{m.email}</p>
                      </div>
                    </div>

                    <div className="w-28 shrink-0 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.color}`} />
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{status.label}</span>
                    </div>

                    <div className="w-56 shrink-0" onClick={e => e.stopPropagation()}>
                      <ProductChips titles={m.product_titles} />
                    </div>

                    <div className={`w-32 shrink-0 text-xs ${expiry.tone === 'danger' ? 'text-red-500' : expiry.tone === 'warning' ? 'text-orange-500' : 'text-gray-400'}`}>
                      {expiry.label}
                    </div>

                    <div className="w-24 shrink-0 text-xs text-gray-400">
                      {fmtRelativeDate(m.last_login_at)}
                    </div>

                    <div className="w-8 shrink-0" onClick={e => e.stopPropagation()}>
                      <MemberActionsMenu
                        member={m}
                        align="right"
                        trigger={({ toggle }) => (
                          <button
                            type="button"
                            onClick={toggle}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-[#1a2035] dark:hover:text-gray-200 transition"
                            aria-label="Ações"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 100-4 2 2 0 000 4zM10 12a2 2 0 100-4 2 2 0 000 4zM10 18a2 2 0 100-4 2 2 0 000 4z" />
                            </svg>
                          </button>
                        )}
                        onManageAccess={() => openManageAccess(m.id, m.name || m.email)}
                        onToggled={fetchPage}
                        onDeleted={fetchPage}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Paginação */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total.toLocaleString('pt-BR')}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-[#1a2035] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#232945] disabled:opacity-40 disabled:pointer-events-none transition"
            >
              Anterior
            </button>
            <span className="text-xs text-gray-400 px-1">{page} de {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-[#1a2035] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#232945] disabled:opacity-40 disabled:pointer-events-none transition"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {drawerId && (
        <MemberDrawer
          userId={drawerId}
          onClose={() => setDrawerId(null)}
          onManageAccess={(userId, name, products) => setManageAccess({ userId, name, products })}
          onMutated={fetchPage}
        />
      )}

      {manageAccess && (
        <ManageAccessModal
          isOpen
          onClose={() => { setManageAccess(null); fetchPage() }}
          memberName={manageAccess.name}
          userId={manageAccess.userId}
          products={manageAccess.products}
        />
      )}
    </div>
  )
}
