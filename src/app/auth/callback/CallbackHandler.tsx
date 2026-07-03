'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    async function handle() {
      // PKCE flow — password reset and OAuth
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        router.replace(error ? '/login?erro=link_invalido' : next)
        return
      }

      // Implicit flow — invite links gerados pelo admin (token vem no hash da URL)
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.replace('#', ''))
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          router.replace(error ? '/login?erro=link_invalido' : next)
          return
        }
      }

      router.replace('/login?erro=link_invalido')
    }

    handle()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
