import { createAdminClient } from '@/lib/supabase/admin'
import { saveAppearance, restoreAppearanceDefaults } from '@/lib/actions/appearance'

const DEFAULTS: Record<string, string> = {
  platform_name: 'Thiago Cantalovo',
  primary_color: '#b48840',
  brand_light: '#d2b17b',
  bg_light: '#e4e4e4',
  bg_dark: '#00060f',
  card_bg_light: '#ffffff',
  card_bg_dark: '#0d1020',
  welcome_message: 'Bem-vindo à área de membros!',
  support_whatsapp: '5561991900589',
  support_email: 'contato@thiagocantalovo.com',
}

const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-300'

export default async function AparenciaPage() {
  const adminClient = createAdminClient()
  const { data: rows } = await adminClient.from('site_config').select('key, value')
  const config = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))

  function val(key: string) {
    return config[key] ?? DEFAULTS[key] ?? ''
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Aparência</h1>
          <p className="text-sm text-gray-500 mt-0.5">Personalize textos e cores da plataforma.</p>
        </div>
        <form action={restoreAppearanceDefaults}>
          <button
            type="submit"
            className="shrink-0 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            Restaurar padrão
          </button>
        </form>
      </div>

      <form action={saveAppearance} className="space-y-6 bg-white rounded-2xl border border-gray-100 p-6">

        {/* Textos */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Textos</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da plataforma</label>
            <input name="platform_name" defaultValue={val('platform_name')} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensagem de boas-vindas</label>
            <textarea
              name="welcome_message"
              rows={2}
              defaultValue={val('welcome_message')}
              placeholder="Mensagem exibida no topo do dashboard"
              className={`${inputClass} resize-none`}
            />
            <p className="text-xs text-gray-400 mt-1">Aparece no topo do dashboard para todos os membros.</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Cores */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cores</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cor primária</label>
              <div className="flex items-center gap-2">
                <input type="color" name="primary_color" defaultValue={val('primary_color')}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" />
                <span className="text-xs text-gray-400">Botões e destaques</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cor de destaque</label>
              <div className="flex items-center gap-2">
                <input type="color" name="brand_light" defaultValue={val('brand_light')}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" />
                <span className="text-xs text-gray-400">Acento secundário</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fundo — Modo Claro</label>
              <div className="flex items-center gap-2">
                <input type="color" name="bg_light" defaultValue={val('bg_light')}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" />
                <span className="text-xs text-gray-400">Fundo da página (☀️)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fundo — Modo Escuro</label>
              <div className="flex items-center gap-2">
                <input type="color" name="bg_dark" defaultValue={val('bg_dark')}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" />
                <span className="text-xs text-gray-400">Fundo da página (🌙)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cards — Modo Claro</label>
              <div className="flex items-center gap-2">
                <input type="color" name="card_bg_light" defaultValue={val('card_bg_light')}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" />
                <span className="text-xs text-gray-400">Cards e painéis (☀️)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cards — Modo Escuro</label>
              <div className="flex items-center gap-2">
                <input type="color" name="card_bg_dark" defaultValue={val('card_bg_dark')}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white" />
                <span className="text-xs text-gray-400">Cards e painéis (🌙)</span>
              </div>
            </div>
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
                name="support_whatsapp"
                defaultValue={val('support_whatsapp')}
                placeholder="5561991900589"
                className={`flex-1 ${inputClass}`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Número completo com código do país (sem espaços ou +).</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail de suporte</label>
            <input name="support_email" type="email" defaultValue={val('support_email')} className={inputClass} />
          </div>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="submit"
            className="px-5 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: '#b48840' }}
          >
            Salvar alterações
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
