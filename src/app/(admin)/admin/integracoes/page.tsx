import Link from 'next/link'

const apps = [
  {
    id: 'webhooks',
    name: 'Webhooks',
    desc: 'Envie eventos para qualquer URL',
    href: '/admin/integracoes/webhooks',
    external: false,
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    color: '#1a1a2e',
  },
  {
    id: 'api',
    name: 'API',
    desc: 'HTTP Request — n8n, Make, código',
    href: '/admin/integracoes/api',
    external: false,
    icon: (
      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    color: '#1a1a1a',
  },
  {
    id: 'n8n',
    name: 'n8n',
    desc: 'Automação open source',
    href: 'https://n8n.io',
    external: true,
    icon: null,
    label: 'n8n',
    labelColor: '#ea4b71',
    color: '#fff',
  },
  {
    id: 'make',
    name: 'Make',
    desc: 'Anteriormente Integromat',
    href: 'https://make.com',
    external: true,
    icon: null,
    label: 'Make',
    labelColor: '#6d00cc',
    color: '#fff',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    desc: 'Conecte seus apps',
    href: 'https://zapier.com',
    external: true,
    icon: null,
    label: 'zapier',
    labelColor: '#ff4a00',
    color: '#fff',
  },
  {
    id: 'asaas',
    name: 'Asaas',
    desc: 'Webhook + endpoints da API',
    href: '/admin/integracoes/asaas',
    external: false,
    icon: null,
    label: 'Asaas',
    labelColor: '#00b1e4',
    color: '#fff',
  },
  {
    id: 'activecampaign',
    name: 'ActiveCampaign',
    desc: 'E-mail marketing',
    href: 'https://activecampaign.com',
    external: true,
    icon: null,
    label: 'ActiveCampaign',
    labelColor: '#004cff',
    color: '#fff',
    soon: true,
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    desc: 'E-mail marketing',
    href: 'https://mailchimp.com',
    external: true,
    icon: null,
    label: 'Mailchimp',
    labelColor: '#ffe01b',
    labelTextColor: '#333',
    color: '#fff',
    soon: true,
  },
]

export default function IntegracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Integrações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Conecte a plataforma com suas ferramentas favoritas.</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Apps</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {apps.map((app) => {
            const cardClass = "relative bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center justify-center gap-3 hover:shadow-md hover:border-gray-300 transition group min-h-[130px]"
            const inner = (
              <>
                {app.external && (
                  <svg className="absolute top-3 right-3 w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
                {app.soon && (
                  <span className="absolute top-3 left-3 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 uppercase tracking-wide">
                    Em breve
                  </span>
                )}
                {app.icon ? (
                  <div className="text-gray-700">{app.icon}</div>
                ) : (
                  <span className="text-xl font-black tracking-tight" style={{ color: app.labelColor }}>
                    {app.label}
                  </span>
                )}
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">{app.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{app.desc}</p>
                </div>
              </>
            )
            return app.external ? (
              <a key={app.id} href={app.href} target="_blank" rel="noopener noreferrer" className={cardClass}>{inner}</a>
            ) : (
              <Link key={app.id} href={app.href} className={cardClass}>{inner}</Link>
            )
          })}
        </div>
      </div>

      {/* HTTP Request guide */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Usar com n8n / Make / Zapier</h2>
        <p className="text-sm text-gray-500 mb-4">
          Use um nó <strong>HTTP Request</strong> em qualquer plataforma de automação para liberar acesso, criar usuários e mais.
        </p>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#b48840' }}>1</span> Crie uma API Key em <Link href="/admin/integracoes/api" className="underline" style={{ color: '#b48840' }}>Integrações → API</Link></li>
          <li className="flex gap-2"><span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#b48840' }}>2</span> No n8n, adicione um nó <strong>HTTP Request</strong> com método POST</li>
          <li className="flex gap-2"><span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#b48840' }}>3</span> Header: <code className="bg-gray-100 px-1 rounded">x-api-key: sua-chave</code> · URL: <code className="bg-gray-100 px-1 rounded">/api/admin/acesso</code></li>
          <li className="flex gap-2"><span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: '#b48840' }}>4</span> Ou configure um <Link href="/admin/integracoes/webhooks" className="underline" style={{ color: '#b48840' }}>Webhook de saída</Link> para receber eventos da plataforma no n8n</li>
        </ol>
      </div>
    </div>
  )
}
