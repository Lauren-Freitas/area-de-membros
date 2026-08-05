'use client'

import { useState, useTransition } from 'react'
import { Menu, MenuItem, MenuDivider } from '@/components/Menu'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ManageAccessModal } from '@/components/admin/ManageAccessModal'
import { MemberChips } from '@/components/admin/MemberChips'
import { deleteUser, toggleUserActive, resendAdminInvite } from '@/lib/actions/admin'

interface ProductAccess {
  id: string
  title: string
  hasAccess: boolean
  expiresAt: string | null
}

interface Profile {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  avatar_url: string | null
  last_login_at: string | null
  created_at: string
}

interface Props {
  profile: Profile
  products: ProductAccess[]
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase() || '?'
}

function fmtShort(d: string | null) {
  if (!d) return '—'
  const date = new Date(d)
  if (date.toDateString() === new Date().toDateString()) return 'Hoje'
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function roleLabel(role: string) {
  if (role === 'admin') return 'Admin'
  if (role === 'equipe') return 'Equipe'
  return 'Membro'
}

export function MemberRow({ profile, products }: Props) {
  const [isActive, setIsActive] = useState(profile.is_active)
  const [manageOpen, setManageOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'delete' | 'suspend' | null>(null)
  const [loginState, setLoginState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [, startTransition] = useTransition()

  const granted = products.filter(p => p.hasAccess)
  const expiryDates = granted.map(p => p.expiresAt).filter((d): d is string => !!d)
  const nextExpiry = expiryDates.length > 0
    ? expiryDates.reduce((min, d) => (new Date(d) < new Date(min) ? d : min))
    : null
  const expiryLabel = granted.length === 0 ? '—' : nextExpiry ? fmtShort(nextExpiry) : 'Permanente'

  function handleSendLogin() {
    setLoginState('sending')
    startTransition(async () => {
      const result = await resendAdminInvite(profile.id, profile.email, profile.name)
      setLoginState(result.success ? 'sent' : 'error')
      setTimeout(() => setLoginState('idle'), 2000)
    })
  }

  function handleSuspendToggle() {
    startTransition(async () => {
      await toggleUserActive(profile.id, isActive)
      setIsActive(v => !v)
    })
  }

  function handleDelete() {
    startTransition(async () => { await deleteUser(profile.id) })
  }

  return (
    <div className={`flex items-center gap-4 py-3 px-1 hover:bg-gray-50 dark:hover:bg-[#12162a] transition rounded-xl ${!isActive ? 'opacity-60' : ''}`}>
      {/* Membro */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={profile.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            {getInitials(profile.name || profile.email)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{profile.name || '(sem nome)'}</p>
          <p className="text-xs text-gray-400 truncate">{profile.email}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <span>{isActive ? 'Ativo' : 'Inativo'}</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span>{roleLabel(profile.role)}</span>
          </div>
        </div>
      </div>

      {/* Último acesso */}
      <div className="w-20 shrink-0 text-xs text-gray-400">{fmtShort(profile.last_login_at)}</div>

      {/* Cadastro */}
      <div className="w-20 shrink-0 text-xs text-gray-400">{fmtShort(profile.created_at)}</div>

      {/* Conteúdos liberados */}
      <div className="w-56 shrink-0">
        <MemberChips titles={granted.map(p => p.title)} />
      </div>

      {/* Próxima expiração */}
      <div className="w-24 shrink-0 text-xs text-gray-400">{expiryLabel}</div>

      {/* Ações */}
      <div className="w-8 shrink-0">
        <Menu
          panelClassName="w-56"
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
        >
          <MenuItem
            href={`/admin/usuarios/${profile.id}`}
            icon={
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            }
          >
            Editar
          </MenuItem>

          <MenuItem
            onSelect={() => setManageOpen(true)}
            icon={
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          >
            Gerenciar acessos
          </MenuItem>

          <MenuItem
            onSelect={handleSendLogin}
            disabled={loginState === 'sending'}
            keepOpen
            icon={
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            }
          >
            {loginState === 'sending' ? 'Enviando...' : loginState === 'sent' ? 'Enviado ✓' : loginState === 'error' ? 'Falhou — tente de novo' : 'Enviar login'}
          </MenuItem>

          <MenuDivider />

          <MenuItem
            onSelect={() => setConfirmAction('suspend')}
            icon={
              <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            }
          >
            {isActive ? 'Suspender' : 'Reativar'}
          </MenuItem>

          <MenuItem danger onSelect={() => setConfirmAction('delete')}>
            Excluir
          </MenuItem>
        </Menu>
      </div>

      <ManageAccessModal
        isOpen={manageOpen}
        onClose={() => setManageOpen(false)}
        memberName={profile.name || profile.email}
        userId={profile.id}
        products={products}
      />

      <ConfirmModal
        isOpen={confirmAction === 'suspend'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleSuspendToggle}
        title={isActive ? 'Suspender membro' : 'Reativar membro'}
        message={
          isActive
            ? `${profile.name || profile.email} perde acesso à plataforma imediatamente. Você pode reativar a qualquer momento.`
            : `${profile.name || profile.email} volta a ter acesso à plataforma.`
        }
        confirmLabel={isActive ? 'Suspender' : 'Reativar'}
      />

      <ConfirmModal
        isOpen={confirmAction === 'delete'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleDelete}
        title="Excluir membro"
        message={`${profile.name || profile.email} será excluído permanentemente, junto com todo o histórico de acesso. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        dangerWord="EXCLUIR"
      />
    </div>
  )
}
