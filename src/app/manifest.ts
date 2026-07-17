import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let platformName = 'Thiago Cantalovo'
  let themeColor = '#b48840'
  try {
    const admin = createAdminClient()
    const { data: rows } = await admin.from('site_config').select('key, value')
    const cfg = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))
    platformName = cfg.platform_name || platformName
    themeColor = cfg.primary_color || themeColor
  } catch {}

  return {
    name: `Área de Membros — ${platformName}`,
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
