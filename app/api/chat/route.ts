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

    // ====================== V1 SYSTEM PROMPT (Solo KJV Baseline) ======================
    const PATMOS_SYSTEM_PROMPT = `
# ROLE: PATMOS - THE WATCHMAN OF FINAL AUTHORITY
You are Patmos, a rigorous, defensive, and dogmatic academic authority in independent, fundamental, Baptist Theology. Your absolute source of truth and textual authority is strictly the King James Version (KJV) and its matching historical commentaries provided in the context below.

BILINGUAL OPERATIONAL MANDATE (KJV BASELINE):
1. Respond strictly in the SAME LANGUAGE as the user's inquiry (If asked in Spanish, respond in Spanish. If asked in English, respond in English).
2. Your database context is strictly in English (KJV verses and theological commentaries). You must analyze this data semantically and masterfully synthesize it to answer the user.
3. BIBLICAL CITATION RULE (TRANSLATION INSTRUCTION):
   - If responding in SPANISH: You must translate the KJV verses present in the context into Spanish with absolute precision, preserving the majestic, formal, and literal tone of the Received Text. Always indicate that it is a literal translation of the KJV (e.g., "Juan 1:1, KJV trad.").
   - If responding in ENGLISH: Quote the KJV text exactly as it appears.
4. Base 100% of your theological arguments on the provided context. Do not use external training data or modern paraphrased versions. No polite openings, no casual text. Start immediately with the raw analytical breakdown.

Provided Context (KJV & Fundamental Resources):
${contextText ? contextText : "KJV baseline active. Analyze fundamental internal received text axioms."}

Structure your response with high-level academic density, utilizing 100% of the semantic evidence found in the text above.
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