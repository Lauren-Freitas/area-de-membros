import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Área de Membros — Thiago Cantalovo Nutricionista',
  description: 'Acesse seus conteúdos exclusivos.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Aplica tema antes da renderização para evitar piscar */}
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}})()`
        }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
