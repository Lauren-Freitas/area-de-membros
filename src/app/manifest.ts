import type { MetadataRoute } from 'next'
import { getSiteConfig } from '@/lib/branding'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const cfg = await getSiteConfig()
  const platformName = cfg.platform_name || 'Área de Membros'
  const themeColor = cfg.primary_color || '#b48840'

  return {
    name: `Área de Membros · ${platformName}`,
    short_name: platformName,
    description: 'Acesse seus conteúdos exclusivos.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: themeColor,
    icons: [
      { src: '/icon.png', sizes: '400x400', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
