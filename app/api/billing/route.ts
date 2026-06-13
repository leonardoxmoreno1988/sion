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

    // 2. Buscar si el usuario tiene una suscripción en la base de datos
    const { data: subscription, error: dbError } = await supabase
      .from('subscriptions')
      .select('lemonsqueezy_sub_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (dbError || !subscription || !subscription.lemonsqueezy_sub_id) {
      console.error('❌ No se encontró suscripción para el usuario en la DB');
      return new NextResponse('No customer found', { status: 404 });
    }

    // 3. ✨ EL ATAJO DE ORO: Construimos la URL oficial del portal de clientes de Lemon Squeezy
    // Al redirigirlos a /billing en tu subdominio de Lemon Squeezy, ellos ponen su correo o entran directo si ya iniciaron sesión al pagar.
    // También puedes usar el hub de facturación general de Lemon Squeezy:
    const customerPortalUrl = `https://patmos.lemonsqueezy.com/billing`;

    return NextResponse.json({ url: customerPortalUrl });

  } catch (error) {
    console.error('❌ Billing Portal Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}