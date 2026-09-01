import { BrandLogo } from '@/components/BrandLogo'
import { Button } from '@/components/Button'

/**
 * Fora dos grupos (membro)/(admin) -- uma URL sem rota correspondente não
 * pertence a nenhum layout, então esta tela é autocontida (sem sidebar),
 * no mesmo padrão visual das páginas de autenticação.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 py-12 transition-colors duration-200">
      <div className="w-full max-w-sm text-center">
        <BrandLogo size={56} className="mx-auto mb-6" />
        <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--brand)' }}>
          Erro 404
        </p>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Página não encontrada</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          O endereço que você tentou acessar não existe ou foi movido. Verifique o link ou volte para o início.
        </p>
        <Button href="/dashboard">
          Voltar ao início
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
