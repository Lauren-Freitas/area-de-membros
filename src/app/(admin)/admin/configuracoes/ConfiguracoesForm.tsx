'use client'

import { useActionState, useState, useRef } from 'react'
import { updateProfile, updateAdminPassword } from '@/lib/actions/admin'
import { AvatarCropper } from '@/components/AvatarCropper'
import { AvatarPhotoModal } from '@/components/AvatarPhotoModal'

// ── Main form ─────────────────────────────────────────────────────────────────
interface Props { name: string; email: string; avatarUrl: string | null }

export function ConfiguracoesForm({ name, email, avatarUrl }: Props) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, undefined)
  const [passwordState, passwordAction, passwordPending] = useActionState(updateAdminPassword, undefined)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function getInitials(n: string) {
    return n.split(' ').slice(0, 2).map(s => s[0] ?? '').join('').toUpperCase() || '?'
  }

  function handleCropConfirm(previewUrl: string, file: File) {
    setAvatarPreview(previewUrl)
    setRemoveAvatar(false)
    setCropSrc(null)
    setPhotoModalOpen(false)
    if (fileRef.current) {
      const dt = new DataTransfer()
      dt.items.add(file)
      fileRef.current.files = dt.files
    }
  }

  function handleDelete() {
    setAvatarPreview(null)
    setRemoveAvatar(true)
    setPhotoModalOpen(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent'

  return (
    <div className="space-y-6">
      {cropSrc && (
        <AvatarCropper
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => { setCropSrc(null); if (fileRef.current) fileRef.current.value = '' }}
        />
      )}
      {photoModalOpen && !cropSrc && (
        <AvatarPhotoModal
          src={avatarPreview}
          initials={getInitials(name)}
          onEdit={() => { if (avatarPreview) { setPhotoModalOpen(false); setCropSrc(avatarPreview) } }}
          onUpdate={(file) => { setPhotoModalOpen(false); setCropSrc(URL.createObjectURL(file)) }}
          onDelete={handleDelete}
          onClose={() => setPhotoModalOpen(false)}
        />
      )}

      {/* Informações pessoais */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Informações pessoais</h2>

        <form action={profileAction} className="space-y-4">
          {profileState?.error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{profileState.error}</div>
          )}
          {profileState?.success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700">Perfil atualizado com sucesso!</div>
          )}

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPhotoModalOpen(true)}
              className="relative shrink-0 group"
            >
              {avatarPreview ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: '#b48840' }}>
                  {getInitials(name)}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.536-6.536a2 2 0 012.828 2.828L11.828 13.828A2 2 0 0110.414 14H9v-1.414A2 2 0 019.586 11z" />
                </svg>
              </div>
            </button>
            <div>
              <p className="text-sm font-medium text-gray-900 mb-0.5">Foto de perfil</p>
              <p className="text-xs text-gray-400">Clique na foto para editar</p>
            </div>
            {/* Hidden inputs */}
            <input ref={fileRef} type="file" name="avatar" accept="image/png,image/jpeg,image/webp" className="hidden" />
            {removeAvatar && <input type="hidden" name="remove_avatar" value="true" />}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input name="name" type="text" defaultValue={name} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" defaultValue={email} required className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={profilePending}
            className="px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#b48840' }}
          >
            {profilePending ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>

      {/* Alteração de senha */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Alterar senha</h2>
        <p className="text-sm text-gray-500 mb-4">Informe a senha atual e depois a nova senha desejada.</p>

        <form action={passwordAction} className="space-y-4">
          {passwordState?.error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{passwordState.error}</div>
          )}
          {passwordState?.success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-sm text-green-700">Senha alterada com sucesso!</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
            <input name="current_password" type="password" autoComplete="current-password" required className={inputClass} placeholder="••••••••" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
              <input name="new_password" type="password" autoComplete="new-password" required minLength={8} className={inputClass} placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
              <input name="confirm_password" type="password" autoComplete="new-password" required minLength={8} className={inputClass} placeholder="Repita a nova senha" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={passwordPending}
              className="px-6 py-2.5 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#b48840' }}
            >
              {passwordPending ? 'Alterando...' : 'Atualizar senha'}
            </button>
            <button type="reset" className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
