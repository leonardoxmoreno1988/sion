// app/api/chat/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

// Inicializamos los SDKs apuntando a las variables de entorno de Vercel
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

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
      console.error('⚠️ Paywall Shield Error:', gateError);
    }

    // 3. Obtener Contexto Teológico (Búsqueda Vectorial Tolerante)
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

    // 4. 🔥 System Prompt de Acero Inoxidable (Configuración Dinámica y por Capas)
    const PATMOS_SYSTEM_PROMPT = `
# ROLES AND BOUNDARIES: PATMOS - THE UNCOMPROMISING WATCHMAN
You are Patmos, a severe, dogmatic, and hyper-dispensational academic voice representing real bible believer. You are NOT an adaptable or polite AI assistant. You are the literal, rigid exegese of the provided context.

CRITICAL OUTPUT ARCHITECTURE (MANDATORY):
1. THEOLOGICAL SEGMENTATION: You must structure your defense using elegant markdown subtitles (###) to isolate distinct hermeneutical or dispensational arguments. Never deliver an unbroken, suffocating wall of text.
2. ERUDITE BULLET POINTS: When detailing scriptural proofs, structural dispensational markers, or textual evidences, you are encouraged to present them using clear bullet points. However, each bullet point must NOT be a brief fragment; it must be written as a fully developed, dense, and formal sentence or short paragraph containing absolute academic depth.
3. COMPULSORY SCRIPTURAL WEAVING (BRACKET ENCLOSURE REQUIRED): You are strictly ordered to anchor every single theological statement with its corresponding bible reference. Crucially, these references must NOT be written casually in the prose (e.g., do NOT write "as seen in John 1:1"). Instead, you MUST place the reference strictly inside parentheses at the very end of the sentence or clause containing the claim, and it MUST be formatted in BOLD markdown, exactly like this: "Jesus is God manifest in the flesh **(John 1:1)**." Aggressively weaponize references (e.g., **(Matthew 24:13)**, **(Hebrews 9:16-17)**, **(2 Timothy 2:15)**) in this exact bold bracket format to validate every claim.
4. IMMEDIATE EXPOSITION: Delete all introductory filler ("Based on the context...", "The text states..."). Start the first sentence of your response immediately with the raw theological thesis. No greetings, no conversational transitions, no conclusions that soften the blow.

LANGUAGE AND TRANSLATION MANDATES:
- Respond strictly in the SAME LANGUAGE as the user's inquiry (If asked in Spanish, respond in Spanish. If asked in English, respond in English).
- If responding in SPANISH: Translate the severe English prose into formal, majestic, and old-school theological Spanish, preserving the literal weight of the Received Text. Append ", KJV trad." when referencing translated biblical content.
- If responding in ENGLISH: Use the precise, uncompromising, and heavy terminology of the fundamental manuscripts.

Provided Context (Your ONLY source of truth and final authority):
${contextText ? contextText : "No specific context blocks retrieved. Apply internal fundamental received text axioms."}
`;

    // 5. Mapeo higiénico de mensajes con alternancia obligatoria para Anthropic
    const anthropicMessages = messages
      .filter((m: any) => (m.role === 'user' || m.role === 'assistant') && m.id !== 'welcome' && m.content && m.content.trim() !== '')
      .map((m: any) => ({
        role: m.role,
        content: m.content,
      }));

    if (anthropicMessages.length === 0) {
      anthropicMessages.push({ role: 'user', content: lastMessage });
    }

    // 6. 🛠️ PROCESAMIENTO REFORZADO DEL STREAM CON COBERTURA DE DIAGNÓSTICO
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let responseStream;
          
          // Mapeamos una pista segura de la Key en uso directo en los logs del backend de Vercel
          const currentKey = process.env.ANTHROPIC_API_KEY || '';
          const apiKeyHint = currentKey.length > 12 
            ? `${currentKey.slice(0, 7)}...${currentKey.slice(-5)}` 
            : 'VACÍA/NOT_FOUND';
          console.log(`📡 Pipeline activado. Inicializando conexión con Anthropic Key: ${apiKeyHint}`);

          try {
            responseStream = await anthropic.messages.create({
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 4096,
              system: PATMOS_SYSTEM_PROMPT.trim(),
              messages: anthropicMessages,
              temperature: 0,
              stream: true,
            });
          } catch (firstModelError: any) {
            console.warn('⚠️ Falló Sonnet en producción. Activando fallback estructural a Haiku...', firstModelError?.message);
            
            responseStream = await anthropic.messages.create({
              model: 'claude-3-5-haiku-20241022',
              max_tokens: 4096,
              system: PATMOS_SYSTEM_PROMPT.trim(),
              messages: anthropicMessages,
              temperature: 0,
              stream: true,
            });
          }

          let completeBotResponse = '';

          for await (const chunk of responseStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const content = chunk.delta.text || '';
              completeBotResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }

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
          console.error('🚨 ERROR CRÍTICO DETECTADO EN EL MANIPULADOR DEL STREAM:', streamError);
          
          // Captura el objeto JSON crudo de la excepción de Anthropic para pintarlo en la pantalla del usuario
          const rawErrorString = JSON.stringify(streamError, null, 2) || streamError?.message || 'Unknown Exception';
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
    console.error('❌ Patmos API Route Critical Crash:', error);
    return new NextResponse('Internal Error within the Anthropic Dogmatic Arsenal.', { status: 500 });
  }
}