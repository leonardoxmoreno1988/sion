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
    const eventName = body.meta.event_name;
    const attributes = body.data.attributes;

    console.log(`🔔 Evento recibido de Lemon Squeezy: [${eventName}]`);

    // ⚡ LÓGICA DE NEGOCIO: Cuando se crea una suscripción exitosa en la pasarela
    if (eventName === 'subscription_created') {
      const subscriptionId = body.data.id;        // El ID único de suscripción en Lemon Squeezy
      
      // 🎯 CAPTURA DEL ID PERSONALIZADO:
      // Extraemos el user_id que viaja de forma oculta en los metadatos del checkout
      const userIdFromSupabase = body.meta.custom_data?.user_id; 

      if (!userIdFromSupabase) {
        console.error('❌ Error: El webhook no recibió ningún [user_id] en custom_data. Asegúrate de pasarlo en la URL del checkout.');
        return new NextResponse('Falta el ID de usuario', { status: 400 });
      }

      console.log(`⏳ Procesando activación PRO para el Usuario ID de Supabase: ${userIdFromSupabase} (Sub ID: ${subscriptionId})`);

      // 🔄 ACTUALIZACIÓN EN SUPABASE:
      // Modificamos la tabla subscriptions buscando directamente por la columna del ID del usuario
      const { error } = await supabaseAdmin
        .from('subscriptions') 
        .update({ 
          status: 'active', 
          lemonsqueezy_sub_id: subscriptionId 
        })
        .eq('user_id', userIdFromSupabase); // <--- Cambia 'user_id' por el nombre exacto de la columna que almacena el ID del usuario en tu tabla

      if (error) {
        console.error('❌ Error al actualizar la tabla subscriptions en Supabase:', error.message);
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