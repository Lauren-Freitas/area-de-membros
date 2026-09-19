import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { getSiteConfig, buildBrandCss } from '@/lib/branding'
import { BrandProvider } from '@/components/BrandProvider'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://membros.thiagocantalovo.com'

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getSiteConfig()
  const platformName = cfg.platform_name || 'Área de Membros'
  const title = `Área de Membros · ${platformName}`
  const description = cfg.welcome_message || 'Acesse seus conteúdos exclusivos.'
  const ogImage = cfg.logo_url || '/iav_1024.png'

  return {
    metadataBase: new URL(APP_URL),
    title: { default: title, template: `%s · ${platformName}` },
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
  const customCss = buildBrandCss(cfg)
  const platformName = cfg.platform_name || 'Área de Membros'
  const platformTagline = cfg.platform_tagline || ''
  const supportWhatsapp = cfg.support_whatsapp || ''
  const supportEmail = cfg.support_email || ''

  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Aplica tema antes da renderização para evitar piscar */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`
        }} />
        {customCss && <style dangerouslySetInnerHTML={{ __html: customCss }} />}
      </head>
      <body className="min-h-full">
        <BrandProvider
          logoUrl={logoUrl}
          platformName={platformName}
          platformTagline={platformTagline}
          supportWhatsapp={supportWhatsapp}
          supportEmail={supportEmail}
        >
          {children}
        </BrandProvider>
      </body>
    </html>
  )
}
