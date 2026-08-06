import Link from 'next/link'

interface Step {
  label: string
  sub?: string
}

interface Flow {
  title: string
  desc: string
  steps: Step[]
}

const FLOWS: Flow[] = [
  {
    title: 'Novo paciente vira acesso liberado — sem toque manual',
    desc: 'Thiago cadastra a venda no Notion. Um fluxo n8n olha essa mudança, decide quais produtos o paciente deve receber, e chama a API. A plataforma cuida do resto sozinha.',
    steps: [
      { label: 'Notion', sub: 'cadastro da venda' },
      { label: 'n8n', sub: 'decide os produtos' },
      { label: 'API', sub: 'POST /api/admin/usuarios' },
      { label: 'Área de Membros', sub: 'cria + libera + convida' },
      { label: 'Paciente', sub: 'recebe acesso' },
    ],
  },
  {
    title: 'Compra aprovada no Asaas/Kiwify — liberação automática',
    desc: 'Pagamento confirma → a plataforma já cria o membro e libera o produto sozinha (webhook de entrada). Se quiser reagir a isso em outro sistema (ex. atualizar o Notion), escute o webhook de saída.',
    steps: [
      { label: 'Compra aprovada', sub: 'Asaas / Kiwify' },
      { label: 'Webhook de entrada', sub: 'a plataforma já libera' },
      { label: 'purchase.approved', sub: 'webhook de saída' },
      { label: 'n8n', sub: 'escuta o evento' },
      { label: 'Notion / Email / WhatsApp', sub: 'você decide o que fazer' },
    ],
  },
  {
    title: 'Paciente cancelou — revogação e aviso automáticos',
    desc: 'Cancelamento identificado em qualquer sistema (Asaas, planilha, Notion) → n8n chama a API pra revogar o acesso e notificar quem precisa saber.',
    steps: [
      { label: 'Paciente cancelou', sub: 'Asaas / Notion / manual' },
      { label: 'n8n', sub: 'identifica o cancelamento' },
      { label: 'API', sub: 'DELETE /api/admin/acesso' },
      { label: 'Acesso revogado', sub: 'imediato' },
      { label: 'Notificação', sub: 'Slack / email / WhatsApp' },
    ],
  },
]

function FlowRow({ steps }: { steps: Step[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="rounded-xl border px-3.5 py-2.5 text-center" style={{ borderColor: 'var(--brand-border)', backgroundColor: 'var(--brand-bg)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{step.label}</p>
            {step.sub && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{step.sub}</p>}
          </div>
          {i < steps.length - 1 && (
            <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          )}
        </div>
      ))}
    </div>
  )
}

export default function AutomacoesPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/integracoes" className="text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Automações</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Como essa plataforma normalmente funciona — sem precisar operar manualmente.</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          A tela de <strong>Gerenciar Membros</strong> existe pra consultar, corrigir e resolver exceções — não é onde o dia a dia acontece. Na prática, quem decide quais produtos um paciente recebe é o Notion ou o n8n, e quem executa é a API. Os três fluxos abaixo cobrem os casos mais comuns.
        </p>
      </div>

      {FLOWS.map(flow => (
        <div key={flow.title} className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">{flow.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{flow.desc}</p>
          </div>
          <div className="overflow-x-auto pb-1">
            <FlowRow steps={flow.steps} />
          </div>
        </div>
      ))}

      <p className="text-sm text-gray-500">
        Referência técnica completa (endpoints, eventos, exemplos de código) em{' '}
        <Link href="/admin/integracoes/documentacao" className="underline font-medium" style={{ color: 'var(--brand)' }}>Documentação</Link>.
      </p>
    </div>
  )
}
