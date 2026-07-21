'use client'

import { createContext, useContext } from 'react'

const BrandContext = createContext<{ logoUrl: string | null }>({ logoUrl: null })

export function BrandProvider({ logoUrl, children }: { logoUrl: string | null; children: React.ReactNode }) {
  return <BrandContext.Provider value={{ logoUrl }}>{children}</BrandContext.Provider>
}

export function useBrandLogo() {
  return useContext(BrandContext).logoUrl
}
