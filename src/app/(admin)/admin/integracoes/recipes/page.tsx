import Link from 'next/link'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://membros.thiagocantalovo.com'

interface Step {
  label: string
  sub?: string
}

interface Recipe {
  title: string
  desc: string
  steps: Step[]
  curl?: string
  note?: string
}

const RECIPES: Recipe[] = [
  {
    title: 'Novo paciente',
    desc: 'Venda registrada em qualquer sistema vira membro com acesso liberado, sem toque manual.',
    steps: [
      { label: 'Notion', sub: 'cadastro da venda' },
      { label: 'n8n', sub: 'decide os produtos' },
      { label: 'API', sub: 'POST /api/admin/usuarios' },
      { label: 'Área de Membros', sub: 'cria + libera + convida' },
      { label: 'Paciente', sub: 'recebe acesso' },
    ],
    curl: `curl -X POST ${baseUrl}/api/admin/usuarios \\
  -H "x-api-key: sua-chave" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"João Silva","email":"joao@email.com","products":["uuid-do-produto"]}'`,
  },
  {
    title: 'Compra aprovada',
    desc: 'Pagamento confirmado no Asaas/Kiwify já libera acesso sozinho (webhook de entrada) — nenhuma chamada de API necessária aqui. Escute o webhook de saída pra reagir em outro lugar.',
    steps: [
      { label: 'Asaas / Kiwify', sub: 'pagamento confirmado' },
      { label: 'Webhook de entrada', sub: 'libera acesso automaticamente' },
      { label: 'purchase.approved', sub: 'webhook de saída' },
      { label: 'n8n', sub: 'escuta o evento' },
      { label: 'Notion / WhatsApp', sub: 'você decide o que fazer' },
    ],
    note: 'Configure o endpoint em Integrações → Webhooks, evento purchase.approved. Payload completo em Webhooks.',
  },
  {
    title: 'Cancelamento',
    desc: 'Identificado o cancelamento em qualquer sistema, revoga o acesso e avisa quem precisa saber.',
    steps: [
      { label: 'Asaas / Notion', sub: 'cancelamento identificado' },
      { label: 'n8n', sub: 'aciona a revogação' },
      { label: 'API', sub: 'DELETE /api/admin/acesso' },
      { label: 'Acesso revogado', sub: 'imediato' },
      { label: 'E-mail / Slack', sub: 'notificação' },
    ],
    curl: `curl -X DELETE ${baseUrl}/api/admin/acesso \\
  -H "x-api-key: sua-chave" \\
  -H "Content-Type: application/json" \\
  -d '{"user_id":"uuid-do-membro","product_id":"uuid-do-produto"}'`,
  },
  {
    title: 'Liberar produto',
    desc: 'Conceder acesso a um produto específico pra um membro já existente.',
    steps: [
      { label: 'Decisão externa', sub: 'Notion, planilha, humano' },
      { label: 'API', sub: 'POST /api/admin/acesso' },
      { label: 'Acesso liberado', sub: 'imediato' },
    ],
    curl: `curl -X POST ${baseUrl}/api/admin/acesso \\
  -H "x-api-key: sua-chave" \\
  -H "Content-Type: application/json" \\
  -d '{"user_id":"uuid-do-membro","product_id":"uuid-do-produto"}'`,
  },
  {
    title: 'Atualizar validade de acesso',
    desc: 'Mudar quando um acesso já concedido expira, sem revogar e conceder de novo.',
    steps: [
      { label: 'Nova data decidida', sub: 'externamente' },
      { label: 'API', sub: 'PATCH /api/admin/acesso' },
      { label: 'Validade atualizada', sub: 'imediato' },
    ],
    curl: `curl -X PATCH ${baseUrl}/api/admin/acesso \\
  -H "x-api-key: sua-chave" \\
  -H "Content-Type: application/json" \\
  -d '{"user_id":"uuid-do-membro","product_id":"uuid-do-produto","expires_at":"2026-12-31T00:00:00.000Z"}'`,
  },
  {
    title: 'Renovar assinatura',
    desc: 'Pagamento recorrente confirmado — estende a validade a partir de hoje em vez de substituir por uma data fixa.',
    steps: [
      { label: 'Cobrança recorrente paga', sub: 'Asaas' },
      { label: 'n8n', sub: 'calcula nova data (+30 dias)' },
      { label: 'API', sub: 'PATCH /api/admin/acesso' },
      { label: 'Assinatura renovada', sub: 'sem interrupção' },
    ],
    curl: `curl -X PATCH ${baseUrl}/api/admin/acesso \\
  -H "x-api-key: sua-chave" \\
  -H "Content-Type: application/json" \\
  -d '{"user_id":"uuid-do-membro","product_id":"uuid-do-produto","expires_at":"{{data atual + 30 dias}}"}'`,
    note: 'A data de expiração é calculada por quem chama (ex. um nó Function no n8n) — a API só grava o valor que ela recebe.',
  },
  {
    title: 'Adicionar bônus',
    desc: 'Liberar um produto extra sem tocar nos acessos que o membro já tem.',
    steps: [
      { label: 'Condição atendida', sub: 'ex: indicou 3 amigos' },
      { label: 'API', sub: 'POST /api/admin/acesso (produto bônus)' },
      { label: 'Bônus liberado', sub: 'acessos existentes intactos' },
    ],
    curl: `curl -X POST ${baseUrl}/api/admin/acesso \\
  -H "x-api-key: sua-chave" \\
  -H "Content-Type: application/json" \\
  -d '{"user_id":"uuid-do-membro","product_id":"uuid-do-produto-bonus"}'`,
  },
  {
    title: 'Trocar produto',
    desc: 'Upgrade/downgrade — revoga o acesso atual e concede o novo em sequência.',
    steps: [
      { label: 'Troca decidida', sub: 'ex: upgrade de plano' },
      { label: 'API', sub: 'DELETE acesso antigo' },
      { label: 'API', sub: 'POST acesso novo' },
      { label: 'Produto trocado', sub: 'sem período sem acesso' },
    ],
    curl: `curl -X DELETE ${baseUrl}/api/admin/acesso \\
  -H "x-api-key: sua-chave" -H "Content-Type: application/json" \\
  -d '{"user_id":"uuid-do-membro","product_id":"uuid-produto-antigo"}'

curl -X POST ${baseUrl}/api/admin/acesso \\
  -H "x-api-key: sua-chave" -H "Content-Type: application/json" \\
  -d '{"user_id":"uuid-do-membro","product_id":"uuid-produto-novo"}'`,
    note: 'Chame POST antes de DELETE se preferir garantir que o membro nunca fique um segundo sem nenhum acesso ativo.',
  },
  {
    title: 'Enviar certificado',
    desc: 'Emitir certificado de conclusão manualmente (fora do fluxo automático de aula concluída).',
    steps: [
      { label: 'Conclusão confirmada', sub: 'externamente' },
      { label: 'API', sub: 'POST /api/admin/certificados' },
      { label: 'Certificado emitido', sub: '+ notificação ao membro' },
    ],
    curl: `curl -X POST ${baseUrl}/api/admin/certificados \\
  -H "x-api-key: sua-chave" \\
  -H "Content-Type: application/json" \\
  -d '{"user_id":"uuid-do-membro","product_id":"uuid-do-produto"}'`,
    note: 'Idempotente — chamar de novo com o mesmo par não gera um segundo certificado.',
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

function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6 space-y-3.5">
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{recipe.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{recipe.desc}</p>
      </div>
      <div className="overflow-x-auto pb-1">
        <FlowRow steps={recipe.steps} />
      </div>
      {recipe.curl && (
        <pre className="bg-gray-900 text-gray-100 rounded-xl p-3.5 text-[11px] overflow-x-auto leading-relaxed">{recipe.curl}</pre>
      )}
      {recipe.note && <p className="text-xs text-gray-400">{recipe.note}</p>}
    </div>
  )
}

export default function RecipesPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/integracoes" className="text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Recipes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Fluxos completos, prontos pra usar — não é referência técnica, é o &quot;como fazer X&quot; direto.</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          A tela de <strong>Gerenciar Membros</strong> existe pra consultar, corrigir e resolver exceções — o dia a dia normalmente é automatizado por uma das receitas abaixo. Cada uma mostra o fluxo e uma chamada de exemplo em cURL; o mesmo endpoint funciona a partir de n8n, Make, Zapier ou qualquer linguagem — outros exemplos de código (JavaScript, PHP, Python) estão na{' '}
          <Link href="/admin/integracoes/api-reference" className="underline font-medium" style={{ color: 'var(--brand)' }}>API Reference</Link>.
        </p>
      </div>

      {RECIPES.map(recipe => <RecipeCard key={recipe.title} recipe={recipe} />)}
    </div>
  )
}
