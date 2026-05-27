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

    // Guardamos la referencia de los objetos internos
    const subscriptionData = body.data;

    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.created':
      case 'subscription.updated':
        if (subscriptionData) {
          // 🚀 PASO A PASO: Recuperamos el userId de Supabase inyectado en el customData
          let userId = subscriptionData.custom_data?.supabase_user_id;

          // Fallback en caso de que el identificador personalizado directo venga vacío (Búsqueda por Email)
          if (!userId && subscriptionData.customer?.email) {
            console.log(`ℹ️ supabase_user_id no encontrado en custom_data. Fallback buscando por email: ${subscriptionData.customer.email}`);
            
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
            throw new Error(`Fatal: No se pudo determinar el user_id de Supabase para ${subscriptionData.customer?.email}`);
          }

          // Guardamos o actualizamos la suscripción estructurada en la base de datos
          await upsertPaddleSubscription(supabaseAdmin, subscriptionData, userId);
        }
        break;

      case 'subscription.canceled':
        if (subscriptionData) {
          let userId = subscriptionData.custom_data?.supabase_user_id;

          // Si viene vacío en la cancelación, lo buscamos en tu tabla por el ID de suscripción de Paddle
          if (!userId) {
            userId = await getUserIdBySubscriptionId(supabaseAdmin, subscriptionData.id);
          }

          if (userId) {
            await upsertPaddleSubscription(supabaseAdmin, subscriptionData, userId);
          } else {
            console.warn(`⚠️ Ignorando evento de cancelación: No se halló user_id en base para la suscripción: ${subscriptionData.id}`);
          }
        }
        break;

      default:
        console.log(`ℹ️ Unhandled Paddle event type: ${eventType}`);
    }
  } catch (error: any) {
    console.error('❌ Error crítico en Webhook Handler de Paddle:', error.message || error);
    return new NextResponse(`Webhook handler failed: ${error.message}`, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// --- FUNCIONES AUXILIARES REFACTORIZADAS PARA PADDLE V2 ---

async function upsertPaddleSubscription(supabaseAdmin: any, subscription: any, userId: string) {
  // En Paddle v2 los ítems vienen en un array. Extraemos el price_id del primer ítem cobrado
  const paddlePriceId = subscription.items?.[0]?.price_id || subscription.items?.[0]?.price?.id;

  if (!paddlePriceId) {
    throw new Error('Missing price_id fields to bypass database strict constraints');
  }

  // 🔒 CONTROL DE FECHAS SEGURO Y CONVERSIÓN DE FORMATOS (Paddle v2 ya entrega strings ISO-8601 nativos)
  const rawStart = subscription.current_billing_period?.starts_at || subscription.started_at;
  const rawEnd = subscription.current_billing_period?.ends_at;

  const now = new Date();
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(now.getMonth() + 1);

  // Validamos y formateamos las fechas para evitar el error de "Invalid time value" en PostgreSQL
  const startDateIso = rawStart ? new Date(rawStart).toISOString() : now.toISOString();
  const endDateIso = rawEnd ? new Date(rawEnd).toISOString() : oneMonthFromNow.toISOString();
  const endedAtIso = subscription.canceled_at ? new Date(subscription.canceled_at).toISOString() : null;

  // Armamos el objeto con la misma estructura exacta que tenías con Stripe
  const subscriptionData = {
    id: subscription.id,                     // ID de la suscripción de Paddle (sub_...)
    user_id: userId,                         // UUID del usuario de Supabase
    status: subscription.status,             // Estado ('active', 'canceled', etc.)
    price_id: paddlePriceId,                 // El ID del precio real verificado (pri_...)
    cancel_at_period_end: subscription.scheduled_change?.action === 'cancel', // Equivalente nativo de Paddle para cancelaciones diferidas
    current_period_start: startDateIso,
    current_period_end: endDateIso,
    ended_at: endedAtIso,
  };

  // Guardamos la información en la tabla relacional existente de Supabase
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert([subscriptionData]);

  if (error) {
    console.error('❌ Supabase Upsert Error:', error);
    throw error;
  }
  
  console.log(`✅ Suscripción ${subscription.id} guardada con éxito en Supabase para el usuario ${userId}`);
}

// Busca el UUID del usuario basándose en el ID de la suscripción guardada previamente
async function getUserIdBySubscriptionId(supabaseAdmin: any, subscriptionId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('id', subscriptionId)
    .maybeSingle();

  if (error || !data) return null;
  return data.user_id;
}