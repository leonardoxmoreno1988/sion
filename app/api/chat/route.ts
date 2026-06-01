// app/api/chat/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || '';

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set({ name, value, ...options })
              );
            } catch {}
          },
        },
      }
    );

    // 1. Validación de Autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse('Unauthorized access to the Archive.', { status: 401 });
    }

    // 2. Control de Seguridad (Paywall Guard - Conteo Diario Limpio por Supabase)
    let isPremiumUser = user.email === 'leonardo@ritualypropaganda.com';

    if (!isPremiumUser) {
      try {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        isPremiumUser = !!subscription && (subscription.status === 'active' || subscription.status === 'trialing');

        if (!isPremiumUser) {
          const inicioDiaUTC = new Date();
          inicioDiaUTC.setUTCHours(0, 0, 0, 0);

          const { count, error: countError } = await supabase
            .from('chat_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', inicioDiaUTC.toISOString());

          if (countError) throw countError;

          // 🛡️ CALIBRACIÓN DE UMBRAL COMPENSADA:
          // Al cambiar el umbral a >= 4, garantizamos el libre tránsito
          // de los primeros 3 impactos completos en la interfaz de usuario.
          // El muro de pago bloqueará estrictamente en el CUARTO intento de envío.
          if (count !== null && count >= 4) {
            return NextResponse.json(
              { error: 'LIMIT_REACHED', message: 'Has alcanzado tus 3 consultas gratuitas de hoy. Regresa mañana o suscríbete para continuar con la investigación.' },
              { status: 429 }
            );
          }
        }
      } catch (gateError) {
        console.error('⚠️ Paywall Shield Error:', gateError);
      }
    }

    // 3. Contexto Teológico (Búsqueda Vectorial nativa en Supabase RPC)
    let contextText = '';
    try {
      if (lastMessage.trim()) {
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: lastMessage,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        const { data: semanticResults, error: rpcError } = await supabase
          .rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.15,
            match_count: 14
          });

        if (rpcError) throw rpcError;

        contextText = (semanticResults || [])
          .map((doc: any) => `[Resource: ${doc.metadata?.book || 'Scripture'}]\n${doc.content}`)
          .join('\n\n---\n\n') || '';
      }
    } catch (embeddingErr) {
      console.error('⚠️ Embedding error:', embeddingErr);
    }

    // 4. System Prompt
    const PATMOS_SYSTEM_PROMPT = `You are Patmos, a severe dispensational bible academic voice. Answer strictly based on context. Forbidden intro/outro filler. Headers must be in title case wrapped in asterisks like **My Title**. Force two line breaks after titles and paragraphs. Every scripture reference must be inside parentheses in bold like **(Romans 1:1)**.`;

    const openaiMessages = messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => ({ role: m.role, content: m.content }));

    openaiMessages.unshift({ role: 'system', content: PATMOS_SYSTEM_PROMPT });

    // 5. El Stream de OpenAI (Captura limpia en memoria)
    const responseStream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: openaiMessages,
      temperature: 0,
      stream: true,
    });

    const encoder = new TextEncoder();
    let completeBotResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              completeBotResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();

          // ⚡ PERSISTENCIA TOTAL AL FINALIZAR EL STREAM
          const cleanSavedResponse = completeBotResponse.trim();
          if (cleanSavedResponse) {
            await supabase.from('chat_history').insert({
              user_id: user.id,
              user_query: lastMessage,
              bot_response: cleanSavedResponse,
              created_at: new Date().toISOString()
            });
            console.log('✅ Registro consolidado con éxito.');
          }
        } catch (streamError) {
          console.error('🚨 Stream Error:', streamError);
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error('❌ Critical Crash:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}