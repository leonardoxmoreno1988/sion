// app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/chat';

  // Si ya estás en producción, asegúrate de usar HTTPS, si estás local usa HTTP
  const requestUrl = new URL(request.url);

  if (code) {
    const cookieStore = await cookies();
    
    // Creamos una respuesta base hacia donde queremos redirigir al usuario
    const response = NextResponse.redirect(`${requestUrl.origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // 🔒 Next.js 15+ REQUIERE guardar las cookies TANTO en el almacén del servidor 
            // como en la cabecera de la respuesta de redirección que va al navegador.
            cookieStore.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        // Retornamos la respuesta que ya lleva las cookies inyectadas físicamente
        return response;
      }
      console.error("Error al intercambiar código por sesión:", error?.message);
    } catch (err) {
      console.error("Excepción en el callback de autenticación:", err);
    }
  }

  // Si algo falla, lo mandamos al login con un error explícito
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_failed`);
}