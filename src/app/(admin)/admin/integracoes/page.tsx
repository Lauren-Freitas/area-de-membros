import Link from 'next/link'

interface Card {
  href: string
  emoji: string
  name: string
  desc: string
}

const COMUNICACAO: Card[] = [
  { href: '/admin/integracoes/api-reference', emoji: '📡', name: 'API Reference', desc: 'Autenticação, API Keys e todos os endpoints: Membros, Acessos, Produtos e mais.' },
  { href: '/admin/integracoes/webhooks', emoji: '🔔', name: 'Webhooks', desc: 'Receba eventos da plataforma em qualquer endpoint.' },
  { href: '/admin/integracoes/documentacao', emoji: '📖', name: 'Documentação', desc: 'Ponto de partida: introdução, autenticação, API, eventos e recipes.' },
  { href: '/admin/integracoes/recipes', emoji: '⚡', name: 'Recipes', desc: 'Fluxos completos prontos: n8n, Make, Zapier, código, o que for.' },
]

function CardLink({ card }: { card: Card }) {
  return (
    <Link
      href={card.href}
      className="bg-card rounded-2xl border border-gray-200 dark:border-[#1e2030] p-6 flex flex-col gap-2 hover:shadow-md hover:border-gray-300 dark:hover:border-[#2a2f45] hover:bg-gray-50 dark:hover:bg-[#12162a] transition"
    >
      <span className="text-2xl">{card.emoji}</span>
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{card.name}</p>
      <p className="text-xs text-gray-400 leading-relaxed">{card.desc}</p>
    </Link>
  )
}

export default function IntegracoesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Integrações</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 max-w-xl">
          Construída seguindo o princípio API First. Qualquer ferramenta capaz de fazer requisições HTTP pode criar membros, conceder acessos, gerenciar produtos e reagir a eventos via Webhooks.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Comunicação</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COMUNICACAO.map(card => <CardLink key={card.href} card={card} />)}
        </div>
      </div>

      {/* Gateways de pagamento são a única exceção com card próprio: diferente de
          n8n/Make/Zapier (clientes HTTP genéricos, viram receita dentro de "Recipes"),
          um gateway fala diretamente com a plataforma via webhook de entrada e já cria
          o membro/libera o acesso sozinho. Asaas é o primeiro; Stripe, Mercado Pago,
          Hotmart, Kiwify e Kirvano entram depois seguindo a mesma estrutura de página,
          sem precisar mudar a arquitetura. */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Pagamentos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/integracoes/asaas"
            className="bg-card rounded-2xl border border-gray-200 dark:border-[#1e2030] p-6 flex flex-col gap-2 hover:shadow-md hover:border-gray-300 dark:hover:border-[#2a2f45] hover:bg-gray-50 dark:hover:bg-[#12162a] transition"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight" style={{ color: '#00b1e4' }}>Asaas</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#1a2035] text-gray-400 uppercase tracking-wide">Gateway</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">Webhook de pagamento confirmado. Libera acesso automaticamente, sem automação externa.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
