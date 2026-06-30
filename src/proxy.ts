import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rotas que exigem login (usuário sem sessão é redirecionado para /login)
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/produto') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/criar-senha') ||
    pathname.startsWith('/comunidade') ||
    pathname.startsWith('/assistente') ||
    pathname.startsWith('/ranking') ||
    pathname.startsWith('/certificado') ||
    pathname.startsWith('/busca')

  // Só a página de login redireciona usuário já logado para o dashboard
  const isLoginPage = pathname === '/login'

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isLoginPage && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)'],
}
