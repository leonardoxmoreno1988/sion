import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Inicializamos el cliente de Supabase con la llave de servicio (Admin)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('x-signature');
    
    if (!hmacHeader) {
      return new NextResponse('Falta la firma digital', { status: 401 });
    }

    // Validar firma criptográfica
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody).digest('hex');

    if (digest !== hmacHeader) {
      console.error('❌ Firma inválida.');
      return new NextResponse('Firma inválida', { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const eventName = body.meta?.event_name;

    console.log(`🔔 Evento recibido de Lemon Squeezy: [${eventName}]`);

    // ⚡ LÓGICA DE NEGOCIO: Cuando se crea una suscripción exitosa en la pasarela
    if (eventName === 'subscription_created') {
      const subscriptionId = body.data.id;        // El ID único de suscripción en Lemon Squeezy
      const attributes = body.data?.attributes;
      
      // 🏷️ CAPTURA DEL PRICE_ID/VARIANT_ID DESDE LEMON SQUEEZY:
      const priceIdFromLemon = 
        attributes?.first_subscription_item?.price_id || 
        attributes?.variant_id?.toString() || 
        "1126683";

      // 📅 CAPTURA DE FECHAS DE PERIODO BLINDADAS (Evita Not-Null Constraint):
      // Si Lemon Squeezy no las envía en el formato esperado, calculamos la fecha actual y +30 días.
      const nowISO = new Date().toISOString();
      const nextMonthISO = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const currentPeriodStart = attributes?.renews_at 
        ? new Date(attributes.created_at).toISOString() 
        : nowISO;
        
      const currentPeriodEnd = attributes?.renews_at 
        ? new Date(attributes.renews_at).toISOString() 
        : nextMonthISO;

      // 🎯 CAPTURA DEL ID PERSONALIZADO BLINDADA:
      const userIdFromSupabase = 
        body.meta?.custom_data?.user_id || 
        body.meta?.custom_data?.["user_id"] ||
        attributes?.custom_data?.user_id;

      if (!userIdFromSupabase) {
        console.error('❌ Error: El webhook no recibió ningún [user_id] en el mapeo de custom_data.');
        return new NextResponse('Falta el ID de usuario', { status: 400 });
      }

      console.log(`⏳ Procesando activación PRO para el Usuario ID de Supabase: ${userIdFromSupabase} (Sub ID: ${subscriptionId})`);

      // 1️⃣ BUSCAR SI EL USUARIO YA TIENE UNA FILA EN LA TABLA SUBSCRIPTIONS
      const { data: existingSub, error: fetchError } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', userIdFromSupabase)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Error al buscar suscripción existente:', fetchError.message);
        return new NextResponse('Error consultando la base de datos', { status: 500 });
      }

      let dbResult;

      if (existingSub) {
        // 2️⃣ SI YA EXISTE: Hacemos un update normal incluyendo todas las columnas requeridas
        console.log(`🔄 El usuario ya existe en la tabla. Actualizando a estatus activo...`);
        dbResult = await supabaseAdmin
          .from('subscriptions')
          .update({ 
            status: 'active', 
            lemonsqueezy_sub_id: subscriptionId,
            price_id: priceIdFromLemon,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd
          })
          .eq('user_id', userIdFromSupabase);
      } else {
        // 3️⃣ SI NO EXISTE: Hacemos un insert limpio proveyendo id, price_id y periodos
        console.log(`✨ Usuario nuevo. Insertando registro PRO completo...`);
        dbResult = await supabaseAdmin
          .from('subscriptions')
          .insert({ 
            id: crypto.randomUUID(), 
            user_id: userIdFromSupabase,
            status: 'active', 
            lemonsqueezy_sub_id: subscriptionId,
            price_id: priceIdFromLemon,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd
          });
      }

      // Validar si ocurrió un error en cualquiera de las dos operaciones de escritura
      if (dbResult.error) {
        console.error('❌ Error al escribir en la tabla subscriptions en Supabase:', dbResult.error.message);
        return new NextResponse('Error actualizando la base de datos', { status: 500 });
      }

      console.log(`✅ ¡ÉXITO TOTAL! El búnker de Patmos ha activado al pastor con ID: ${userIdFromSupabase}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Error en el catch del Webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}