import type { NextConfig } from "next";

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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yakncmxiastulmmzodgp.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
