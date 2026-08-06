'use client'

import dynamic from 'next/dynamic'
import 'swagger-ui-react/swagger-ui.css'

// swagger-ui-react manipula o DOM diretamente e não é seguro em SSR —
// carrega só no cliente, depois que a página já respondeu.
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false })

export function SwaggerUIClient() {
  return <SwaggerUI url="/openapi.json" />
}
