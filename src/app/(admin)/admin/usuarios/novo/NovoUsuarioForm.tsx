'use client'

import { useActionState, useState } from 'react'
import { createUser } from '@/lib/actions/admin'
import Link from 'next/link'

interface Product { id: string; title: string }

const inputClass = 'w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition'

export function NovoUsuarioForm({ products, isEquipe = false }: { products: Product[]; isEquipe?: boolean }) {
  const [state, action, isPending] = useActionState(createUser, undefined)
  const [selectedRole, setSelectedRole] = useState('admin')
  const [isActive, setIsActive] = useState(true)

  return (
    <form action={action} className="space-y-6">
      {!isEquipe && <input type="hidden" name="role" value="membro" />}

      {state?.error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
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
                  style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
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
                  style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
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
                style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
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
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
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
                style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
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
                style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
                placeholder="Ex: joao@email.com"
              />
            </div>
          </div>
        )}
      </div>

      {!isEquipe && products.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Liberar acesso aos produtos</h2>
          <p className="text-sm text-gray-500 mb-4">Opcional — pode liberar depois também.</p>
          <div className="space-y-2">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="products"
                  value={p.id}
                  className="w-4 h-4 rounded"
                  style={{ accentColor: '#b48840' }}
                />
                <span className="text-sm text-gray-700">{p.title}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#b48840' }}
        >
          {isPending
            ? 'Criando...'
            : isEquipe
              ? 'Criar colaborador e enviar convite'
              : 'Criar membro e enviar convite'}
        </button>
        <Link
          href={isEquipe ? '/admin/configuracoes' : '/admin/usuarios'}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition"
        >
          Cancelar
        </Link>
      </div>
    </form>
  )
}
