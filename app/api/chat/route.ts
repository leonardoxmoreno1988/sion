// app/api/chat/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    const supabase = createBrowserClient(
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

    // 1. Validación de Autenticación Básica
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse('Unauthorized access to the Archive.', { status: 401 });
    }

    // 2. 🛡️ CONTROL DE SEGURIDAD EN BACKEND (PAYWALL GUARD)
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

    // 3. Obtener Embedding de la consulta
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: lastMessage,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 4. Ejecutar búsqueda vectorial HNSW en el Arsenal Teológico
    const { data: semanticResults, error: rpcError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.25,
        match_count: 14
      });

    if (rpcError) throw rpcError;

    const contextText = (semanticResults || [])
      .map((doc: any) => {
        const type = String(doc.metadata?.type || 'scripture').toUpperCase();
        const book = doc.metadata?.book || 'Scripture';
        const author = doc.metadata?.author ? ` | Author: ${doc.metadata.author}` : '';
        return `[Type: ${type} | Resource: ${book}${author}]\n${doc.content}`;
      })
      .join('\n\n---\n\n') || '';

    // 5. System Prompt de Acero Inoxidable
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

    const fullPayload = [
      { role: 'system', content: PATMOS_SYSTEM_PROMPT.trim() },
      ...messages
    ];

    const responseStream = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: fullPayload,
      temperature: 0,
      max_tokens: 4096,
      stream: true,
    });

    // Variable para acumular la respuesta completa de la IA para persistencia en Supabase
    let completeBotResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of responseStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              completeBotResponse += content; // Acumula el texto del buffer en tiempo real
              controller.enqueue(encoder.encode(content));
            }
          }
          
          // 💾 AUTO-GUARDADO PERSISTENTE EN LA TABLA CHAT_HISTORY
          if (completeBotResponse.trim()) {
            const { error: insertError } = await supabase
              .from('chat_history')
              .insert({
                user_id: user.id,
                user_query: lastMessage,
                bot_response: completeBotResponse,
                created_at: new Date().toISOString()
              });
            
            if (insertError) {
              console.error('❌ Supabase Chat History Save Error:', insertError.message);
            }
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
    console.error('❌ Patmos Core Fatal Error:', error);
    return new NextResponse('Internal Error within the Dogmatic Arsenal.', { status: 500 });
  }
}