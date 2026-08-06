'use client'

import { useState, type ReactNode } from 'react'
import { Menu, MenuItem, MenuDivider } from '@/components/Menu'
import { ConfirmModal } from '@/components/ConfirmModal'
import { deleteUser, toggleUserActive, resendAdminInvite } from '@/lib/actions/admin'
import { getMemberAccessLink } from '@/lib/actions/members'
import { startViewAs } from '@/lib/actions/view-as'

interface MemberLite {
  id: string
  name: string
  email: string
  is_active: boolean | null
  last_login_at: string | null
}

interface ActionCallbacks {
  /** "Editar" nunca navega — sempre abre/troca o drawer para a view de edição. */
  onEdit: () => void
  onToggled?: (nowActive: boolean) => void
  onDeleted?: () => void
}

type Feedback = { label: string; tone: 'ok' | 'error' } | null

const icons = {
  edit: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />,
  mail: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />,
  link: <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />,
  suspend: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />,
  play: <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />,
  eye: <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
}

function Icon({ d }: { d: ReactNode }) {
  return (
    <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {d}
    </svg>
  )
}

/**
 * Estado e handlers compartilhados pelas duas formas de exibir as ações
 * (dropdown na linha, lista fixa no drawer). "Editar" nunca navega — abre ou
 * troca o drawer pra view de edição, que já inclui produtos; não existe um
 * segundo destino "Gerenciar produtos" pra duplicar a mesma coisa.
 */
function useMemberActions(member: MemberLite, { onEdit, onToggled, onDeleted }: ActionCallbacks) {
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'delete' | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)

  const isActive = member.is_active !== false

  function flash(label: string, tone: 'ok' | 'error' = 'ok') {
    setFeedback({ label, tone })
    setTimeout(() => setFeedback(null), 2200)
  }

  async function handleSendAccess() {
    flash('Enviando...')
    const result = await resendAdminInvite(member.id)
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

  async function handleViewAs() {
    await startViewAs(member.id)
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
      <MenuItem icon={<Icon d={icons.edit} />} onSelect={onEdit}>
        Editar...
      </MenuItem>
      <MenuItem icon={<Icon d={icons.mail} />} keepOpen onSelect={handleSendAccess}>
        Enviar acesso
      </MenuItem>
      <MenuItem icon={<Icon d={icons.link} />} keepOpen onSelect={handleCopyLink}>
        Copiar link
      </MenuItem>
      <MenuItem icon={<Icon d={icons.eye} />} onSelect={handleViewAs}>
        Ver como este membro
      </MenuItem>
      {feedback && (
        <p className={`px-3 pb-1.5 -mt-0.5 text-xs ${feedback.tone === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
          {feedback.label}
        </p>
      )}

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
export function MemberActionsMenu({ member, trigger, align = 'right', onEdit, onToggled, onDeleted }: DropdownProps) {
  const { items, modals } = useMemberActions(member, { onEdit, onToggled, onDeleted })
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
export function MemberActionsInline({ member, onEdit, onToggled, onDeleted }: InlineProps) {
  const { items, modals } = useMemberActions(member, { onEdit, onToggled, onDeleted })
  return (
    <>
      <div className="py-1">{items}</div>
      {modals}
    </>
  )
}
