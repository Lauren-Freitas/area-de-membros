import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { createAdminClient } from '@/lib/supabase/admin'
import { cache } from 'react'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://membros.thiagocantalovo.com'

const getSiteConfig = cache(async (): Promise<Record<string, string>> => {
  try {
    const adminClient = createAdminClient()
    const { data: rows } = await adminClient.from('site_config').select('key, value')
    return Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))
  } catch {
    return {}
  }
})

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getSiteConfig()
  const platformName = cfg.platform_name || 'Thiago Cantalovo'
  const title = `Área de Membros — ${platformName}`
  const description = cfg.welcome_message || 'Acesse seus conteúdos exclusivos.'

  return {
    metadataBase: new URL(APP_URL),
    title: { default: title, template: `%s — ${platformName}` },
    description,
    openGraph: {
      title,
      description,
      siteName: platformName,
      url: APP_URL,
      locale: 'pt_BR',
      type: 'website',
      images: [{ url: '/iav_1024.png', width: 400, height: 400, alt: platformName }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ['/iav_1024.png'],
    },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const cfg = await getSiteConfig()
  return { themeColor: cfg.primary_color || '#b48840' }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let customCss = ''
  try {
    const cfg = await getSiteConfig()
    const light: string[] = []
    const dark: string[] = []
    if (cfg.primary_color) { light.push(`--brand:${cfg.primary_color}`); dark.push(`--brand:${cfg.primary_color}`) }
    if (cfg.brand_light) { light.push(`--brand-light:${cfg.brand_light}`); dark.push(`--brand-light:${cfg.brand_light}`) }
    if (cfg.bg_light) light.push(`--background:${cfg.bg_light}`)
    if (cfg.bg_dark) dark.push(`--background:${cfg.bg_dark}`)
    if (cfg.card_bg_light) light.push(`--card:${cfg.card_bg_light}`)
    if (cfg.card_bg_dark) dark.push(`--card:${cfg.card_bg_dark}`)
    if (light.length) customCss += `:root{${light.join(';')}}`
    if (dark.length) customCss += `.dark{${dark.join(';')}}`
  } catch {}

  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Aplica tema antes da renderização para evitar piscar */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`
        }} />
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
