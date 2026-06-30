import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { createAdminClient } from '@/lib/supabase/admin'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Área de Membros — Thiago Cantalovo Nutricionista',
  description: 'Acesse seus conteúdos exclusivos.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let customCss = ''
  try {
    const adminClient = createAdminClient()
    const { data: rows } = await adminClient.from('site_config').select('key, value')
    const cfg = Object.fromEntries((rows ?? []).map(r => [r.key, r.value]))
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
