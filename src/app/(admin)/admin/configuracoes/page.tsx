import { createClient } from '@/lib/supabase/server'
import { ConfiguracoesForm } from './ConfiguracoesForm'

const faq = [
  {
    q: 'Como liberar acesso a um produto para um usuário?',
    a: 'Vá em Membros → Gerenciar usuários, localize o usuário e clique no produto desejado para liberar o acesso.',
  },
  {
    q: 'Como o usuário recebe o acesso após comprar?',
    a: 'O Asaas envia um webhook quando o pagamento é confirmado. O sistema cria o usuário automaticamente e envia um email de boas-vindas com link para criar a senha.',
  },
  {
    q: 'Como faço para criar um produto?',
    a: 'Vá em Produtos → Criar produto, preencha as informações e salve. Depois copie o UUID do produto na URL e cole no campo "Referência externa" do link de pagamento no Asaas.',
  },
  {
    q: 'Posso excluir um usuário?',
    a: 'Sim. Em Gerenciar usuários, clique em "Excluir" ao lado do usuário. O acesso a todos os produtos é removido automaticamente. Administradores não podem ser excluídos por este painel.',
  },
  {
    q: 'Como integrar com n8n ou Make?',
    a: 'Use a API REST disponível em Integrações. Crie um nó HTTP Request com a URL do endpoint, adicione o header x-api-key com a chave de API e envie o body em JSON.',
  },
]

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', user?.id ?? '')
    .single()

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      {/* Perfil */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Meu perfil</h2>
        <ConfiguracoesForm name={profile?.name ?? ''} email={profile?.email ?? ''} />
      </div>

      {/* Tema */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Tema</h2>
        <p className="text-sm text-gray-500 mb-4">O modo escuro estará disponível em breve.</p>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-900 bg-white text-sm font-medium text-gray-900 cursor-default">
            ☀️ Claro (ativo)
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-900 text-sm font-medium text-gray-400 cursor-not-allowed opacity-50">
            🌙 Escuro (em breve)
          </div>
        </div>
      </div>

      {/* Suporte */}
      <div id="suporte" className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Suporte</h2>
        <p className="text-sm text-gray-500 mb-4">Precisa de ajuda? Entre em contato.</p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://wa.me/55"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: '#25D366' }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.13.558 4.122 1.532 5.852L.066 23.658a.5.5 0 00.611.611l5.806-1.466A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.783 9.783 0 01-4.99-1.366l-.358-.213-3.712.938.956-3.602-.233-.372A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
            </svg>
            Falar no WhatsApp
          </a>
          <a
            href="mailto:nutri@thiagocantalovo.com"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Enviar email
          </a>
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Perguntas frequentes</h2>
        <div className="space-y-4">
          {faq.map(({ q, a }) => (
            <div key={q} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-gray-800 mb-1">{q}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
