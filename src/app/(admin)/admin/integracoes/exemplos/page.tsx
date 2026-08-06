import Link from 'next/link'

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://membros.thiagocantalovo.com'

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl border border-gray-100 dark:border-[#1e2030] p-6 space-y-4">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">{children}</pre>
}

const TOOLS = [
  {
    name: 'n8n',
    body: (
      <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc list-inside space-y-1">
        <li>Nó <strong>HTTP Request</strong>, método <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">POST</code></li>
        <li>URL: <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">{baseUrl}/api/admin/acesso</code></li>
        <li>Header <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">x-api-key</code> = sua chave</li>
        <li>Body JSON: <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">{'{ "user_id": "{{$json.userId}}", "product_id": "uuid-do-produto" }'}</code></li>
        <li>Pra reagir a eventos da plataforma (venda aprovada, acesso revogado etc): nó <strong>Webhook</strong> como trigger, com a URL cadastrada em Integrações → Webhooks</li>
      </ul>
    ),
  },
  {
    name: 'Make (Integromat)',
    body: (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Módulo <strong>HTTP → Make a request</strong>, método POST, mesmo header/body do n8n acima. Pra escutar eventos, use o módulo <strong>Webhooks → Custom webhook</strong> e cadastre a URL gerada em Integrações → Webhooks.
      </p>
    ),
  },
  {
    name: 'Zapier',
    body: (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Action <strong>Webhooks by Zapier → Custom Request</strong>, method POST, mesma URL/header/body. Pra escutar eventos, um Zap com trigger <strong>Catch Hook</strong> — a URL gerada é o que você cadastra em Integrações → Webhooks.
      </p>
    ),
  },
  {
    name: 'ActiveCampaign, Mailchimp, HubSpot, RD Station',
    body: (
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Essas ferramentas não recebem chamada direta da plataforma — o padrão é usar n8n/Make/Zapier como ponte: escute o webhook de saída daqui (ex. <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">purchase.approved</code>) e, dentro da automação, chame a API nativa de cada uma pra criar/atualizar o contato, disparar uma sequência de e-mail, etc.
      </p>
    ),
  },
]

export default function ExemplosPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/integracoes" className="text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Exemplos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Tutoriais prontos — a plataforma fala HTTP puro, essas são só formas comuns de chamar.</p>
        </div>
      </div>

      <Section title="Fluxos comuns">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          A tela de <strong>Gerenciar Membros</strong> existe pra consultar, corrigir e resolver exceções — o dia a dia normalmente é automatizado. Os três fluxos abaixo cobrem os casos mais comuns.
        </p>
        <div className="space-y-5 pt-1">
          {FLOWS.map(flow => (
            <div key={flow.title} className="space-y-2.5">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{flow.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{flow.desc}</p>
              </div>
              <div className="overflow-x-auto pb-1">
                <FlowRow steps={flow.steps} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Ferramentas de automação">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Nenhuma dessas ferramentas é uma &quot;integração&quot; da plataforma — todas são só clientes HTTP conversando com a mesma <Link href="/admin/integracoes/documentacao" className="underline font-medium" style={{ color: 'var(--brand)' }}>API</Link>. O que muda é só como cada uma monta a chamada.
        </p>
        <div className="space-y-5">
          {TOOLS.map(tool => (
            <div key={tool.name}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{tool.name}</p>
              {tool.body}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Código">
        <p className="text-sm text-gray-600 dark:text-gray-300">Todos liberando acesso a um produto — troque a URL/body pra qualquer outro endpoint da <Link href="/admin/integracoes/documentacao" className="underline font-medium" style={{ color: 'var(--brand)' }}>referência</Link>.</p>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">curl</p>
          <CodeBlock>{`curl -X POST ${baseUrl}/api/admin/acesso \\
  -H "x-api-key: sua-chave" \\
  -H "Content-Type: application/json" \\
  -d '{"user_id": "uuid-do-membro", "product_id": "uuid-do-produto"}'`}</CodeBlock>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">JavaScript</p>
          <CodeBlock>{`await fetch("${baseUrl}/api/admin/acesso", {
  method: "POST",
  headers: {
    "x-api-key": "sua-chave",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ user_id: "uuid-do-membro", product_id: "uuid-do-produto" }),
})`}</CodeBlock>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">PHP</p>
          <CodeBlock>{`$ch = curl_init("${baseUrl}/api/admin/acesso");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ["x-api-key: sua-chave", "Content-Type: application/json"],
  CURLOPT_POSTFIELDS => json_encode(["user_id" => "uuid-do-membro", "product_id" => "uuid-do-produto"]),
]);
$response = curl_exec($ch);`}</CodeBlock>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Python</p>
          <CodeBlock>{`import requests

requests.post(
    "${baseUrl}/api/admin/acesso",
    headers={"x-api-key": "sua-chave"},
    json={"user_id": "uuid-do-membro", "product_id": "uuid-do-produto"},
)`}</CodeBlock>
        </div>
      </Section>
    </div>
  )
}
