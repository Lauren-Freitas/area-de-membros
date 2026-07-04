'use client'
import { useState } from 'react'
import { saveAppearance, restoreAppearanceDefaults, APPEARANCE_DEFAULTS } from '@/lib/actions/appearance'

const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300'

export function AparenciaForm({ config }: { config: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(config)
  const [savePending, setSavePending] = useState(false)
  const [restorePending, setRestorePending] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; msg: string } | null>(null)
  const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; msg: string } | null>(null)

  function set(key: string, value: string) {
    setValues(v => ({ ...v, [key]: value }))
    setSaveMsg(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSavePending(true)
    setSaveMsg(null)
    try {
      const result = await saveAppearance(values)
      setSaveMsg(result.ok
        ? { ok: true, msg: 'Alterações salvas com sucesso!' }
        : { ok: false, msg: result.error ?? 'Erro desconhecido.' }
      )
    } catch (err) {
      setSaveMsg({ ok: false, msg: String(err) })
    } finally {
      setSavePending(false)
    }
  }

  async function handleRestore() {
    setRestorePending(true)
    setRestoreMsg(null)
    try {
      const result = await restoreAppearanceDefaults()
      if (result.ok) {
        setValues({ ...APPEARANCE_DEFAULTS })
        setRestoreMsg({ ok: true, msg: 'Padrões restaurados!' })
      } else {
        setRestoreMsg({ ok: false, msg: result.error ?? 'Erro desconhecido.' })
      }
    } catch (err) {
      setRestoreMsg({ ok: false, msg: String(err) })
    } finally {
      setRestorePending(false)
    }
  }

  const colorFields = [
    { key: 'primary_color',  label: 'Cor primária',        hint: 'Botões e destaques' },
    { key: 'brand_light',    label: 'Cor de destaque',     hint: 'Acento secundário' },
    { key: 'bg_light',       label: 'Fundo — Modo Claro',  hint: 'Fundo da página (☀️)' },
    { key: 'bg_dark',        label: 'Fundo — Modo Escuro', hint: 'Fundo da página (🌙)' },
    { key: 'card_bg_light',  label: 'Cards — Modo Claro',  hint: 'Cards e painéis (☀️)' },
    { key: 'card_bg_dark',   label: 'Cards — Modo Escuro', hint: 'Cards e painéis (🌙)' },
  ]

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Aparência</h1>
          <p className="text-sm text-gray-500 mt-0.5">Personalize textos e cores da plataforma.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleRestore}
            disabled={restorePending}
            className="shrink-0 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
          >
            {restorePending ? 'Restaurando…' : 'Restaurar padrão'}
          </button>
          {restoreMsg && (
            <p className={`text-xs ${restoreMsg.ok ? 'text-green-600' : 'text-red-500'}`}>
              {restoreMsg.msg}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-white rounded-2xl border border-gray-100 p-6">

        {saveMsg && (
          <div className={`px-4 py-2.5 rounded-lg text-sm border ${saveMsg.ok
            ? 'bg-green-50 border-green-100 text-green-700'
            : 'bg-red-50 border-red-100 text-red-600'}`}>
            {saveMsg.msg}
          </div>
        )}

        {/* Textos */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Textos</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da plataforma</label>
            <input
              className={inputClass}
              value={values.platform_name ?? ''}
              onChange={e => set('platform_name', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensagem de boas-vindas</label>
            <textarea
              rows={2}
              placeholder="Mensagem exibida no topo do dashboard"
              className={`${inputClass} resize-none`}
              value={values.welcome_message ?? ''}
              onChange={e => set('welcome_message', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Aparece no topo do dashboard para todos os membros.</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Cores */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cores</h2>
          <div className="grid grid-cols-2 gap-4">
            {colorFields.map(({ key, label, hint }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={values[key] ?? '#000000'}
                    onChange={e => set(key, e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
                  />
                  <span className="text-xs text-gray-400">{hint}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Suporte */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Suporte</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp de suporte</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">+</span>
              <input
                placeholder="5561991900589"
                className={`flex-1 ${inputClass}`}
                value={values.support_whatsapp ?? ''}
                onChange={e => set('support_whatsapp', e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Número completo com código do país (sem espaços ou +).</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail de suporte</label>
            <input
              type="email"
              className={inputClass}
              value={values.support_email ?? ''}
              onChange={e => set('support_email', e.target.value)}
            />
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={savePending}
            className="px-5 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#b48840' }}
          >
            {savePending ? 'Salvando…' : 'Salvar alterações'}
          </button>
          <a
            href="/admin/aparencia"
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </a>
        </div>
      </form>
    </div>
  )
}
