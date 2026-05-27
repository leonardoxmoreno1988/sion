// app/api/portal/paddle/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 🚀 Eliminamos el parámetro 'request' no utilizado para evitar fallos de TypeScript en Vercel
export async function GET() {
  // Construimos el origen usando la variable de entorno de Vercel o fallback seguro de tu dominio
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.patmosresearch.com';
  const cookieStore = await cookies();

  // 1. Instanciamos Supabase de forma moderna (SSR) para identificar al usuario
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Manejado de forma interna por el middleware de Next.js
          }
        },
      },
    }
  );

  // Verificamos de forma segura el estado de autenticación
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    // 2. Buscamos el paddle_customer_id que guardó tu Webhook en la tabla 'subscriptions'
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('paddle_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const customerId = subscription?.paddle_customer_id;

    // 🚨 DETECCIÓN DEFENSIVA: Si no tiene ID de Paddle, lo regresamos al chat con aviso
    if (!customerId) {
      console.warn(`⚠️ No customer found in Paddle for user ID: ${user.id}`);
      return NextResponse.redirect(`${origin}/chat?error=no_paddle_customer_found`);
    }

    // 3. Conexión directa a las APIs de Paddle v2 (Detectando si es Sandbox o Live)
    const isSandbox = process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox' || !process.env.PADDLE_LIVE_SECRET_KEY;
    
    const apiKey = isSandbox 
      ? process.env.PADDLE_SANDBOX_SECRET_KEY 
      : process.env.PADDLE_LIVE_SECRET_KEY;

    const baseUrl = isSandbox
      ? 'https://sandbox-api.paddle.com'
      : 'https://api.paddle.com';

    console.log(`🚀 Solicitando enlace mágico de facturación a Paddle para el cliente: ${customerId}`);

    // 4. Creamos la sesión del portal de facturación en Paddle v2
    const response = await fetch(`${baseUrl}/customers/${customerId}/portal-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('❌ Error devuelto por la API de Paddle:', errText);
      throw new Error(`Paddle API Error: ${response.status} - ${errText}`);
    }

    const portalData = await response.json();
    
    // Extraemos la URL de destino generada dinámicamente por Paddle para tu cliente
    const portalUrl = portalData.data?.urls?.general?.overview;

    if (!portalUrl) {
      throw new Error('El JSON de Paddle no contiene la propiedad urls.general.overview');
    }

    console.log(`🟢 Enlace generado con éxito. Redirigiendo a Paddle Portal: ${portalUrl}`);

    // 5. Redirección forzada inmediata hacia el portal seguro de Paddle
    return NextResponse.redirect(portalUrl);

  } catch (error: any) {
    console.error('❌ Paddle Portal Session Error:', error);
    // 🔒 SALVAGUARDA TOTAL: Si explota la API, te regresa al chat con error en lugar de quedarse en blanco
    return NextResponse.redirect(`${origin}/chat?error=internal_server_error&msg=${encodeURIComponent(error.message || error)}`);
  }
}