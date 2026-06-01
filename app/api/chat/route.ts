// app/api/chat/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

// Inicializamos el SDK de OpenAI apuntando a tus variables de entorno de Vercel
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || '';

    // 🏛️ CONFIGURACIÓN: Sistema de Supabase utilizando getAll y setAll
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set({ name, value, ...options })
              );
            } catch {
              // Evita que la ruta falle si es llamada desde un Server Component estático
            }
          },
        },
      }
    );

    // 1. Validación de Autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse('Unauthorized access to the Archive.', { status: 401 });
    }

    // 2. Control de Seguridad (Paywall Guard con reinicio automático diario UTC y pre-bloqueo)
    let isPremiumUser = false;

    // 🚀 COMPUERTA DE ADMINISTRADOR BLINDADA:
    if (user.email === 'leonardo@ritualypropaganda.com') {
      isPremiumUser = true;
    }

    // Variable para rastrear el ID del registro creado en el pre-bloqueo preventivo
    let preInsertedHistoryId: string | null = null;

    if (!isPremiumUser) {
      try {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        // Forzamos evaluación booleana estricta para evitar fugas de tipo null
        isPremiumUser = !!subscription && (subscription.status === 'active' || subscription.status === 'trialing');

        if (!isPremiumUser) {
          // ⏰ CÁLCULO ESTRICTO DE LA MEDIANOCHE UTC (Para el reinicio automático cada 24 horas)
          const inicioDiaUTC = new Date();
          inicioDiaUTC.setUTCHours(0, 0, 0, 0); // Forzamos las 00:00:00 del día actual en tiempo universal

          // Contamos ÚNICAMENTE las consultas hechas desde que empezó el día de hoy en formato UTC
          const { count, error: countError } = await supabase
            .from('chat_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', inicioDiaUTC.toISOString());

          if (countError) throw countError;

          // 🛡️ CALIBRACIÓN MATEMÁTICA DEFINITIVA (3 RESPUESTAS COMPLETAS):
          if (count !== null && count >= 3) {
            return NextResponse.json(
              { error: 'LIMIT_REACHED', message: 'Has alcanzado tus 3 consultas gratuitas de hoy. Regresa mañana o suscríbete para continuar con la investigación.' },
              { status: 429 }
            );
          }

          // 🛡️ PRE-BLOQUEO PREVENTIVO: Insertamos la fila ANTES de llamar a OpenAI
          const { data: insertedRow, error: insertError } = await supabase
            .from('chat_history')
            .insert({
              user_id: user.id,
              user_query: lastMessage,
              bot_response: '[Procesando consulta...]',
              created_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (insertError) throw insertError;
          if (insertedRow) {
            preInsertedHistoryId = insertedRow.id;
          }
        }
      } catch (gateError) {
        console.error('⚠️ Paywall Shield Error:', gateError);
      }
    }

    // 3. Obtener Contexto Teológico (Búsqueda Vectorial)
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
          .map((doc: any) => {
            const type = String(doc.metadata?.type || 'scripture').toUpperCase();
            const book = doc.metadata?.book || 'Scripture';
            const author = doc.metadata?.author ? ` | Author: ${doc.metadata.author}` : '';
            return `[Type: ${type} | Resource: ${book}${author}]\n${doc.content}`;
          })
          .join('\n\n---\n\n') || '';
      }
    } catch (embeddingErr) {
      console.error('⚠️ Semantic vector pipeline error, running on internal axioms:', embeddingErr);
      contextText = '';
    }

    // 4. System Prompt de Acero Inoxidable
    const PATMOS_SYSTEM_PROMPT = `
# ROLES AND BOUNDARIES: PATMOS - THE UNCOMPROMISING WATCHMAN
You are Patmos, a severe, dogmatic, and dispensational academic voice representing a real bible believer. You are NOT an adaptable, polite, or conversational AI assistant. You are the literal, rigid exegese of the provided context.

CRITICAL OUTPUT ARCHITECTURE (MANDATORY FORMATTING RULES):
1. IMMEDIATE EXPOSITION: Absolutely BAN all introductory filler, greetings, or welcome text at the very top. The very first character of your response must be your first custom theological title wrapped in bold markdown. No conversational transitions, no friendly conclusions, no summary paragraphs at the end.
2. THEOLOGICAL SEGMENTATION & NATIVE SPACING: You must break your exposition into clear arguments separated by custom theological titles. 
   - EVERY SINGLE TITLE MUST BE WRITTEN IN NORMAL TITLE CASE (NOT ALL CAPS) AND EXPLICITLY WRAPPED IN BOLD MARKDOWN SYMBOLS (e.g., "**La Arquitectura del Segundo Cielo**"). Do NOT use hashtags (###), HTML (<h3>), or uppercase formatting for headers.
   - FORCEFUL PARAGRAPH BREAKS: You MUST inject exactly two empty line breaks (\\n\\n) right after every bold title and between every single paragraph to force the pre-wrap container to render proper block spacing.
   - CRITICAL BLINDAGE: Do NOT append any empty line breaks, trailing spaces, or extra newlines after the final paragraph or closing citation of your whole response. End the token generation immediately on the final punctuation mark or bold bracket.
3. ERUDITE BULLET POINTS: When detailing scriptural proofs or textual evidences, use a standard dash (-) as the bullet marker. Each bullet point must be written as a fully developed, dense, and formal sentence or short paragraph containing absolute academic depth. Ensure you leave two empty line breaks (\\n\\n) after each bullet point.
4. COMPULSORY SCRIPTURAL WEAVING (THE BOLD BRACKET MANDATE): Anchor every single theological statement with its corresponding bible reference. Place the reference strictly inside parentheses at the very end of the sentence or clause containing the claim, and it MUST be formatted in BOLD markdown (using double asterisks).
   - CORRECT ENGLISH EXAMPLE: "...the cross is the final altar **(Hebrews 9:16-17)**."
   - CORRECT SPANISH EXAMPLE: "...Cristo es el cumplimiento absoluto del tipo desértico **(Juan 3:14-15)**."
   - NEVER use regular unbolded text like "(John 1:1)". Every single reference must be explicitly wrapped in double asterisks inside the parentheses.

LANGUAGE AND TRANSLATION MANDATES:
- If responding in SPANISH: You must perform a STRICT, LITERAL translation of the retrieved English King King James Text (KJV) into formal, majestic, and old-school theological Spanish, emulating the precise textual basis of the Reina Valera 1865 (Valera-Mora).
  * THE REINA VALERA 1865 MANDATE: You must completely bypass modern translations (such as RV1960 or NVI). Your Spanish vocabulary must align strictly with the Textus Receptus underlying the KJV. You are allowed minor textual variations only if they maintain 100% formal equivalence to the KJV text provided.
  * CRITICAL KJV OVERRIDE: If there is a textual or theological conflict between the strict rendering of the English KJV provided in the context and the historical printed text of the Reina Valera 1865 (e.g., specific translational choices or historical quirks like 'día de Domingo' in Revelation 1:10), the KJV context ALWAYS takes precedence. You must translate the KJV text literally into old-school Spanish, overriding the RV1865 print to maintain 100% doctrinal alignment with the KJV's literal dispensational meaning.
  * ABSOLUTELY BAN and FORBID any dynamic equivalence, modern paraphrasing, or conceptual interpretations (e.g., NEVER translate "seed of men" as "alianzas humanas").
  * You MUST preserve the exact raw vocabulary of the fundamental manuscripts and historical usage: "seed of men" MUST be translated strictly as "simiente de hombres". In Johannine Christology, "the Word" MUST be translated precisely as "el Verbo" following the strict rendering of the RV1865 (e.g., "y el Verbo era con Dios, y Dios era el Verbo"). Ensure terms like "Church" remain "iglesia" and archaic solemnity is maintained.
  * Ensure all scripture references remain clean inside the bold parentheses, containing only the book name, chapter, and verses without adding any version suffixes or extra text (e.g., **(Daniel 2:43)**).

Provided Context (Your ONLY source of truth and final authority):
${contextText ? contextText : "No specific context blocks retrieved. Apply internal fundamental received text axioms."}
`;

    // 5. Mapeo higiénico de mensajes compatible con la API de OpenAI
    const openaiMessages = messages
      .filter((m: any) => (m.role === 'user' || m.role === 'assistant' || m.role === 'system') && m.id !== 'welcome' && m.content && m.content.trim() !== '')
      .map((m: any) => ({
        role: m.role,
        content: m.content,
      }));

    openaiMessages.unshift({ role: 'system', content: PATMOS_SYSTEM_PROMPT.trim() });

    // 6. 🚀 PROCESAMIENTO DEL STREAM ESTABLE CON ACTUALIZACIÓN DE HISTORIAL DE FORMA SEGURA
    const encoder = new TextEncoder();

    // Variable mutable para capturar todo el texto generado a lo largo del stream
    let accumulatedText = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('📡 Pipeline activado con OpenAI GPT-4o. Transmisión limpia en progreso.');

          const responseStream = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: openaiMessages,
            temperature: 0,
            stream: true,
          });

          for await (const chunk of responseStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              accumulatedText += content;
              controller.enqueue(encoder.encode(content));
            }
          }

          controller.close();
        } catch (streamError: any) {
          console.error('🚨 ERROR EN EL MANIPULADOR DEL STREAM DE OPENAI:', streamError);
          const rawErrorString = JSON.stringify(streamError, null, 2) || streamError?.message || 'Unknown OpenAI Exception';
          const errorMessage = `\n\n*[Error del Motor]*\nStatus Code: ${streamError?.status}\nRaw Payload: ${rawErrorString}`;
          controller.enqueue(encoder.encode(errorMessage));
          controller.close();
        }
      },
    });

    // 🛡️ ENFOQUE DE PERSISTENCIA POR CALLBACK RESILIENTE
    // Creamos la respuesta HTTP chunked basada en el stream.
    const response = new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

    // Definimos la función de guardado asíncrona desacoplada del cierre del stream
    const consolidarHistorialBaseDeDatos = async () => {
      const cleanSavedResponse = accumulatedText.trim();
      if (!cleanSavedResponse) return;

      try {
        if (isPremiumUser || !preInsertedHistoryId) {
          await supabase
            .from('chat_history')
            .insert({
              user_id: user.id,
              user_query: lastMessage,
              bot_response: cleanSavedResponse,
              created_at: new Date().toISOString()
            });
        } else {
          await supabase
            .from('chat_history')
            .update({ bot_response: cleanSavedResponse })
            .eq('id', preInsertedHistoryId);
          console.log('✅ Base de datos sincronizada con éxito en segundo plano.');
        }
      } catch (err) {
        console.error('⚠️ Excepción crítica al guardar en Supabase en el ciclo de limpieza:', err);
      }
    };

    // ⚡ CONECTOR MÁGICO PARA SERVERLESS (waitUntil):
    // Si la plataforma (Vercel/Next.js) provee el método nativo para mantener vivo el hilo secundario
    // una vez despachado el stream lo usamos, de lo contrario lo mandamos al event loop.
    if (typeof (req as any).waitUntil === 'function') {
      (req as any).waitUntil(consolidarHistorialBaseDeDatos());
    } else {
      // Monitoreo manual alternativo para entornos de desarrollo local
      setTimeout(consolidarHistorialBaseDeDatos, 50);
    }

    return response;

  } catch (error: any) {
    console.error('❌ Patmos Research API Route Critical Crash (OpenAI Engine):', error);
    return new NextResponse('Internal Error within the OpenAI Dogmatic Engine.', { status: 500 });
  }
}