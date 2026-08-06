'use client'

import { useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, MenuItem, MenuDivider } from '@/components/Menu'
import { ConfirmModal } from '@/components/ConfirmModal'
import { ChangeOrderModal } from '@/components/admin/ChangeOrderModal'
import { deleteProduct, duplicateProduct, toggleProductActive, updateProductOrder } from '@/lib/actions/admin'

interface ProductLite {
  id: string
  title: string
  is_active: boolean
  sort_order: number
}

interface Props {
  product: ProductLite
  trigger: (state: { toggle: () => void }) => ReactNode
  onToggled?: (nowActive: boolean) => void
  onReordered?: (newOrder: number) => void
  onDeleted?: () => void
}

const icons = {
  edit: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />,
  duplicate: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375" />,
  order: <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />,
  suspend: <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />,
  play: <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />,
  trash: <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />,
}

function Icon({ d, muted = true }: { d: ReactNode; muted?: boolean }) {
  return (
    <svg className={`w-3.5 h-3.5 shrink-0 ${muted ? 'text-gray-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      {d}
    </svg>
  )
}

/** Menu "⋮" por produto — mesmo Menu/MenuItem usado em membros, pra ter um único sistema de ações na plataforma. */
export function ProductActionsMenu({ product, trigger, onToggled, onReordered, onDeleted }: Props) {
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  const isActive = product.is_active

  async function handleDuplicate() {
    setDuplicating(true)
    const result = await duplicateProduct(product.id)
    setDuplicating(false)
    if (result.newId) router.push(`/admin/produtos/${result.newId}`)
  }

  async function handleToggle() {
    await toggleProductActive(product.id, isActive)
    onToggled?.(!isActive)
  }

  async function handleSaveOrder(position: number) {
    const sortOrder = position - 1
    await updateProductOrder(product.id, sortOrder)
    onReordered?.(sortOrder)
  }

  async function handleDelete() {
    await deleteProduct(product.id)
    onDeleted?.()
  }

  return (
    <>
      <Menu align="right" panelClassName="w-52" trigger={trigger}>
        <MenuItem icon={<Icon d={icons.edit} />} href={`/admin/produtos/${product.id}`}>
          Editar...
        </MenuItem>
        <MenuItem icon={<Icon d={icons.duplicate} />} keepOpen disabled={duplicating} onSelect={handleDuplicate}>
          {duplicating ? 'Duplicando...' : 'Duplicar'}
        </MenuItem>
        <MenuItem icon={<Icon d={icons.order} />} onSelect={() => setOrderModalOpen(true)}>
          Reordenar produtos...
        </MenuItem>

        <MenuDivider />

        <MenuItem icon={<Icon d={isActive ? icons.suspend : icons.play} />} onSelect={handleToggle}>
          {isActive ? 'Desativar' : 'Ativar'}
        </MenuItem>

        <MenuDivider />

        <MenuItem danger icon={<Icon d={icons.trash} muted={false} />} onSelect={() => setConfirmDelete(true)}>
          Excluir...
        </MenuItem>
      </Menu>

      <ChangeOrderModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        currentPosition={product.sort_order + 1}
        onSave={handleSaveOrder}
      />

      <ConfirmModal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Excluir produto"
        message={`"${product.title}" e todo o seu conteúdo (módulos e aulas) serão excluídos permanentemente.`}
        confirmLabel="Excluir"
        dangerWord="EXCLUIR"
      />
    </>
  )
}
