import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    const cookieStore = await cookies();

    if (!userId) {
      return new NextResponse('Falta userId', { status: 400 });
    }

    // 1. Validar sesión en Supabase por seguridad
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // 2. Buscar el customer_id real en Supabase
    const { data: subscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('lemonsqueezy_sub_id') // Buscamos el ID de la suscripción para pedir el portal
      .eq('user_id', userId)
      .maybeSingle();

    if (dbError || !subscription || !subscription.lemonsqueezy_sub_id) {
      console.error('❌ No se encontró suscripción activa para el usuario en la DB');
      return new NextResponse('No customer found', { status: 404 });
    }

    // 3. Solicitar el enlace del Customer Portal directamente a la API de Lemon Squeezy
    const apiKey = process.env.LEMONSQUEEZY_API_KEY; // Necesitas tu API key de Lemon Squeezy en tu .env
    if (!apiKey) {
      console.error('❌ Falta LEMONSQUEEZY_API_KEY en las variables de entorno');
      return new NextResponse('Config Error', { status: 500 });
    }

    // Llamamos al endpoint oficial de Lemon Squeezy para generar la URL dinámica
    const lsResponse = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscription.lemonsqueezy_sub_id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
      }
    });

    if (!lsResponse.ok) {
      const errData = await lsResponse.text();
      console.error('❌ Error de Lemon Squeezy API:', errData);
      return new NextResponse('Lemon Squeezy API Error', { status: 500 });
    }

    const lsData = await lsResponse.json();
    // Extraemos la URL del portal del cliente que nos devuelve la API
    const customerPortalUrl = lsData.data?.attributes?.urls?.customer_portal;

    if (!customerPortalUrl) {
      return new NextResponse('Portal URL not found', { status: 500 });
    }

    return NextResponse.json({ url: customerPortalUrl });

  } catch (error) {
    console.error('❌ Billing Portal Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}