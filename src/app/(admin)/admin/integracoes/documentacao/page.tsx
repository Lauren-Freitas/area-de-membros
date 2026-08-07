import Link from 'next/link'

interface IndexItem {
  href: string
  title: string
  desc: string
  badge?: string
}

const ITEMS: IndexItem[] = [
  { href: '/admin/integracoes/api-reference#autenticacao', title: 'Autenticação', desc: 'Header x-api-key, chaves mestra e nomeadas, escopos de permissão, formato de erro.' },
  { href: '/admin/integracoes/api-reference', title: 'API', desc: 'Todos os endpoints — Membros, Acessos, Produtos, Compras, Certificados, Convites, Login.' },
  { href: '/admin/integracoes/webhooks', title: 'Eventos', desc: 'Catálogo de eventos de webhook, payload padronizado, como testar.' },
  { href: '/admin/integracoes/recipes', title: 'Recipes', desc: 'Fluxos completos prontos — do gatilho de negócio até a chamada de API.' },
  { href: '', title: 'SDKs', desc: 'Bibliotecas oficiais (JavaScript, Python) — planejado, ainda não disponível.', badge: 'em breve' },
]

export default function DocumentacaoPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/integracoes" className="text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Documentação</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ponto de partida — cada seção vive na própria página, sem conteúdo repetido aqui.</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Introdução</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          Esta plataforma foi construída seguindo o princípio <strong>API First</strong>. Qualquer ferramenta capaz de fazer requisições HTTP — n8n, Make, Zapier, um script Python, uma aplicação Node — pode criar membros, conceder acessos, gerenciar produtos e reagir a eventos via Webhooks. A interface administrativa serve para consultar, corrigir e resolver exceções; o fluxo principal do negócio é automatizado através da API.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ITEMS.map(item => {
          const content = (
            <>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#1a2035] text-gray-400 uppercase tracking-wide">{item.badge}</span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.desc}</p>
            </>
          )
          return item.href ? (
            <Link key={item.title} href={item.href} className="bg-card rounded-2xl border border-gray-200 dark:border-[#1e2030] p-5 hover:shadow-md hover:border-gray-300 dark:hover:border-[#2a2f45] hover:bg-gray-50 dark:hover:bg-[#12162a] transition">
              {content}
            </Link>
          ) : (
            <div key={item.title} className="bg-card rounded-2xl border border-gray-200 dark:border-[#1e2030] p-5 opacity-60">
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
