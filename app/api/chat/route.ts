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
          .map((doc: any) => {
            const type = String(doc.metadata?.type || 'scripture').toUpperCase();
            const book = doc.metadata?.book || 'Scripture';
            const author = doc.metadata?.author ? ` | Author: ${doc.metadata.author}` : '';
            return `[Type: ${type} | Resource: ${book}${author}]\n${doc.content}`;
          })
          .join('\n\n---\n\n') || '';
      }
    } catch (embeddingErr) {
      console.error('⚠️ Embedding error:', embeddingErr);
    }

    // 4. 🔥 RESTAURACIÓN DEL SYSTEM PROMPT ORIGINAL DE ACERO INOXIDABLE
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

    const openaiMessages = messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => ({ role: m.role, content: m.content }));

    openaiMessages.unshift({ role: 'system', content: PATMOS_SYSTEM_PROMPT.trim() });

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