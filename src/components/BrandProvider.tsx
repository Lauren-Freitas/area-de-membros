'use client'

import { createContext, useContext } from 'react'

interface BrandInfo {
  logoUrl: string | null
  platformName: string
  platformTagline: string
  supportWhatsapp: string
  supportEmail: string
}

const BrandContext = createContext<BrandInfo>({
  logoUrl: null,
  platformName: 'Área de Membros',
  platformTagline: '',
  supportWhatsapp: '',
  supportEmail: '',
})

export function BrandProvider({ logoUrl, platformName, platformTagline, supportWhatsapp, supportEmail, children }: BrandInfo & { children: React.ReactNode }) {
  return (
    <BrandContext.Provider value={{ logoUrl, platformName, platformTagline, supportWhatsapp, supportEmail }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrandLogo() {
  return useContext(BrandContext).logoUrl
}

/** Nome, subtítulo e contato de suporte resolvidos de site_config — usado onde um componente de cliente (ex: telas de auth) não pode chamar getSiteConfig() diretamente. */
export function useBrand() {
  return useContext(BrandContext)
}
