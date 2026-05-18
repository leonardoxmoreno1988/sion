// app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  
  // 🔒 CORRECCIÓN: Extraemos correctamente searchParams de la URL de la petición
  const searchParams = requestUrl.searchParams;
  
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/chat';

  // Forzamos que use el mismo origen exacto desde donde viene la petición
  const origin = requestUrl.origin; 

  if (code) {
    const cookieStore = await cookies();
    
    // Creamos la respuesta de redirección explícita hacia el destino final (/chat)
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Inyectamos las opciones de la cookie de forma segura
            const cookieOptions = {
              ...options,
              path: '/',
              // Si estás en producción (Vercel), forzamos que la cookie sea accesible
              secure: requestUrl.protocol === 'https:',
              sameSite: 'lax' as const
            };
            
            cookieStore.set({ name, value, ...cookieOptions });
            response.cookies.set({ name, value, ...cookieOptions });
          },
          remove(name: string, options: CookieOptions) {
            const cookieOptions = {
              ...options,
              path: '/',
              secure: requestUrl.protocol === 'https:',
              sameSite: 'lax' as const
            };

            cookieStore.set({ name, value: '', ...cookieOptions });
            response.cookies.set({ name, value: '', ...cookieOptions });
          },
        },
      }
    );

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        // Retornamos la respuesta con las cookies ya grabadas físicamente
        return response;
      }
      console.error("Supabase Session Exchange Error:", error.message);
    } catch (err) {
      console.error("Auth Callback Exception:", err);
    }
  }

  // Fallback seguro en caso de error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}