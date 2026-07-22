import type { Metadata, Viewport } from 'next'
import { Geist, Fraunces } from 'next/font/google'
import './globals.css'
import { createAdminClient } from '@/lib/supabase/admin'
import { cache } from 'react'
import { deriveBrandTokens, withLightness } from '@/lib/color'
import { BrandProvider } from '@/components/BrandProvider'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: ['600', '700'],
  style: ['normal'],
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
  const ogImage = cfg.logo_url || '/iav_1024.png'

  return {
    metadataBase: new URL(APP_URL),
    title: { default: title, template: `%s — ${platformName}` },
    description,
    ...(cfg.favicon_url ? { icons: { icon: cfg.favicon_url } } : {}),
    openGraph: {
      title,
      description,
      siteName: platformName,
      url: APP_URL,
      locale: 'pt_BR',
      type: 'website',
      images: [{ url: ogImage, width: 400, height: 400, alt: platformName }],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [ogImage],
    },
  }
}

export async function generateViewport(): Promise<Viewport> {
  const cfg = await getSiteConfig()
  return { themeColor: cfg.primary_color || '#b48840' }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cfg = await getSiteConfig()
  const logoUrl = cfg.logo_url || null

  let customCss = ''
  try {
    const primary = cfg.primary_color || '#b48840'
    const brandLight = cfg.brand_light || '#d2b17b'
    const tokens = deriveBrandTokens(primary)

    // Modo escuro usa a cor de destaque (mais clara) como --brand principal, senão o
    // acento fica ilegível em cima de fundo quase preto.
    const light: string[] = [
      `--brand:${primary}`,
      `--brand-light:${brandLight}`,
      `--brand-bg:${tokens.light.bg}`,
      `--brand-border:${tokens.light.border}`,
      `--brand-text:${tokens.light.text}`,
    ]
    const dark: string[] = [
      `--brand:${brandLight}`,
      `--brand-light:${withLightness(primary, 85, 0.75)}`,
      `--brand-bg:${tokens.dark.bg}`,
      `--brand-border:${tokens.dark.border}`,
      `--brand-text:${tokens.dark.text}`,
    ]
    if (cfg.bg_light) light.push(`--background:${cfg.bg_light}`)
    if (cfg.bg_dark) dark.push(`--background:${cfg.bg_dark}`)
    if (cfg.card_bg_light) light.push(`--card:${cfg.card_bg_light}`)
    if (cfg.card_bg_dark) dark.push(`--card:${cfg.card_bg_dark}`)
    customCss = `:root{${light.join(';')}}.dark{${dark.join(';')}}`
  } catch {}

  return (
    <html lang="pt-BR" className={`${geist.variable} ${fraunces.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Aplica tema antes da renderização para evitar piscar */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`
        }} />
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      </head>
      <body className="min-h-full">
        <BrandProvider logoUrl={logoUrl}>{children}</BrandProvider>
      </body>
    </html>
  )
}
