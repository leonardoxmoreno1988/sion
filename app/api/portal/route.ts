// app/api/portal/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const cookieStore = await cookies();

  // 1. Instanciamos Supabase para identificar al usuario logueado
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

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.error("❌ STRIPE_SECRET_KEY missing.");
    return NextResponse.redirect(`${origin}/chat?error=portal_config_error`);
  }

  try {
    const stripe = new Stripe(stripeSecret);

    // 2. Buscamos al cliente en Stripe por su correo electrónico
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    // 🚨 DETECCIÓN DEFENSIVA: Si el cliente no existe en Stripe, lo regresamos al chat con aviso
    if (!customers.data || customers.data.length === 0) {
      console.warn(`⚠️ No customer found in Stripe for email: ${user.email}`);
      return NextResponse.redirect(`${origin}/chat?error=no_stripe_customer_found`);
    }

    const stripeCustomerId = customers.data[0].id;

    // 3. Creamos la sesión del portal de facturación
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/chat`,
    });

    // 4. Redirección forzada inmediata hacia Stripe
    if (portalSession && portalSession.url) {
      return NextResponse.redirect(portalSession.url);
    }

    // Si por alguna razón extraña no generó URL, rebotamos al chat
    return NextResponse.redirect(`${origin}/chat?error=portal_url_generation_failed`);

  } catch (error: any) {
    console.error('❌ Stripe Portal Session Error:', error);
    // 🔒 SALVAGUARDA TOTAL: Si explota la API, te regresa al chat en lugar de quedarse en blanco
    return NextResponse.redirect(`${origin}/chat?error=internal_server_error&msg=${encodeURIComponent(error.message)}`);
  }
}