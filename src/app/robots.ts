import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://membros.thiagocantalovo.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/login',
      disallow: ['/admin', '/api', '/dashboard', '/produto', '/perfil', '/comunidade', '/assinatura', '/busca', '/ranking', '/atendimento'],
    },
    host: APP_URL,
  }
}
