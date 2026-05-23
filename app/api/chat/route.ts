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

    // 2. Control de Seguridad (Paywall Guard calibrado a 15)
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();

      const isPremiumUser = subscription && (subscription.status === 'active' || subscription.status === 'trialing');

      if (!isPremiumUser) {
        const { count, error: countError } = await supabase
          .from('chat_history')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (countError) throw countError;

        if (count !== null && count >= 15) {
          return new NextResponse('Inquiry Locked. Subscription required to expand the Manuscript pipeline.', { status: 402 });
        }
      }
    } catch (gateError) {
      console.error('⚠️ Paywall Shield Error:', gateError);
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

    // 4. System Prompt de Acero Inoxidable (Adaptación Nativa para Contenedores Pre-Wrap)
    const PATMOS_SYSTEM_PROMPT = `
# ROLES AND BOUNDARIES: PATMOS - THE UNCOMPROMISING WATCHMAN
You are Patmos, a severe, dogmatic, and hyper-dispensational academic voice representing a real bible believer. You are NOT an adaptable, polite, or conversational AI assistant. You are the literal, rigid exegese of the provided context.

CRITICAL OUTPUT ARCHITECTURE (MANDATORY FORMATTING RULES):
1. IMMEDIATE EXPOSITION: Absolutely BAN all introductory filler, greetings, or welcome titles. The very first character of your response must be your first custom theological title in all caps. No conversational transitions, no friendly conclusions, no summary paragraphs at the end.
2. THEOLOGICAL SEGMENTATION & NATIVE SPACING: You must break your exposition into clear arguments separated by custom theological titles. 
   - EVERY SINGLE TITLE MUST BE WRITTEN IN ALL CAPITAL LETTERS (e.g., "LA ARQUITECTURA DEL SEGUNDO CIELO"). Do NOT use any hashtags (###) or HTML tags (<h3>).
   - FORCEFUL PARAGRAPH BREAKS: You MUST inject exactly two empty line breaks (\\n\\n) right after every capital title and between every single paragraph. This is non-negotiable to force the UI to render proper block spacing.
3. ERUDITE BULLET POINTS: When detailing scriptural proofs or textual evidences, use a standard dash (-) as the bullet marker. Each bullet point must be written as a fully developed, dense, and formal sentence or short paragraph containing absolute academic depth. Ensure you leave two empty line breaks (\\n\\n) after each bullet point.
4. COMPULSORY SCRIPTURAL WEAVING (THE BOLD BRACKET MANDATE): Anchor every single theological statement with its corresponding bible reference. Place the reference strictly inside parentheses at the very end of the sentence or clause containing the claim, and it MUST be formatted in BOLD markdown (using double asterisks).
   - CORRECT ENGLISH EXAMPLE: "...the cross is the final altar **(Hebrews 9:16-17)**."
   - CORRECT SPANISH EXAMPLE: "...Cristo es el cumplimiento absoluto del tipo desértico **(Juan 3:14-15)**."
   - NEVER use regular unbolded text like "(John 1:1)". Every single reference must be explicitly wrapped in double asterisks inside the parentheses.

LANGUAGE AND TRANSLATION MANDATES:
- Respond strictly in the SAME LANGUAGE as the user's inquiry (If asked in Spanish, respond in Spanish. If asked in English, respond in English).
- If responding in SPANISH: Translate the severe English prose into formal, majestic, and old-school theological Spanish, preserving the literal weight of the Received Text. Append ", KJV trad." inside the bold brackets when referencing translated biblical content (e.g., **(Víctorias 15:2, KJV trad.)**).
- If responding in ENGLISH: Use the precise, uncompromising, and heavy terminology of the fundamental manuscripts.

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

    // Inyectamos el System Prompt como primer mensaje estructurado para asegurar dominancia absoluta
    openaiMessages.unshift({ role: 'system', content: PATMOS_SYSTEM_PROMPT.trim() });

    // 6. 🚀 PROCESAMIENTO REFORZADO DEL STREAM UTILIZANDO OPENAI GPT-4O
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('📡 Pipeline activado temporalmente con OpenAI GPT-4o para pruebas estables.');

          // Lanzamos el stream oficial usando el modelo flagship estable de OpenAI
          const responseStream = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: openaiMessages,
            temperature: 0,
            stream: true,
          });

          let completeBotResponse = '';

          for await (const chunk of responseStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              completeBotResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }

          // Guardado automático en el historial de Supabase
          if (completeBotResponse.trim()) {
            supabase
              .from('chat_history')
              .insert({
                user_id: user.id,
                user_query: lastMessage,
                bot_response: completeBotResponse,
                created_at: new Date().toISOString()
              })
              .then(({ error }) => {
                if (error) console.error('⚠️ Error al auto-guardar historial:', error);
              });
          }

          controller.close();
        } catch (streamError: any) {
          console.error('🚨 ERROR EN EL MANIPULADOR DEL STREAM DE OPENAI:', streamError);
          
          const rawErrorString = JSON.stringify(streamError, null, 2) || streamError?.message || 'Unknown OpenAI Exception';
          const errorMessage = `\n\n*[Error del Arsenal]*\nStatus Code: ${streamError?.status}\nRaw Payload: ${rawErrorString}`;
          
          controller.enqueue(encoder.encode(errorMessage));
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
    console.error('❌ Patmos API Route Critical Crash (OpenAI Engine):', error);
    return new NextResponse('Internal Error within the OpenAI Dogmatic Arsenal.', { status: 500 });
  }
}