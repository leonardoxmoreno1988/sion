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
          
          // 1. Recuperamos la suscripción expandiendo los items del precio
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data.price'],
          });
          
          // 2. Extraemos el ID del usuario de Supabase de forma jerárquica y segura
          let userId = session.client_reference_id;

          // 🔒 FILTRADO NATIVO JAVASCRIPT: Traemos la colección y buscamos por coincidencia exacta
          if (!userId && session.customer_details?.email) {
            console.log(`ℹ️ client_reference_id missing. Fallback search by email: ${session.customer_details.email}`);
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            if (!listError && users) {
              const targetUser = users.find(u => u.email?.toLowerCase() === session.customer_details.email.toLowerCase());
              if (targetUser) userId = targetUser.id;
            }
          }

          if (!userId) {
            throw new Error(`Fatal: No se pudo determinar el user_id de Supabase para el cliente ${session.customer}`);
          }

          // 3. Guardamos la suscripción vinculada al usuario real de Supabase
          await upsertSubscription(supabaseAdmin, subscription, userId);
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as any;
        
        // Intentamos buscarlo por mapeo de tabla cliente, si falla, buscamos directo por correo en Stripe
        let userId = await getUserIdByCustomerId(supabaseAdmin, subscription.customer as string);
        
        // 🔒 FILTRADO NATIVO JAVASCRIPT: Traemos la colección y buscamos por coincidencia exacta
        if (!userId) {
          const customerData = await stripe.customers.retrieve(subscription.customer as string) as any;
          if (customerData?.email) {
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            if (!listError && users) {
              const targetUser = users.find(u => u.email?.toLowerCase() === customerData.email.toLowerCase());
              if (targetUser) userId = targetUser.id;
            }
          }
        }

        if (userId) {
          await upsertSubscription(supabaseAdmin, subscription, userId);
        } else {
          console.warn(`⚠️ Ignorando actualización: No se halló user_id para el cliente de Stripe: ${subscription.customer}`);
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

// --- FUNCIONES AUXILIARES PASANDO EL CLIENTE ADMIN ---

async function upsertSubscription(supabaseAdmin: any, subscription: any, userId: string) {
  const stripePriceId = subscription.items?.data?.[0]?.price?.id || subscription.plan?.id;

  if (!stripePriceId) {
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