// app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/chat';

  if (code) {
    const cookieStore = await cookies(); 
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // 🔒 Blindaje Next.js 15: Forzar la escritura correcta de cookies en el Servidor
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Esto evita que falle si se intenta llamar desde un Server Component estático
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Evita caídas silenciosas en el middleware/callback
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 🚀 Modificación de seguridad: Asegurar que redirija a una URL absoluta
      return NextResponse.redirect(new URL(next, request.url));
    }
    
    console.error("Error intercambiando sesión:", error);
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', request.url));
}