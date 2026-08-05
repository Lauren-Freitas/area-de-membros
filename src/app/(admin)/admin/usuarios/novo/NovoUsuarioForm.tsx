'use client'

import { useActionState, useState } from 'react'
import { createUser } from '@/lib/actions/admin'
import { Button } from '@/components/Button'

interface Product { id: string; title: string }

const inputClass = 'w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition'

export function NovoUsuarioForm({ products, isEquipe = false }: { products: Product[]; isEquipe?: boolean }) {
  const [state, action, isPending] = useActionState(createUser, undefined)
  const [selectedRole, setSelectedRole] = useState('admin')
  const [isActive, setIsActive] = useState(true)
  const [accessType, setAccessType] = useState<'permanent' | 'date' | 'days'>('permanent')
  const [accessDays, setAccessDays] = useState(30)

  return (
    <form action={action} className="space-y-6">
      {!isEquipe && <input type="hidden" name="role" value="membro" />}

      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="bg-card rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">
          {isEquipe ? 'Dados do colaborador' : 'Dados do membro'}
        </h2>

        {/* Aviso só para Admin (não para Equipe) */}
        {isEquipe && selectedRole === 'admin' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Este colaborador terá acesso completo ao painel administrativo.
          </div>
        )}

        {isEquipe ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                <input
                  name="name"
                  type="text"
                  required
                  className={inputClass}
                  style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de conta</label>
                <select
                  name="role"
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className={inputClass}
                  style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
                >
                  <option value="admin">Admin</option>
                  <option value="equipe">Equipe</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                className={inputClass}
                style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
                placeholder="Ex: joao@email.com"
              />
            </div>

            {/* Colaborador ativo */}
            <div className="flex items-start gap-3 pt-1">
              <div className="relative mt-0.5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive(v => !v)}
                  className="w-11 h-6 rounded-full transition-colors duration-200 relative focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-400"
                  style={{ backgroundColor: isActive ? '#22c55e' : '#d1d5db' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-card rounded-full shadow transition-transform duration-200"
                    style={{ transform: isActive ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
                {isActive && <input type="hidden" name="is_active" value="on" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Colaborador ativo</p>
                <p className="text-xs text-gray-400">{isActive ? 'Com acesso à plataforma' : 'Acesso suspenso'}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input
                name="name"
                type="text"
                required
                className={inputClass}
                style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
                placeholder="Ex: João Silva"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                className={inputClass}
                style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
                placeholder="Ex: joao@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
                <span className="text-gray-400 font-normal ml-1 text-xs">(opcional)</span>
              </label>
              <input
                name="phone"
                type="tel"
                className={inputClass}
                style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
                placeholder="5561999999999"
              />
            </div>
          </div>
        )}
      </div>

      {!isEquipe && products.length > 0 && (
        <div className="bg-card rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900 mb-1">Liberar acesso aos produtos</h2>
            <p className="text-sm text-gray-500 mb-4">Opcional — pode liberar depois também.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {products.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition has-[:checked]:border-[var(--brand)] has-[:checked]:bg-[var(--brand-bg)] border-gray-200 hover:bg-gray-50"
                >
                  <input type="checkbox" name="products" value={p.id} className="w-4 h-4 rounded shrink-0" style={{ accentColor: 'var(--brand)' }} />
                  <span className="text-sm font-medium text-gray-700 truncate">{p.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-1 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mt-4 mb-3">Validade do acesso</h3>
            <input type="hidden" name="access_type" value={accessType} />
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition border-gray-200 hover:bg-gray-50" style={accessType === 'permanent' ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand-bg)' } : undefined}>
                <input type="radio" checked={accessType === 'permanent'} onChange={() => setAccessType('permanent')} className="w-4 h-4" style={{ accentColor: 'var(--brand)' }} />
                <span className="text-sm font-medium" style={accessType === 'permanent' ? { color: 'var(--brand-text)' } : { color: '#374151' }}>Acesso permanente</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition border-gray-200 hover:bg-gray-50" style={accessType === 'date' ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand-bg)' } : undefined}>
                <input type="radio" checked={accessType === 'date'} onChange={() => setAccessType('date')} className="w-4 h-4 shrink-0" style={{ accentColor: 'var(--brand)' }} />
                <span className="text-sm font-medium shrink-0" style={accessType === 'date' ? { color: 'var(--brand-text)' } : { color: '#374151' }}>Expira em</span>
                {accessType === 'date' && (
                  <input type="date" name="access_expires_at" required className="ml-auto px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2" />
                )}
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition border-gray-200 hover:bg-gray-50" style={accessType === 'days' ? { borderColor: 'var(--brand)', backgroundColor: 'var(--brand-bg)' } : undefined}>
                <input type="radio" checked={accessType === 'days'} onChange={() => setAccessType('days')} className="w-4 h-4 shrink-0" style={{ accentColor: 'var(--brand)' }} />
                <span className="text-sm font-medium shrink-0" style={accessType === 'days' ? { color: 'var(--brand-text)' } : { color: '#374151' }}>Por dias, a partir de hoje</span>
                {accessType === 'days' && (
                  <div className="ml-auto flex items-center gap-1.5">
                    {[30, 90, 365].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setAccessDays(d)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                        style={accessDays === d ? { backgroundColor: 'var(--brand)', color: '#fff' } : { backgroundColor: '#f3f4f6', color: '#374151' }}
                      >
                        {d}
                      </button>
                    ))}
                    <input
                      type="number"
                      name="access_days"
                      min={1}
                      value={accessDays}
                      onChange={e => setAccessDays(parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2"
                    />
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? 'Criando...'
            : isEquipe
              ? 'Criar colaborador e enviar convite'
              : 'Criar membro e enviar convite'}
        </Button>
        <Button variant="secondary" href={isEquipe ? '/admin/configuracoes' : '/admin/usuarios'}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
