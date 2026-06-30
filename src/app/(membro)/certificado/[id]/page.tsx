import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { PrintButton } from './PrintButton'

export default async function CertificadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cert } = await supabase
    .from('certificates')
    .select('*, products(title), profiles(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

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
        <a href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition">
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
        className="relative max-w-3xl mx-auto bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 0 0 8px #b48840, 0 0 0 12px #dfc99a' }}
      >
        {/* Fundo decorativo */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #b48840 0, #b48840 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }} />

        <div className="relative px-10 py-14 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image src="/iav_1024.png" alt="Thiago Cantalovo" width={72} height={72} className="rounded-full" />
          </div>

          {/* Título */}
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-2" style={{ color: '#b48840' }}>
            Thiago Cantalovo · Nutricionista
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            Certificado de Conclusão
          </h1>
          <div className="w-24 h-0.5 mx-auto my-6" style={{ backgroundColor: '#b48840' }} />

          {/* Texto principal */}
          <p className="text-base text-gray-500 mb-3">Certificamos que</p>
          <p className="text-4xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            {memberName}
          </p>
          <p className="text-base text-gray-500 mb-2">concluiu com êxito o curso</p>
          <p className="text-2xl font-bold mb-8" style={{ color: '#b48840', fontFamily: 'Georgia, serif' }}>
            {productTitle}
          </p>

          <div className="w-24 h-0.5 mx-auto mb-8" style={{ backgroundColor: '#e5e7eb' }} />

          {/* Data e assinatura */}
          <p className="text-sm text-gray-400 mb-10">Brasília, {issuedDate}</p>

          <div className="flex items-end justify-center gap-16">
            <div className="text-center">
              {/* Assinatura cursiva */}
              <p className="text-3xl mb-1" style={{ fontFamily: "'Dancing Script', cursive", color: '#b48840', lineHeight: 1.2 }}>
                Thiago Cantalovo
              </p>
              <div className="w-48 h-px bg-gray-300 mb-2 mx-auto" />
              <p className="text-sm font-semibold text-gray-700">Thiago Cantalovo</p>
              <p className="text-xs text-gray-400">Nutricionista · CRN-1 7985</p>
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
