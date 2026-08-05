'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, MenuItem, MenuDivider } from '@/components/Menu'
import { ConfirmModal } from '@/components/ConfirmModal'
import { deleteUser, toggleUserActive, resendAdminInvite } from '@/lib/actions/admin'
import { getMemberAccessLink, resetMemberPassword } from '@/lib/actions/members'

interface MemberLite {
  id: string
  name: string
  email: string
  is_active: boolean | null
  last_login_at: string | null
}

interface ActionCallbacks {
  onManageAccess: () => void
  onToggled?: (nowActive: boolean) => void
  onDeleted?: () => void
}

type Feedback = { label: string; tone: 'ok' | 'error' } | null

const icons = {
  edit: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />,
  mail: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />,
  link: <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />,
  access: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />,
  suspend: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />,
  play: <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />,
}

function Icon({ d }: { d: ReactNode }) {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {d}
    </svg>
  )
}

/** Estado e handlers compartilhados pelas duas formas de exibir as ações (dropdown na linha, lista fixa no drawer). */
function useMemberActions(member: MemberLite, { onManageAccess, onToggled, onDeleted }: ActionCallbacks) {
  const router = useRouter()
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'delete' | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)

  const isActive = member.is_active !== false
  const hasActivated = !!member.last_login_at

  function flash(label: string, tone: 'ok' | 'error' = 'ok') {
    setFeedback({ label, tone })
    setTimeout(() => setFeedback(null), 2200)
  }

  async function handleSendAccess() {
    flash('Enviando...')
    const result = hasActivated
      ? await resetMemberPassword(member.id)
      : await resendAdminInvite(member.id, member.email, member.name)
    flash(result.success ? 'Enviado ✓' : (result.error ?? 'Falhou'), result.success ? 'ok' : 'error')
  }

  async function handleCopyLink() {
    flash('Gerando link...')
    const result = await getMemberAccessLink(member.id)
    if (result.link) {
      await navigator.clipboard.writeText(result.link)
      flash('Link copiado ✓')
    } else {
      flash(result.error ?? 'Falhou', 'error')
    }
  }

  async function handleSuspendToggle() {
    await toggleUserActive(member.id, isActive)
    onToggled?.(!isActive)
  }

  async function handleDelete() {
    await deleteUser(member.id)
    onDeleted?.()
  }

  const items = (
    <>
      <MenuItem icon={<Icon d={icons.edit} />} onSelect={() => router.push(`/admin/usuarios/${member.id}`)}>
        Editar...
      </MenuItem>

      <MenuDivider />

      <MenuItem icon={<Icon d={icons.mail} />} keepOpen onSelect={handleSendAccess}>
        Enviar acesso
      </MenuItem>
      <MenuItem icon={<Icon d={icons.link} />} keepOpen onSelect={handleCopyLink}>
        Copiar link
      </MenuItem>
      {feedback && (
        <p className={`px-3 pb-1.5 -mt-0.5 text-xs ${feedback.tone === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
          {feedback.label}
        </p>
      )}

      <MenuDivider />

      <MenuItem icon={<Icon d={icons.access} />} onSelect={onManageAccess}>
        Gerenciar produtos
      </MenuItem>
      <MenuItem icon={<Icon d={icons.calendar} />} onSelect={onManageAccess}>
        Validade do acesso
      </MenuItem>

      <MenuDivider />

      <MenuItem icon={<Icon d={isActive ? icons.suspend : icons.play} />} onSelect={() => setConfirmAction('suspend')}>
        {isActive ? 'Desativar membro' : 'Reativar membro'}
      </MenuItem>

      <MenuDivider />

      <MenuItem danger onSelect={() => setConfirmAction('delete')}>
        Excluir...
      </MenuItem>
    </>
  )

  const modals = (
    <>
      <ConfirmModal
        isOpen={confirmAction === 'suspend'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleSuspendToggle}
        title={isActive ? 'Desativar membro' : 'Reativar membro'}
        message={
          isActive
            ? `${member.name || member.email} perde acesso à plataforma imediatamente. Você pode reativar a qualquer momento.`
            : `${member.name || member.email} volta a ter acesso à plataforma.`
        }
        confirmLabel={isActive ? 'Desativar' : 'Reativar'}
      />

      <ConfirmModal
        isOpen={confirmAction === 'delete'}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleDelete}
        title="Excluir membro"
        message={`${member.name || member.email} será excluído permanentemente, junto com todo o histórico de acesso. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        dangerWord="EXCLUIR"
      />
    </>
  )

  return { items, modals }
}

interface DropdownProps extends ActionCallbacks {
  member: MemberLite
  trigger: (state: { toggle: () => void }) => ReactNode
  align?: 'left' | 'right'
}

/** Uso na linha da lista: "⋯" que abre um dropdown. */
export function MemberActionsMenu({ member, trigger, align = 'right', onManageAccess, onToggled, onDeleted }: DropdownProps) {
  const { items, modals } = useMemberActions(member, { onManageAccess, onToggled, onDeleted })
  return (
    <>
      <Menu align={align} panelClassName="w-56" trigger={trigger}>{items}</Menu>
      {modals}
    </>
  )
}

interface InlineProps extends ActionCallbacks {
  member: MemberLite
}

/** Uso no drawer: mesma lista de ações, sempre visível (sem menu escondido atrás de outro clique). */
export function MemberActionsInline({ member, onManageAccess, onToggled, onDeleted }: InlineProps) {
  const { items, modals } = useMemberActions(member, { onManageAccess, onToggled, onDeleted })
  return (
    <>
      <div className="py-1">{items}</div>
      {modals}
    </>
  )
}
