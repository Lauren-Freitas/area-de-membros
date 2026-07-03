import { Suspense } from 'react'
import { CallbackHandler } from './CallbackHandler'

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">Verificando...</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  )
}
