import { createAdminClient } from '@/lib/supabase/admin'
import { saveAppearance } from '@/lib/actions/appearance'

const DEFAULTS: Record<string, string> = {
  platform_name: 'Thiago Cantalovo',
  primary_color: '#b48840',
  welcome_message: 'Bem-vindo à área de membros!',
  support_whatsapp: '5561991900589',
  support_email: 'contato@thiagocantalovo.com',
}

export default async function AparenciaPage() {
  const adminClient = createAdminClient()
  const { data: rows } = await adminClient.from('site_config').select('key, value')
  const config = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))

  function val(key: string) {
    return config[key] ?? DEFAULTS[key] ?? ''
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Aparência</h1>
        <p className="text-sm text-gray-500 mt-0.5">Personalize textos e cores da plataforma.</p>
      </div>

      <form action={saveAppearance} className="space-y-5 bg-white rounded-2xl border border-gray-100 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da plataforma</label>
          <input
            name="platform_name"
            defaultValue={val('platform_name')}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Cor primária</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="primary_color"
              defaultValue={val('primary_color')}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
            />
            <span className="text-xs text-gray-400">Cor usada em botões, links e destaques.</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensagem de boas-vindas</label>
          <textarea
            name="welcome_message"
            rows={2}
            defaultValue={val('welcome_message')}
            placeholder="Mensagem exibida no topo do dashboard"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">Aparece no topo do dashboard para todos os membros.</p>
        </div>

        <hr className="border-gray-100" />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp de suporte</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">+</span>
            <input
              name="support_whatsapp"
              defaultValue={val('support_whatsapp')}
              placeholder="5561991900589"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Número completo com código do país (sem espaços ou +).</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail de suporte</label>
          <input
            name="support_email"
            type="email"
            defaultValue={val('support_email')}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="px-5 py-2 text-white text-sm font-semibold rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: '#b48840' }}
          >
            Salvar alterações
          </button>
        </div>
      </form>
    </div>
  )
}
