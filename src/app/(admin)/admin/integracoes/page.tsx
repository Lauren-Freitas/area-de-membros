import Link from 'next/link'

interface Card {
  href: string
  emoji: string
  name: string
  desc: string
}

const COMUNICACAO: Card[] = [
  { href: '/admin/integracoes/api', emoji: '📡', name: 'API', desc: 'Faça chamadas HTTP para criar membros, conceder acessos e gerenciar produtos.' },
  { href: '/admin/integracoes/webhooks', emoji: '🔔', name: 'Webhooks', desc: 'Receba eventos da plataforma em qualquer endpoint.' },
  { href: '/admin/integracoes/documentacao', emoji: '📖', name: 'Documentação', desc: 'Endpoints, autenticação, eventos e payloads completos.' },
  { href: '/admin/integracoes/exemplos', emoji: '⚡', name: 'Exemplos', desc: 'Tutoriais prontos para n8n, Make, Zapier, código e automações.' },
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
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Conecte sua plataforma a qualquer sistema.</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Comunicação</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COMUNICACAO.map(card => <CardLink key={card.href} card={card} />)}
        </div>
      </div>

      {/* Asaas é a única exceção com card próprio: diferente de n8n/Make/Zapier (que são
          só clientes HTTP genéricos, viram exemplo dentro de "Exemplos"), o Asaas tem uma
          integração nativa de verdade aqui — recebe webhook de pagamento e já cria o
          membro/libera o acesso sozinho, sem precisar de n8n no meio. */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Pagamentos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/integracoes/asaas"
            className="bg-card rounded-2xl border border-gray-200 dark:border-[#1e2030] p-6 flex flex-col gap-2 hover:shadow-md hover:border-gray-300 dark:hover:border-[#2a2f45] hover:bg-gray-50 dark:hover:bg-[#12162a] transition"
          >
            <span className="text-xl font-black tracking-tight" style={{ color: '#00b1e4' }}>Asaas</span>
            <p className="text-xs text-gray-400 leading-relaxed">Webhook de pagamento confirmado — libera acesso automaticamente, sem automação externa.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
