// app/api/webhooks/paddle/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // 🌌 Inicializamos Supabase de forma interna con privilegios de Administrador (Service Role)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'
  );

  try {
    // 1. Parseamos el JSON directo proveniente de los servidores de Paddle
    const body = await req.json();
    const eventType = body.event_type;

    console.log(`📡 Webhook recibido de Paddle: Evento tipo [${eventType}]`);

    // Guardamos la referencia del objeto de datos interno enviado por el simulador
    const subscriptionData = body.data;

    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.created':
      case 'subscription.updated':
        if (subscriptionData) {
          
          // 🚀 EXTRACCIÓN EXACTA SEGÚN TU JSON:
          // Como vimos en tu payload, 'custom_data' viene dentro del 'price' del primer ítem
          let userId = subscriptionData.items?.[0]?.price?.custom_data?.supabase_user_id;

          // Fallback 1: Si no está ahí, buscamos en la raíz del objeto por si acaso
          if (!userId) {
            userId = subscriptionData.custom_data?.supabase_user_id;
          }

          // Fallback 2: Si sigue sin aparecer, buscamos en tu base por el email del cliente
          if (!userId && subscriptionData.customer?.email) {
            console.log(`ℹ️ supabase_user_id no hallado en ítems. Buscando por email fallback: ${subscriptionData.customer.email}`);
            
            const { data: userData, error: userError } = await supabaseAdmin
              .from('profiles') 
              .select('id')
              .eq('email', subscriptionData.customer.email)
              .maybeSingle();

            if (!userError && userData) {
              userId = userData.id;
            }
          }

          if (!userId) {
            throw new Error(`Fatal: No se pudo determinar el user_id de Supabase en ninguna propiedad.`);
          }

          // Guardamos o actualizamos la suscripción estructurada en tu tabla relacional
          await upsertPaddleSubscription(supabaseAdmin, subscriptionData, userId);
        }
        break;

      case 'subscription.canceled':
        if (subscriptionData) {
          // Buscamos el ID en los ítems o directo en la tabla relacional
          let userId = subscriptionData.items?.[0]?.price?.custom_data?.supabase_user_id || subscriptionData.custom_data?.supabase_user_id;

          if (!userId) {
            userId = await getUserIdBySubscriptionId(supabaseAdmin, subscriptionData.id);
          }

          if (userId) {
            await upsertPaddleSubscription(supabaseAdmin, subscriptionData, userId);
          } else {
            console.warn(`⚠️ Ignorando cancelación: No se halló user_id para la suscripción: ${subscriptionData.id}`);
          }
        }
        break;

      default:
        console.log(`ℹ️ Evento de Paddle ignorado de forma segura: ${eventType}`);
    }
  } catch (error: any) {
    console.error('❌ Error crítico en Webhook Handler de Paddle:', error.message || error);
    return new NextResponse(`Webhook handler failed: ${error.message}`, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// --- FUNCIONES AUXILIARES COMPLETAMENTE PREPARADAS PARA TU JSON ---

async function upsertPaddleSubscription(supabaseAdmin: any, subscription: any, userId: string) {
  // Extraemos el price_id exacto mapeando tu JSON (línea 7 del payload)
  const paddlePriceId = subscription.items?.[0]?.price?.id || subscription.items?.[0]?.price_id;

  if (!paddlePriceId) {
    throw new Error('Missing price_id fields to bypass database strict constraints');
  }

  // 🔒 CONTROL DE FECHAS SEGURO (Mapeando 'current_billing_period' desde tu JSON nativo)
  const rawStart = subscription.current_billing_period?.starts_at || subscription.started_at;
  const rawEnd = subscription.current_billing_period?.ends_at || subscription.next_billed_at;

  const now = new Date();
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(now.getMonth() + 1);

  // Formateamos de forma estricta a ISO para que PostgreSQL lo inserte sin quejas
  const startDateIso = rawStart ? new Date(rawStart).toISOString() : now.toISOString();
  const endDateIso = rawEnd ? new Date(rawEnd).toISOString() : oneMonthFromNow.toISOString();
  const endedAtIso = subscription.canceled_at ? new Date(subscription.canceled_at).toISOString() : null;

  // Armamos la misma estructura exacta que tenías con Stripe
  const subscriptionData = {
    id: subscription.id,                     // ID de la suscripción (sub_...)
    user_id: userId,                         // UUID amarrado a Supabase
    status: subscription.status,             // Estado ('active', 'canceled')
    price_id: paddlePriceId,                 // El priceId (pri_...)
    cancel_at_period_end: subscription.scheduled_change?.action === 'cancel',
    current_period_start: startDateIso,
    current_period_end: endDateIso,
    ended_at: endedAtIso,
  };

  // Guardamos o actualizamos de forma atómica en la tabla 'subscriptions' de Patmos
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert([subscriptionData]);

  if (error) {
    console.error('❌ Supabase Upsert Error:', error);
    throw error;
  }
  
  console.log(`✅ Suscripción ${subscription.id} inyectada con éxito para el usuario ${userId}`);
}

async function getUserIdBySubscriptionId(supabaseAdmin: any, subscriptionId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('id', subscriptionId)
    .maybeSingle();

  if (error || !data) return null;
  return data.user_id;
}