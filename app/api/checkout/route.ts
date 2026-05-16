import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    
    // 1. Inicializar Supabase para capturar al usuario logueado
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Si el usuario no está logueado, no lo dejamos avanzar
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Inicializar Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-01-27' as any,
    });

    // 3. Crear la sesión de Checkout de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          // Aquí pones el ID del precio que creaste en tu catálogo de Stripe
          // Ej: 'price_1Qxyz...' (puedes crear uno rápido en tu panel de Stripe)
          price: 'price_1TXptyRb2cKRI6uDvDzc6n7i', 
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // ¡ESTA ES LA LLAVE MAESTRA QUE RECOGE EL WEBHOOK!
      client_reference_id: user.id, 
      customer_email: user.email,
      // Direcciones de redirección según el éxito del pago
      success_url: `${req.headers.get('origin')}/chat?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/prices`,
    });

    // Devolvemos la URL de Stripe para que el frontend redirija al usuario
    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error('❌ Checkout Session Error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}