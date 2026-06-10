import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('x-signature');

    if (!hmacHeader) {
      return new NextResponse('Falta firma', { status: 401 });
    }

    // Validación de firma HMAC
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
    const hmac = crypto.createHmac('sha256', secret);
    const digest = hmac.update(rawBody).digest('hex');

    if (digest !== hmacHeader) {
      console.error('❌ Firma HMAC inválida');
      return new NextResponse('Firma inválida', { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const eventName = body.meta?.event_name;
    const data = body.data?.attributes || {};

    console.log(`🔔 Lemon Squeezy Event: ${eventName}`);

    const userId = data.custom_data?.user_id || body.meta?.custom_data?.user_id;

    if (!userId) {
      console.error('❌ No se recibió user_id');
      return new NextResponse('Falta user_id', { status: 400 });
    }

    const subscriptionId = body.data?.id;
    const status = data.status || 'active';

    // Upsert (insert o update) más limpio y seguro
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        lemonsqueezy_sub_id: subscriptionId,
        status: status,
        price_id: data.first_subscription_item?.price_id?.toString() || data.variant_id?.toString(),
        current_period_start: data.created_at,
        current_period_end: data.renews_at || data.ends_at,
        updated_at: new Date().toISOString(),
      }, { 
        onConflict: 'user_id' 
      });

    if (error) {
      console.error('❌ Error al actualizar suscripción:', error.message);
      return new NextResponse('Error en base de datos', { status: 500 });
    }

    console.log(`✅ Suscripción ${status} procesada correctamente para usuario: ${userId}`);

    return NextResponse.json({ received: true, event: eventName }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}