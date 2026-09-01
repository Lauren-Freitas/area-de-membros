'use client'

import { useActionState, useState, useRef } from 'react'
import { updateMemberProfile } from '@/lib/actions/member'
import { AvatarCropper } from '@/components/AvatarCropper'
import { AvatarPhotoModal } from '@/components/AvatarPhotoModal'
import { Input } from '@/components/Input'
import { Textarea } from '@/components/Textarea'
import { Select } from '@/components/Select'
import { Button } from '@/components/Button'

const COUNTRIES = [
  { ddi: '+55',  flag: '🇧🇷', name: 'Brasil' },
  { ddi: '+1',   flag: '🇺🇸', name: 'EUA / Canadá' },
  { ddi: '+351', flag: '🇵🇹', name: 'Portugal' },
  { ddi: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { ddi: '+57',  flag: '🇨🇴', name: 'Colômbia' },
  { ddi: '+56',  flag: '🇨🇱', name: 'Chile' },
  { ddi: '+58',  flag: '🇻🇪', name: 'Venezuela' },
  { ddi: '+51',  flag: '🇵🇪', name: 'Peru' },
  { ddi: '+593', flag: '🇪🇨', name: 'Equador' },
  { ddi: '+598', flag: '🇺🇾', name: 'Uruguai' },
  { ddi: '+595', flag: '🇵🇾', name: 'Paraguai' },
  { ddi: '+591', flag: '🇧🇴', name: 'Bolívia' },
  { ddi: '+52',  flag: '🇲🇽', name: 'México' },
  { ddi: '+44',  flag: '🇬🇧', name: 'Reino Unido' },
  { ddi: '+34',  flag: '🇪🇸', name: 'Espanha' },
  { ddi: '+33',  flag: '🇫🇷', name: 'França' },
  { ddi: '+49',  flag: '🇩🇪', name: 'Alemanha' },
  { ddi: '+39',  flag: '🇮🇹', name: 'Itália' },
  { ddi: '+31',  flag: '🇳🇱', name: 'Países Baixos' },
  { ddi: '+41',  flag: '🇨🇭', name: 'Suíça' },
  { ddi: '+46',  flag: '🇸🇪', name: 'Suécia' },
  { ddi: '+244', flag: '🇦🇴', name: 'Angola' },
  { ddi: '+258', flag: '🇲🇿', name: 'Moçambique' },
  { ddi: '+238', flag: '🇨🇻', name: 'Cabo Verde' },
  { ddi: '+61',  flag: '🇦🇺', name: 'Austrália' },
  { ddi: '+81',  flag: '🇯🇵', name: 'Japão' },
  { ddi: '+86',  flag: '🇨🇳', name: 'China' },
]

function parsePhone(fullPhone: string): { ddi: string; number: string } {
  if (!fullPhone) return { ddi: '+55', number: '' }
  if (!fullPhone.startsWith('+')) return { ddi: '+55', number: fullPhone }
  const sorted = [...COUNTRIES].sort((a, b) => b.ddi.length - a.ddi.length)
  for (const c of sorted) {
    if (fullPhone.startsWith(c.ddi)) {
      return { ddi: c.ddi, number: fullPhone.slice(c.ddi.length).trim() }
    }
  }
  return { ddi: '+55', number: fullPhone }
}

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Belem', label: 'Belém (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/Recife', label: 'Recife (GMT-3)' },
  { value: 'America/Maceio', label: 'Maceió (GMT-3)' },
  { value: 'America/Bahia', label: 'Salvador (GMT-3)' },
  { value: 'America/Porto_Velho', label: 'Porto Velho (GMT-4)' },
  { value: 'America/Boa_Vista', label: 'Boa Vista (GMT-4)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
  { value: 'America/Noronha', label: 'Fernando de Noronha (GMT-2)' },
  { value: 'America/New_York', label: 'Nova York (GMT-5/-4)' },
  { value: 'America/Chicago', label: 'Chicago (GMT-6/-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8/-7)' },
  { value: 'Europe/Lisbon', label: 'Lisboa (GMT+0/+1)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
]

interface InitialData {
  name: string
  phone: string
  bio: string
  avatar_url: string | null
  timezone: string
  email: string
}

export function ContaForm({ initialData }: { initialData: InitialData }) {
  const [profileState, profileAction, profilePending] = useActionState(updateMemberProfile, undefined)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatar_url)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const parsedPhone = parsePhone(initialData.phone)
  const [selectedDdi, setSelectedDdi] = useState(parsedPhone.ddi)
  const [profileFormKey, setProfileFormKey] = useState(0)

  function handleProfileCancel() {
    setProfileFormKey(k => k + 1)
    setSelectedDdi(parsedPhone.ddi)
    setAvatarPreview(initialData.avatar_url)
    setRemoveAvatar(false)
    if (fileRef.current) fileRef.current.value = ''
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

  function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase() || '?'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
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
          initials={getInitials(initialData.name)}
          onEdit={() => { if (avatarPreview) { setPhotoModalOpen(false); setCropSrc(avatarPreview) } }}
          onUpdate={(file) => { setPhotoModalOpen(false); setCropSrc(URL.createObjectURL(file)) }}
          onDelete={handleDelete}
          onClose={() => setPhotoModalOpen(false)}
        />
      )}
      {/* Informações do perfil */}
      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Informações pessoais</h2>

        <form key={profileFormKey} action={profileAction} className="space-y-5">
          {profileState?.error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              {profileState.error}
            </div>
          )}
          {profileState?.success && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
              Perfil atualizado com sucesso!
            </div>
          )}

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPhotoModalOpen(true)}
              className="relative shrink-0 group"
            >
              {avatarPreview ? (
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-100 dark:border-[#1e2030]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white"
                  style={{ backgroundColor: 'var(--brand)' }}
                >
                  {getInitials(initialData.name)}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6.536-6.536a2 2 0 012.828 2.828L11.828 13.828A2 2 0 0110.414 14H9v-1.414A2 2 0 019.586 11z" />
                </svg>
              </div>
            </button>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">Foto de perfil</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Clique na foto para editar</p>
            </div>
            <input ref={fileRef} type="file" name="avatar" accept="image/png,image/jpeg,image/webp" className="hidden" />
            {removeAvatar && <input type="hidden" name="remove_avatar" value="true" />}
          </div>

          {/* Nome + Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                defaultValue={initialData.name}
                required
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefone</label>
              <div className="flex gap-2">
                <Select
                  name="phone_ddi"
                  value={selectedDdi}
                  onChange={e => setSelectedDdi(e.target.value)}
                  className="shrink-0 px-2"
                  style={{ width: selectedDdi.length <= 2 ? '4.5rem' : selectedDdi.length <= 3 ? '5rem' : '5.75rem' }}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.ddi + c.name} value={c.ddi}>
                      {c.flag} {c.ddi}
                    </option>
                  ))}
                </Select>
                <Input
                  name="phone_number"
                  type="tel"
                  defaultValue={parsedPhone.number}
                  className="flex-1"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              value={initialData.email}
              readOnly
              className="w-full px-3 py-2.5 border border-gray-100 dark:border-gray-700 rounded-lg text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Para alterar o email, entre em contato com o suporte.</p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Biografia</label>
            <Textarea
              name="bio"
              defaultValue={initialData.bio}
              rows={3}
              maxLength={500}
              placeholder="Conte um pouco sobre você..."
            />
          </div>

          {/* Fuso horário */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fuso horário</label>
            <Select
              name="timezone"
              defaultValue={initialData.timezone}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" disabled={profilePending}>
              {profilePending ? 'Salvando...' : 'Atualizar'}
            </Button>
            <Button type="button" variant="secondary" onClick={handleProfileCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
