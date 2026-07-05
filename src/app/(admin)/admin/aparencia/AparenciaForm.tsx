'use client'
import { useState } from 'react'
import { APPEARANCE_DEFAULTS } from '@/lib/appearance-defaults'

const inputClass = 'w-full px-3 py-2 border border-gray-200 dark:border-[#374151] rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-yellow-300'

function Section({ title, description, children }: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-8 py-8 border-b border-gray-100 last:border-b-0">
      <div className="shrink-0">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  )
}

function ColorPicker({ label, hint, value, onChange }: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
}) {
  function handleHex(raw: string) {
    const v = raw.startsWith('#') ? raw : '#' + raw
    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v)
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        {/* label wrapping both circle + native picker */}
        <label
          className="w-10 h-10 rounded-full border-2 border-white shadow ring-1 ring-gray-200 cursor-pointer shrink-0 overflow-hidden"
          style={{ backgroundColor: value }}
          title="Clique para escolher a cor"
        >
          <input
            type="color"
            value={value.length === 7 ? value : '#000000'}
            onChange={e => onChange(e.target.value)}
            style={{ opacity: 0, width: '1px', height: '1px', position: 'absolute' }}
          />
        </label>
        {/* hex text input */}
        <input
          type="text"
          value={value}
          onChange={e => handleHex(e.target.value)}
          maxLength={7}
          spellCheck={false}
          className="w-24 px-2 py-1 border border-gray-200 dark:border-[#374151] rounded text-xs font-mono text-gray-700 dark:text-gray-200 bg-white dark:bg-[#111827] focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />
        <span className="text-xs text-gray-400">{hint}</span>
      </div>
    </div>
  )
}

export function AparenciaForm({ config }: { config: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(config)
  const [pending, setPending] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function set(key: string, value: string) {
    setValues(v => ({ ...v, [key]: value }))
    setMsg(null)
  }

  async function handleSave() {
    setPending(true)
    setMsg(null)
    try {
      const res = await fetch('/api/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const result = await res.json()
      setMsg(result.ok
        ? { ok: true, text: 'Alterações salvas com sucesso!' }
        : { ok: false, text: result.error ?? 'Erro desconhecido.' }
      )
    } catch (err) {
      setMsg({ ok: false, text: String(err) })
    } finally {
      setPending(false)
    }
  }

  async function handleRestore() {
    setPending(true)
    setMsg(null)
    try {
      const res = await fetch('/api/appearance', { method: 'DELETE' })
      const result = await res.json()
      if (result.ok) {
        setValues({ ...APPEARANCE_DEFAULTS })
        setMsg({ ok: true, text: 'Padrões restaurados!' })
      } else {
        setMsg({ ok: false, text: result.error ?? 'Erro desconhecido.' })
      }
    } catch (err) {
      setMsg({ ok: false, text: String(err) })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="max-w-4xl">

      {/* Page header */}
      <div className="flex items-start justify-between gap-6 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Aparência</h1>
          <p className="text-sm text-gray-500 mt-0.5">Personalize a identidade visual da sua plataforma.</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestore}
              disabled={pending}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-60"
            >
              {pending ? '...' : 'Restaurar padrão'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: '#b48840' }}
            >
              {pending ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
          {msg && (
            <p className={`text-xs font-medium ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>
              {msg.text}
            </p>
          )}
        </div>
      </div>

      {/* Paleta de cores */}
      <Section
        title="Paleta de cores"
        description="Use a cor da sua marca em botões, bordas, ícones e elementos de destaque da plataforma."
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <ColorPicker label="Cor primária"   hint="Botões e destaques"   value={values.primary_color  ?? '#b48840'} onChange={v => set('primary_color',  v)} />
          <ColorPicker label="Cor de destaque" hint="Acento secundário"   value={values.brand_light    ?? '#d2b17b'} onChange={v => set('brand_light',    v)} />
          <ColorPicker label="Fundo — Claro"  hint="Fundo da página ☀️"  value={values.bg_light       ?? '#e4e4e4'} onChange={v => set('bg_light',       v)} />
          <ColorPicker label="Fundo — Escuro" hint="Fundo da página 🌙"  value={values.bg_dark        ?? '#00060f'} onChange={v => set('bg_dark',        v)} />
          <ColorPicker label="Cards — Claro"  hint="Cards e painéis ☀️"  value={values.card_bg_light  ?? '#ffffff'} onChange={v => set('card_bg_light',  v)} />
          <ColorPicker label="Cards — Escuro" hint="Cards e painéis 🌙"  value={values.card_bg_dark   ?? '#0d1020'} onChange={v => set('card_bg_dark',   v)} />
        </div>
      </Section>

      {/* Textos */}
      <Section
        title="Textos"
        description="Configure o nome da plataforma e a mensagem de boas-vindas exibida no dashboard dos membros."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da plataforma</label>
            <input
              className={inputClass}
              value={values.platform_name ?? ''}
              onChange={e => set('platform_name', e.target.value)}
              placeholder="Ex: Thiago Cantalovo"
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
      </Section>

      {/* Suporte */}
      <Section
        title="Suporte"
        description="Dados de contato exibidos na página de suporte para os seus membros entrarem em contato."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp de suporte</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 shrink-0 font-medium">+</span>
              <input
                placeholder="5561991900589"
                className={`flex-1 ${inputClass}`}
                value={values.support_whatsapp ?? ''}
                onChange={e => set('support_whatsapp', e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Número completo com código do país, sem espaços ou +.</p>
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
      </Section>

    </div>
  )
}
