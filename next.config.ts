import type { NextConfig } from "next";

// Deriva do próprio projeto Supabase configurado no ambiente, em vez de fixar
// o hostname de um projeto específico -- assim um clone da plataforma para
// outro cliente/projeto Supabase não precisa editar este arquivo.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Impede que a página seja embutida em iframes de outros domínios (clickjacking)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Impede que o browser "adivinhe" o tipo de arquivo (MIME sniffing)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Não vaza URL de origem ao navegar para sites externos
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Desativa câmera, microfone e geolocalização na plataforma
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
};

export default nextConfig;
