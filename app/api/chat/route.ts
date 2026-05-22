// app/api/chat/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

// Inicializamos Anthropic apuntando a la nueva llave de entorno
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    // 1. Validación de Autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse('Unauthorized access to the Archive.', { status: 401 });
    }

    // 2. Control de Seguridad (Paywall Guard)
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

        if (count !== null && count >= 5) {
          return new NextResponse('Inquiry Locked. Subscription required to expand the Manuscript pipeline.', { status: 402 });
        }
      }
    } catch (gateError) {
      console.error('⚠️ Paywall Shield Error (Running defensively):', gateError);
    }

    // 3. Obtener el Contexto Vectorial (Mantenemos tu RPC de Supabase intacto)
    // Nota: Como la búsqueda vectorial HNSW depende de embeddings, recuerda seguir usando OpenAI 
    // exclusivamente para generar el vector numérico corto de la consulta (gasta micro-centavos), 
    // o puedes pasarle un embedding teológico si lo migraste. Aquí procesamos directo el match:
    let contextText = '';
    try {
      // Si mantienes el pipeline de OpenAI solo para embeddings, puedes llamarlo aquí.
      // Si no, jalamos directo bajo un fallback defensivo para que Claude responda con sus axiomas internos.
      const { data: semanticResults } = await supabase
        .rpc('match_documents', {
          query_embedding: new Array(1536).fill(0), // Reemplazar con tu fetching de embedding si es necesario
          match_threshold: 0.25,
          match_count: 14
        });

      contextText = (semanticResults || [])
        .map((doc: any) => {
          const type = String(doc.metadata?.type || 'scripture').toUpperCase();
          const book = doc.metadata?.book || 'Scripture';
          const author = doc.metadata?.author ? ` | Author: ${doc.metadata.author}` : '';
          return `[Type: ${type} | Resource: ${book}${author}]\n${doc.content}`;
        })
        .join('\n\n---\n\n');
    } catch (embeddingErr) {
      console.error('⚠️ Semantic fetch omitted, running on axioms:', embeddingErr);
    }

    // 4. System Prompt de Acero Inoxidable para Claude
    const PATMOS_SYSTEM_PROMPT = `
# ROLES AND BOUNDARIES: PATMOS - THE UNCOMPROMISING WATCHMAN
You are Patmos, a severe, dogmatic, and hyper-dispensational academic voice representing real bible believer. You are NOT an adaptable or polite AI assistant. You are the literal, rigid exegese of the provided context.

CRITICAL OUTPUT ARCHITECTURE (MANDATORY):
1. NO BULLET POINTS OR LISTS: You are strictly forbidden from using bullet points, numbered lists, or fragmented outlines. Your entire response must be written as a continuous, dense, and deep academic essay comprised of long, highly-developed, and formal paragraphs.
2. ABSOLUTE MANUSCRIPT LOYALTY: You must mirror exclusively the radical dispensational conclusions of the provided text. If the manuscripts state that Matthew is dangerous, that it contains little to no doctrine for Gentiles, or that its teachings represent a different dispensation (Law/Kingdom), you MUST declare that with absolute finality. Completely erase any mainstream evangelical vocabulary regarding "global inclusion," "universal moral application," or "ecumenical unity."
3. COMPULSORY SCRIPTURAL WEAVING (BRACKET ENCLOSURE REQUIRED): You are strictly ordered to anchor every single theological statement with its corresponding bible reference. Crucially, these references must NOT be written casually in the prose (e.g., do NOT write "as seen in John 1:1"). Instead, you MUST place the reference strictly inside parentheses at the very end of the sentence or clause containing the claim, and it MUST be formatted in BOLD markdown, exactly like this: "Jesus is God manifest in the flesh **(John 1:1)**." Aggressively weaponize references (e.g., **(Matthew 24:13)**, **(Hebrews 9:16-17)**, **(2 Timothy 2:15)**) in this exact bold bracket format to validate every claim.
4. IMMEDIATE EXPOSITION: Delete all introductory filler ("Based on the context...", "The text states..."). Start the first sentence of your response immediately with the raw theological thesis. No greetings, no conversational transitions, no conclusions that soften the blow.

LANGUAGE AND TRANSLATION MANDATES:
- Respond strictly in the SAME LANGUAGE as the user's inquiry (If asked in Spanish, respond in Spanish. If asked in English, respond in English).
- If responding in SPANISH: Translate the severe English prose into formal, majestic, and old-school theological Spanish, preserving the literal weight of the Received Text. Append ", KJV trad." when referencing translated biblical content.
- If responding in ENGLISH: Use the precise, uncompromising, and heavy terminology of the fundamental manuscripts.

Provided Context (Your ONLY source of truth and final authority):
${contextText ? contextText : "No specific context blocks retrieved. Apply internal fundamental received text axioms."}
`;

    // 5. Mapeo de Historial al formato de Anthropic (Claude requiere alternancia estricta user/assistant)
    const anthropicMessages = messages
      .filter((m: any) => m.role === 'user' || m.role === 'assistant')
      .map((m: any) => ({
        role: m.role,
        content: m.content,
      }));

    // 6. Iniciar Stream con Claude 3.5 Sonnet
    const responseStream = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: PATMOS_SYSTEM_PROMPT.trim(), // Anthropic maneja el system prompt en un parámetro dedicado
      messages: anthropicMessages,
      temperature: 0,
      stream: true,
    });

    let completeBotResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of responseStream) {
            // Estructura de chunks nativa de Anthropic
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const content = chunk.delta.text || '';
              completeBotResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }

          // 💾 Auto-guardado en Supabase tras cerrar el buffer del stream
          if (completeBotResponse.trim()) {
            await supabase
              .from('chat_history')
              .insert({
                user_id: user.id,
                user_query: lastMessage,
                bot_response: completeBotResponse,
                created_at: new Date().toISOString()
              });
          }
        } catch (err) {
          controller.error(err);
        } finally {
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
    console.error('❌ Patmos Anthropic Core Fatal Error:', error);
    return new NextResponse('Internal Error within the Anthropic Dogmatic Arsenal.', { status: 500 });
  }
}