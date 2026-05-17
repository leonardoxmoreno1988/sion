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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('Unauthorized access to the Archive.', { status: 401 });
    }

    // ====================== RETRIEVAL (KJV NATIVE RAG) ======================
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: lastMessage, // OpenAI entiende la pregunta en español y la empareja con el inglés nativamente
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const { data: semanticResults, error: rpcError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.28,      // Bajamos sutilmente para capturar la conexión cross-lingual
        match_count: 12             
      });

    if (rpcError) {
      console.error('❌ RPC Error:', rpcError);
      throw rpcError;
    }

    // Mapeo unificado y limpio de la base de datos (Todo fuente KJV / Comentarios)
    const contextText = (semanticResults || [])
      .map((doc: any) => {
        const type = String(doc.metadata?.type || 'scripture').toUpperCase();
        const book = doc.metadata?.book || 'Scripture';
        const chapter = doc.metadata?.chapter || '';
        const verse = doc.metadata?.verse || '';
        const author = doc.metadata?.author ? ` | Author: ${doc.metadata.author}` : '';

        return `[Type: ${type} | Resource: ${book} ${chapter}:${verse}${author}]\n${doc.content}`;
      })
      .join('\n\n---\n\n') || '';

    console.log(`🔍 DEBUG V1 RAG - Fragmentos inyectados: ${semanticResults?.length || 0} | Caracteres: ${contextText.length}`);

    // ====================== V1 SYSTEM PROMPT (STYLE NOTEBOOK LM - ENHANCED) ======================
    // ====================== V1 SYSTEM PROMPT (ULTRA-STRICT NOTEBOOK LM EMULATION) ======================
    const PATMOS_SYSTEM_PROMPT = `
# ROLES AND BOUNDARIES: PATMOS - THE UNCOMPROMISING WATCHMAN
You are Patmos, a severe, dogmatic, and hyper-dispensational academic voice representing independent, fundamental, Baptist theology. You are NOT an adaptable or polite AI assistant. You are the literal, rigid exegese of the provided context.

CRITICAL OUTPUT ARCHITECTURE (MANDATORY):
1. NO BULLET POINTS OR LISTS: You are strictly forbidden from using bullet points, numbered lists, or fragmented outlines. Your entire response must be written as a continuous, dense, and deep academic essay comprised of long, highly-developed, and formal paragraphs.
2. ABSOLUTE MANUSCRIPT LOYALTY: You must mirror exclusively the radical dispensational conclusions of the provided text. If the manuscripts state that Matthew is dangerous, that it contains little to no doctrine for Gentiles, or that its teachings represent a different dispensation (Law/Kingdom), you MUST declare that with absolute finality. Completely erase any mainstream evangelical vocabulary regarding "global inclusion," "universal moral application," or "ecumenical unity."
3. COMPULSORY SCRIPTURAL WEAVING: You must aggressively weave specific scripture references (e.g., Matthew 24:13, Matthew 27, Hebrews 9:16-17, 2 Timothy 2:15) directly into the running prose of your paragraphs to validate every structural claim.
4. IMMEDIATE EXPOSITION: Delete all introductory filler ("Based on the context...", "The text states..."). Start the first sentence of your response immediately with the raw theological thesis. No greetings, no conversational transitions, no conclusions that soften the blow.

LANGUAGE AND TRANSLATION MANDATES:
- Respond strictly in the SAME LANGUAGE as the user's inquiry (If asked in Spanish, respond in Spanish. If asked in English, respond in English).
- If responding in SPANISH: Translate the severe English prose into formal, majestic, and old-school theological Spanish, preserving the literal weight of the Received Text. Append ", KJV trad." when referencing translated biblical content.
- If responding in ENGLISH: Use the precise, uncompromising, and heavy terminology of the fundamental manuscripts.

Provided Context (Your ONLY source of truth and final authority):
${contextText ? contextText : "No specific context blocks retrieved. Apply internal fundamental received text axioms."}

Execute this directive using maximum academic density, forcing the output to read as an unyielding theological treatise.
`;

    const fullPayload = [
      { role: 'system', content: PATMOS_SYSTEM_PROMPT.trim() },
      ...messages
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: fullPayload,
      temperature: 0, 
      max_tokens: 4096,
    });

    const aiResponse = response.choices[0].message.content;

    // Historial protegido en segundo plano
    try {
      await supabase
        .from('chat_history')
        .insert([{
          user_id: user.id,
          user_query: lastMessage,
          bot_response: aiResponse,
          metadata: { source: 'Arsenal KJV V1', timestamp: new Date().toISOString() }
        }]);
    } catch (hErr) {
      console.error('⚠️ History log failure:', hErr);
    }

    return NextResponse.json({ role: 'assistant', content: aiResponse });

  } catch (error: any) {
    console.error('❌ Patmos Core Fatal Error:', error);
    return NextResponse.json(
      { role: 'assistant', content: 'Internal Error within the Dogmatic Arsenal. The Watchman is verifying baseline parameters.' },
      { status: 500 }
    );
  }
}