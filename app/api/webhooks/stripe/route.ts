// app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
  const stripe = new Stripe(stripeKey);

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'
  );

  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || req.headers.get('Stripe-Signature');

  let event: Stripe.Event;

  try {
    if (!signature) throw new Error('Missing Stripe signature header');
    
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    );
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription;
          
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data.price'],
          });
          
          let userId = session.client_reference_id;

          // 🔒 FALLBACK DE SEGURIDAD ANTIFALLES: Si el ID viene vacío, buscamos directo en la tabla vinculada de auth
          if (!userId && session.customer_details?.email) {
            console.log(`ℹ️ client_reference_id missing. Fallback SQL table search by email: ${session.customer_details.email}`);
            
            // Consultamos la tabla nativa de identidades de Supabase para obtener el ID sin usar listUsers()
            const { data: userData, error: userError } = await supabaseAdmin
              .from('profiles') // Si tu tabla personalizada de usuarios se llama 'profiles' o 'users', cámbiala aquí
              .select('id')
              .eq('email', session.customer_details.email)
              .maybeSingle();

            if (!userError && userData) {
              userId = userData.id;
            }
          }

          if (!userId) {
            // Como medida extrema de desarrollo, si no encuentra el ID, vinculamos la suscripción al primer registro o arrojamos el fallo limpio
            throw new Error(`Fatal: No se pudo mapear un user_id válido en Supabase para ${session.customer_details?.email}`);
          }

          await upsertSubscription(supabaseAdmin, subscription, userId);
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as any;
        
        let userId = await getUserIdByCustomerId(supabaseAdmin, subscription.customer as string);
        
        if (!userId) {
          const customerData = await stripe.customers.retrieve(subscription.customer as string) as any;
          if (customerData?.email) {
            const { data: userData } = await supabaseAdmin
              .from('profiles') // Consistencia con la tabla elegida arriba
              .select('id')
              .eq('email', customerData.email)
              .maybeSingle();
              
            if (userData) userId = userData.id;
          }
        }

        if (userId) {
          await upsertSubscription(supabaseAdmin, subscription, userId);
        } else {
          console.warn(`⚠️ Ignorando evento: No se halló user_id en base para el cliente: ${subscription.customer}`);
        }
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error('❌ Error crítico en Webhook Handler:', error.message || error);
    return new NextResponse(`Webhook handler failed: ${error.message}`, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// --- FUNCIONES AUXILIARES ---

async function upsertSubscription(supabaseAdmin: any, subscription: any, userId: string) {
  const stripePriceId = subscription.items?.data?.[0]?.price?.id || subscription.plan?.id;

  if (!stripePriceId) {
    throw new Error('Missing price_id fields to bypass database strict constraints');
  }

  // 🔒 FORMATEO DEFENSIVO DE FECHAS: Pasamos strings planos limpios para evitar que Postgres aborte la conversión
  const subscriptionData = {
    id: subscription.id,
    user_id: userId,
    status: subscription.status,
    price_id: stripePriceId,
    cancel_at_period_end: !!subscription.cancel_at_period_end,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
  };

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert([subscriptionData]);

  if (error) {
    console.error('❌ Supabase Upsert Error:', error);
    throw error;
  }
  
  console.log(`✅ Suscripción ${subscription.id} guardada con éxito en Supabase para el usuario ${userId}`);
}

async function getUserIdByCustomerId(supabaseAdmin: any, customerId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (error || !data) return null;
  return data.id;
}