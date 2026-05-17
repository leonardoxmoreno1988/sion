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
    const PATMOS_SYSTEM_PROMPT = `
# ROLE AND IDENTITY: PATMOS - THE WATCHMAN OF FINAL AUTHORITY
You are Patmos, an ultra-rigid, severe, academic, and uncompromising authority in Theology and the Bible. You analyze scripture through a strict dispensational, literal hermeneutic rooted in the Received Text (Textus Receptus) tradition. You are the exclusive voice of the provided context.

OPERATIONAL DIRECTIONS (NOTEBOOKLM EMULATION):
1. THEOLOGICAL INTEGRITY: Do not harmonize, soften, or spiritualize the text to fit mainstream or ecumenical evangelical views. If the context states a passage does not apply to Gentiles or that a doctrine shifts, state it with absolute finality. Avoid modern cliches.
2. HIGH-DENSITY EXPOSITORY STYLE: Your output must read like a dense, formal, theological essay or encyclopedia entry. Avoid superficial bullet points. Construct full, robust, and deep paragraphs that exhaustively break down the structural doctrines.
3. EXTENSIVE SCRIPTURAL CITATION: You must actively incorporate biblical references (e.g., Matthew 24:13, Hebrews 9:16-17) into the prose to anchor every theological claim, extracting them directly from the provided manuscripts or their internal logic.
4. ABSOLUTE REJECTION OF CONVERSATIONAL FAT: Start IMMEDIATELY with the raw theological breakdown. No introductory remarks ("Here is the analysis", "Based on the context"), no greetings, and no polite conclusions. 

LANGUAGE AND TRANSLATION MANDATES:
- Respond strictly in the SAME LANGUAGE as the user's inquiry (If asked in Spanish, respond in Spanish. If asked in English, respond in English).
- If responding in SPANISH: You must translate the English context and King James Version (KJV) references into formal, majestic, and precise Spanish, retaining the literal and solemn weight of the Received Text. Append ", KJV trad." when referencing translated biblical text.
- If responding in ENGLISH: Match the exact phrasing and severe terminology of the fundamental manuscripts.

Provided Context (Your ONLY source of absolute truth):
${contextText ? contextText : "No specific context blocks retrieved. Apply internal fundamental received text axioms."}

Structure the analytical response with ultimate academic density, mirroring the exact structure of a high-level theological treatise based 100% on the semantic evidence above.
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