'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { APPEARANCE_DEFAULTS } from '@/lib/appearance-defaults'
import { uploadBrandingAsset, removeBrandingAsset } from '@/lib/actions/appearance'
import { Input } from '@/components/Input'
import { Textarea } from '@/components/Textarea'
import { ResponsiveGrid } from '@/components/ResponsiveGrid'

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
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex items-center gap-3">
        {/* native color input — sem truques, sempre funciona */}
        <input
          type="color"
          value={value.match(/^#[0-9a-fA-F]{6}$/) ? value : '#000000'}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-200 p-0.5 bg-transparent shrink-0"
          title={label}
        />
        {/* hex text input */}
        <input
          type="text"
          value={value}
          onChange={e => {
            const v = e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v)
          }}
          maxLength={7}
          spellCheck={false}
          className="w-24 shrink-0 px-2 py-1.5 border border-gray-200 dark:border-[#374151] rounded text-xs font-mono text-gray-700 dark:text-gray-200 bg-white dark:bg-[#111827] focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': 'var(--brand)' } as React.CSSProperties}
        />
      </div>
      <span className="text-xs text-gray-400">{hint}</span>
    </div>
  )
}

function BrandingAssetUpload({ kind, label, hint, currentUrl, onUpdated }: {
  kind: 'logo' | 'favicon'
  label: string
  hint: string
  currentUrl: string | null
  onUpdated: (url: string | null) => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setPending(true)
    const formData = new FormData()
    formData.set('file', file)
    const result = await uploadBrandingAsset(kind, formData)
    if (result.url) onUpdated(result.url)
    else setError(result.error ?? 'Erro ao enviar arquivo.')
    setPending(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleRemove() {
    setError(null)
    setPending(true)
    const result = await removeBrandingAsset(kind)
    if (result.error) setError(result.error)
    else onUpdated(null)
    setPending(false)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
        {currentUrl
          ? /* eslint-disable-next-line @next/next/no-img-element */
            <img src={currentUrl} alt={label} className="w-full h-full object-contain" />
          : <span className="text-xs text-gray-300">Padrão</span>}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mb-2">{hint}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            {pending ? 'Enviando...' : currentUrl ? 'Trocar' : 'Enviar arquivo'}
          </button>
          {currentUrl && (
            <button
              type="button"
              disabled={pending}
              onClick={handleRemove}
              className="text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-50"
            >
              Remover
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        <input
          ref={fileRef}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,.webp,.ico"
          className="hidden"
          onChange={e => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  )
}

export function AparenciaForm({ config }: { config: Record<string, string> }) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(config)
  const [pending, setPending] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function set(key: string, value: string) {
    setValues(v => ({ ...v, [key]: value }))
    setMsg(null)
  }

  async function handleSave() {
    console.log('[Aparência] Salvando...', values)
    setPending(true)
    setMsg(null)
    try {
      const res = await fetch('/api/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const result = await res.json()
      console.log('[Aparência] Resultado:', result)
      setMsg(result.ok
        ? { ok: true, text: 'Alterações salvas com sucesso!' }
        : { ok: false, text: result.error ?? 'Erro desconhecido.' }
      )
      if (result.ok) router.refresh()
    } catch (err) {
      console.error('[Aparência] Erro:', err)
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
        router.refresh()
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
      <div className="flex flex-wrap items-start justify-between gap-6 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Aparência</h1>
          <p className="text-sm text-gray-500 mt-0.5">Personalize a identidade visual da sua plataforma.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 flex-wrap justify-end">
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
              style={{ backgroundColor: 'var(--brand)' }}
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

      {/* Identidade visual */}
      <Section
        title="Identidade visual"
        description="Sua logo (aparece no topo da área de membros e do admin) e o favicon (ícone na aba do navegador)."
      >
        <div className="space-y-5">
          <BrandingAssetUpload
            kind="logo"
            label="Logo"
            hint="PNG, JPG, SVG ou WebP — aparece dentro de um círculo, então funciona melhor centralizada"
            currentUrl={values.logo_url || null}
            onUpdated={url => { set('logo_url', url ?? ''); router.refresh() }}
          />
          <BrandingAssetUpload
            kind="favicon"
            label="Favicon"
            hint="PNG ou ICO quadrado — ícone da aba do navegador"
            currentUrl={values.favicon_url || null}
            onUpdated={url => { set('favicon_url', url ?? ''); router.refresh() }}
          />
        </div>
      </Section>

      {/* Paleta de cores */}
      <Section
        title="Paleta de cores"
        description="Use a cor da sua marca em botões, bordas, ícones e elementos de destaque da plataforma."
      >
        <ResponsiveGrid minItemWidth="200px">
          <ColorPicker label="Cor primária"    hint="Botões e destaques"  value={values.primary_color  ?? '#b48840'} onChange={v => set('primary_color',  v)} />
          <ColorPicker label="Cor de destaque" hint="Acento secundário"   value={values.brand_light    ?? '#d2b17b'} onChange={v => set('brand_light',    v)} />
          <ColorPicker label="Fundo — Claro"   hint="Fundo da página ☀️" value={values.bg_light       ?? '#e4e4e4'} onChange={v => set('bg_light',       v)} />
          <ColorPicker label="Fundo — Escuro"  hint="Fundo da página 🌙" value={values.bg_dark        ?? '#00060f'} onChange={v => set('bg_dark',        v)} />
          <ColorPicker label="Cards — Claro"   hint="Cards e painéis ☀️" value={values.card_bg_light  ?? '#ffffff'} onChange={v => set('card_bg_light',  v)} />
          <ColorPicker label="Cards — Escuro"  hint="Cards e painéis 🌙" value={values.card_bg_dark   ?? '#0d1020'} onChange={v => set('card_bg_dark',   v)} />
        </ResponsiveGrid>
      </Section>

      {/* Textos */}
      <Section
        title="Textos"
        description="Configure o nome da plataforma e a mensagem de boas-vindas exibida no dashboard dos membros."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da plataforma</label>
            <Input
              value={values.platform_name ?? ''}
              onChange={e => set('platform_name', e.target.value)}
              placeholder="Ex: Thiago Cantalovo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensagem de boas-vindas</label>
            <Textarea
              rows={2}
              placeholder="Mensagem exibida no topo do dashboard"
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
              <Input
                placeholder="5561991900589"
                className="flex-1"
                value={values.support_whatsapp ?? ''}
                onChange={e => set('support_whatsapp', e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Número completo com código do país, sem espaços ou +.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail de suporte</label>
            <Input
              type="email"
              value={values.support_email ?? ''}
              onChange={e => set('support_email', e.target.value)}
            />
          </div>
        </div>
      </Section>

    </div>
  )
}
