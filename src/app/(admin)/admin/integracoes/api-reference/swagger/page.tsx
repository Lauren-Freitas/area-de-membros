import Link from 'next/link'
import { SwaggerUIClient } from './SwaggerUIClient'

/**
 * Swagger UI pra validar endpoints rapidamente (chamar de verdade, com sua
 * chave) sem sair do navegador. Já está protegido pela mesma sessão de
 * admin que o resto de /admin/** — não precisa de gate adicional pra ficar
 * fora do público.
 */
export default function SwaggerPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/admin/integracoes/api-reference" className="text-gray-400 hover:text-gray-700 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Swagger UI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Clique em &quot;Authorize&quot;, cole sua chave (header <code className="bg-gray-100 dark:bg-[#1a2035] px-1 rounded text-xs">x-api-key</code>), e teste qualquer endpoint direto daqui.
          </p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 dark:border-[#1e2030] overflow-hidden">
        <SwaggerUIClient />
      </div>
    </div>
  )
}
