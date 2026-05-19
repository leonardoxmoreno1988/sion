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
          
          // 🔒 BLINDAJE DE PRECIO: Expandimos explícitamente los 'items' para asegurar que el price_id no llegue null
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data.price'],
          });
          
          // Usamos el id de usuario de Supabase que inyectamos en el checkout
          await upsertSubscription(supabaseAdmin, subscription, session.client_reference_id);
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as any;
        const userId = await getUserIdByCustomerId(supabaseAdmin, subscription.customer as string);
        if (userId) {
          await upsertSubscription(supabaseAdmin, subscription, userId);
        }
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error('❌ Error actualizando la base de datos desde el webhook:', error.message || error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// --- FUNCIONES AUXILIARES PASANDO EL CLIENTE ADMIN ---

async function upsertSubscription(supabaseAdmin: any, subscription: any, userId: string) {
  // Aseguramos una extracción defensiva del price id
  const stripePriceId = subscription.items?.data?.[0]?.price?.id || subscription.plan?.id;

  if (!stripePriceId) {
    console.error(`❌ Fatal: El price_id no pudo ser extraído de la suscripción ${subscription.id}`);
    throw new Error('Missing price_id fields to bypass database strict constraints');
  }

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

  if (error) throw error;
  console.log(`✅ Suscripción ${subscription.id} actualizada para el usuario ${userId}`);
}

async function getUserIdByCustomerId(supabaseAdmin: any, customerId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !data) return null;
  return data.id;
}