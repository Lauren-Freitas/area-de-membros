import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BrandLogo } from '@/components/BrandLogo'
import { getSiteConfig } from '@/lib/branding'
import { PrintButton } from './PrintButton'

export default async function CertificadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const cfg = await getSiteConfig()
  const platformName = cfg.platform_name || 'Área de Membros'
  const issuerTitle = cfg.platform_tagline || ''
  const issuerCredential = cfg.cert_issuer_credential || ''

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cert, error: certError } = await supabase
    .from('certificates')
    .select('*, products(title), profiles(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  // "Não encontrado" (certificado alheio ou inexistente) é um caso válido pra
  // redirecionar sem aviso -- mas uma falha real de consulta não pode se
  // disfarçar da mesma coisa, senão vira o mesmo "certificado inacessível em
  // silêncio" que essa etapa corrigiu.
  if (certError) console.error('certificate query failed:', certError)
  if (!cert) redirect('/dashboard')

  const productTitle = (Array.isArray(cert.products) ? cert.products[0] : cert.products)?.title ?? ''
  const memberName = (Array.isArray(cert.profiles) ? cert.profiles[0] : cert.profiles)?.name ?? ''
  const issuedDate = new Date(cert.issued_at).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        @media print {
          body * { visibility: hidden; }
          #cert, #cert * { visibility: visible; }
          #cert { position: fixed; inset: 0; margin: 0; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Botão voltar e imprimir */}
      <div className="no-print flex items-center justify-between mb-6">
        <a href={`/produto/${cert.product_id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </a>
        <PrintButton />
      </div>

      {/* Certificado */}
      <div
        id="cert"
        className="relative max-w-3xl mx-auto bg-card rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 0 0 8px var(--brand), 0 0 0 12px var(--brand-border)' }}
      >
        {/* Fundo decorativo */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, var(--brand) 0, var(--brand) 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }} />

        <div className="relative px-10 py-14 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <BrandLogo size={72} />
          </div>

          {/* Título */}
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--brand)' }}>
            {platformName}{issuerTitle ? ` · ${issuerTitle}` : ''}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            Certificado de Conclusão
          </h1>
          <div className="w-24 h-0.5 mx-auto my-6" style={{ backgroundColor: 'var(--brand)' }} />

          {/* Texto principal */}
          <p className="text-base text-gray-500 mb-3">Certificamos que</p>
          <p className="text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            {memberName}
          </p>
          <p className="text-base text-gray-500 mb-2">concluiu com êxito o curso</p>
          <p className="text-2xl font-bold mb-8" style={{ color: 'var(--brand)', fontFamily: 'Georgia, serif' }}>
            {productTitle}
          </p>

          <div className="w-24 h-0.5 mx-auto mb-8" style={{ backgroundColor: '#e5e7eb' }} />

          {/* Data e assinatura */}
          <p className="text-sm text-gray-400 mb-10">Brasília, {issuedDate}</p>

          <div className="flex items-end justify-center gap-16">
            <div className="text-center">
              {/* Assinatura cursiva */}
              <p className="text-3xl mb-1" style={{ fontFamily: "'Dancing Script', cursive", color: 'var(--brand)', lineHeight: 1.2 }}>
                {platformName}
              </p>
              <div className="w-48 h-px bg-gray-300 mb-2 mx-auto" />
              <p className="text-sm font-semibold text-gray-700">{platformName}</p>
              {issuerTitle && (
                <p className="text-xs text-gray-400">{issuerTitle}{issuerCredential ? ` · ${issuerCredential}` : ''}</p>
              )}
            </div>
          </div>

          {/* ID do certificado */}
          <p className="text-[10px] text-gray-300 mt-10 font-mono">
            Certificado #{cert.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>
    </>
  )
}
