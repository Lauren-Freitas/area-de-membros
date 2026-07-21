'use client'

import Image from 'next/image'
import { useBrandLogo } from '@/components/BrandProvider'

/**
 * Logo da plataforma. Se o admin fez upload de uma logo própria (Aparência),
 * usa ela (mesma imagem nos dois modos). Senão, cai pros dois PNGs padrão
 * (um pra cada modo claro/escuro).
 */
export function BrandLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  const logoUrl = useBrandLogo()

  if (logoUrl) {
    return <Image src={logoUrl} alt="Logo" width={size} height={size} className={`rounded-full object-cover ${className}`} />
  }

  return (
    <>
      <Image src="/iav_1024.png" alt="Logo" width={size} height={size} className={`rounded-full dark:hidden ${className}`} priority />
      <Image src="/iav_grafite_1024.png" alt="Logo" width={size} height={size} className={`rounded-full hidden dark:block ${className}`} priority />
    </>
  )
}
