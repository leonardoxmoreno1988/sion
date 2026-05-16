import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Inicialización defensiva: Si la clave no existe (como en el build de Vercel), pasa un string vacío temporal
// Esto evita que el constructor de Stripe tire un error fatal durante la compilación
const stripeKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-01-27' as any,
});

// Inicializamos el cliente de Supabase con la misma lógica defensiva
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('Stripe-Signature');

  let event: Stripe.Event;

  try {
    if (!signature) throw new Error('Missing Stripe signature');
    // Verificamos que el evento realmente venga de Stripe y no sea un ataque simulado
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const session = event.data.object as any;

  // Manejamos los eventos vitales de la suscripción
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        // El usuario completó el pago por primera vez
        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Guardamos o actualizamos la suscripción en Supabase
          await upsertSubscription(subscription, session.client_reference_id);
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // El usuario renovó, cambió de plan, entró en impago o canceló
        const subscription = event.data.object as any;
        // En estos eventos, buscamos al usuario por su stripe_customer_id
        const userId = await getUserIdByCustomerId(subscription.customer as string);
        if (userId) {
          await upsertSubscription(subscription, userId);
        }
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('❌ Error actualizando la base de datos desde el webhook:', error);
    return new NextResponse('Webhook handler failed', { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// --- FUNCIONES AUXILIARES PARA MAPEAR LOS DATOS ---

async function upsertSubscription(subscription: any, userId: string) {
  const subscriptionData = {
    id: subscription.id,
    user_id: userId,
    status: subscription.status,
    price_id: subscription.items?.data?.[0]?.price?.id || '',
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

async function getUserIdByCustomerId(customerId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (error || !data) return null;
  return data.id;
}