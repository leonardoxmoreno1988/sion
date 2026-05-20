// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Creamos una respuesta base copiando las cabeceras de la petición
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Instanciamos el cliente de Supabase optimizado para el Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Sincronizamos las cookies tanto en la petición como en la respuesta perimetral
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. Recuperamos el estado real del usuario de forma segura
  const { data: { user } } = await supabase.auth.getUser()

  const isChatRoute = request.nextUrl.pathname.startsWith('/chat')
  const isLoginRoute = request.nextUrl.pathname === '/login'

  // 🔒 REGLA 1: Si intenta entrar al chat pero NO está logueado, lo mandamos a /login
  if (isChatRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 🔓 REGLA 2: Si ya ESTÁ logueado e intenta ir a /login o a la raíz (/), lo mandamos directo a /chat
  if (user && (isLoginRoute || request.nextUrl.pathname === '/')) {
    return NextResponse.redirect(new URL('/chat', request.url))
  }

  return response
}

// 🎯 El Matcher le dice a Next.js qué rutas debe vigilar este archivo
export const config = {
  matcher: [
    '/',
    '/login',
    '/chat/:path*',
  ],
}