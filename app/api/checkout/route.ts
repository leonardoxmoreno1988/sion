// app/api/checkout/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// Inicializamos Stripe de manera segura con tu API version estricta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27' as any,
});

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const cookieStore = await cookies();

  // 1. Instanciamos Supabase para verificar si el cliente tiene sesión abierta
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

  // 🔒 CONTROL DE FLUJO: Si no está logueado, lo mandamos a autenticarse primero con Google
  if (!user) {
    return NextResponse.redirect(`${origin}/login?next=/api/checkout`);
  }

  try {
    // 2. Creamos la sesión de Checkout de Stripe vinculada matemáticamente al usuario
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          // 🎯 Tu ID de precio real e inyectado de tu catálogo de Stripe
          price: 'price_1TXptyRb2cKRI6uDvDzc6n7i', 
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: user.email,
      
      // 🚀 LLAVE MAESTRA: Metadatos idénticos que leerá el Webhook para actualizar Supabase
      client_reference_id: user.id, 
      metadata: {
        supabase_user_id: user.id,
      },

      // Direcciones de redirección según el comportamiento en la pasarela
      success_url: `${origin}/chat?session_id={CHECKOUT_SESSION_ID}&upgrade=success`,
      cancel_url: `${origin}/?upgrade=cancelled`,
    });

    // 3. Empujamos al navegador directamente a la pasarela de Stripe Checkout
    if (session.url) {
      return NextResponse.redirect(session.url);
    }

    return NextResponse.redirect(`${origin}/?error=stripe_session_failed`);

  } catch (error: any) {
    console.error('❌ Checkout Session Error:', error);
    return NextResponse.redirect(`${origin}/?error=internal_server_error`);
  }
}