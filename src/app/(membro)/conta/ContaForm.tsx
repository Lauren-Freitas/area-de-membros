'use client'

import { useActionState, useState, useRef } from 'react'
import { updateMemberProfile, updateMemberPassword } from '@/lib/actions/member'
import Link from 'next/link'

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

const AI_TONES = [
  { value: 'empatico', label: 'Empático e motivador', description: 'Acolhedor, celebra conquistas e usa linguagem encorajadora' },
  { value: 'direto', label: 'Direto e objetivo', description: 'Respostas curtas e práticas, sem rodeios' },
  { value: 'tecnico', label: 'Técnico e detalhado', description: 'Explica mecanismos e fundamentos com mais profundidade' },
]

interface InitialData {
  name: string
  phone: string
  bio: string
  avatar_url: string | null
  timezone: string
  ai_tone: string
  email: string
}

export function ContaForm({ initialData }: { initialData: InitialData }) {
  const [profileState, profileAction, profilePending] = useActionState(updateMemberProfile, undefined)
  const [passwordState, passwordAction, passwordPending] = useActionState(updateMemberPassword, undefined)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData.avatar_url)
  const fileRef = useRef<HTMLInputElement>(null)
  const parsedPhone = parsePhone(initialData.phone)
  const [selectedDdi, setSelectedDdi] = useState(parsedPhone.ddi)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase() || '?'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Minha Conta</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Preencha suas informações pessoais para personalizar sua experiência na plataforma.
        </p>
      </div>

      {/* Informações do perfil */}
      <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">Informações pessoais</h2>

        <form action={profileAction} className="space-y-5" encType="multipart/form-data">
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
          <div className="flex items-center gap-5">
            <div className="relative">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="rounded-full object-cover w-[72px] h-[72px] border-2 border-gray-100 dark:border-[#1e2030]"
                />
              ) : (
                <div
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-xl font-bold text-white"
                  style={{ backgroundColor: '#b48840' }}
                >
                  {getInitials(initialData.name)}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Foto de perfil</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1f35] transition"
              >
                Escolher foto
              </button>
              <input
                ref={fileRef}
                type="file"
                name="avatar"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="text-xs text-gray-400 mt-1">PNG, JPG ou WebP. Máx. 2 MB.</p>
            </div>
          </div>

          {/* Nome + Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                defaultValue={initialData.name}
                required
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Telefone</label>
              <div className="flex gap-2">
                <select
                  name="phone_ddi"
                  value={selectedDdi}
                  onChange={e => setSelectedDdi(e.target.value)}
                  className="shrink-0 px-2 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{
                    '--tw-ring-color': '#b48840',
                    width: selectedDdi.length <= 2 ? '4.5rem' : selectedDdi.length <= 3 ? '5rem' : '5.75rem',
                  } as React.CSSProperties}
                >
                  {COUNTRIES.map(c => (
                    <option key={c.ddi + c.name} value={c.ddi}>
                      {c.flag} {c.ddi}
                    </option>
                  ))}
                </select>
                <input
                  name="phone_number"
                  type="tel"
                  defaultValue={parsedPhone.number}
                  className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
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
            <textarea
              name="bio"
              defaultValue={initialData.bio}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
              placeholder="Conte um pouco sobre você..."
            />
          </div>

          {/* Fuso horário */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fuso horário</label>
            <select
              name="timezone"
              defaultValue={initialData.timezone}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          {/* Tom de voz do assistente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Tom de voz do Proteíno
            </label>
            <div className="flex flex-col gap-2">
              {AI_TONES.map(tone => (
                <label
                  key={tone.value}
                  className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-[#b48840] transition has-[:checked]:border-[#b48840] has-[:checked]:bg-amber-50 dark:has-[:checked]:bg-amber-900/10"
                >
                  <input
                    type="radio"
                    name="ai_tone"
                    value={tone.value}
                    defaultChecked={initialData.ai_tone === tone.value}
                    className="mt-0.5 shrink-0 accent-[#b48840]"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{tone.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{tone.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={profilePending}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#b48840' }}
            >
              {profilePending ? 'Salvando...' : 'Atualizar'}
            </button>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      {/* Alteração de senha */}
      <div className="bg-white dark:bg-[#0d1020] rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Alteração de senha</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Para alterar sua senha, informe a senha atual e depois a nova senha desejada.
        </p>

        <form action={passwordAction} className="space-y-4">
          {passwordState?.error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              {passwordState.error}
            </div>
          )}
          {passwordState?.success && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
              Senha alterada com sucesso!
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Senha atual</label>
            <input
              name="current_password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nova senha</label>
              <input
                name="new_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirmar nova senha</label>
              <input
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition"
                style={{ '--tw-ring-color': '#b48840' } as React.CSSProperties}
                placeholder="Repita a nova senha"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={passwordPending}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#b48840' }}
            >
              {passwordPending ? 'Alterando...' : 'Atualizar senha'}
            </button>
            <button
              type="reset"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
