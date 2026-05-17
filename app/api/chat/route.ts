// app/api/chat/route.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Forzamos a Next.js a tratar esta ruta como 100% dinámica para evitar fallos de build
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

    // ====================== RETRIEVAL (RAG SEMÁNTICO) ======================
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: lastMessage,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    const { data: semanticResults, error: rpcError } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.30,      // ← Umbral bajo para mayor cobertura conceptual
        match_count: 12             // ← Traemos más fragmentos para alimentar la síntesis
      });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      throw rpcError;
    }

    // Debug mejorado en la consola del servidor
    console.log("🔍 DEBUG RAG - Fragmentos recuperados:", semanticResults?.length || 0);
    if (semanticResults && semanticResults.length > 0) {
      console.log("🔍 DEBUG RAG - Top 3 similitudes vectoriales:");
      semanticResults.slice(0, 3).forEach((doc: any, i: number) => {
        const sourceName = doc.metadata?.source || doc.metadata?.version || 'Unknown';
        console.log(`   ${i+1}. Similarity: ${(doc.similarity * 100).toFixed(1)}% | Source: ${sourceName}`);
      });
    }

    // Construcción del bloque de contexto para el prompt
    const contextText = semanticResults
      ?.map((doc: any) => {
        const book = doc.metadata?.book || '';
        const chapter = doc.metadata?.chapter || '';
        const verse = doc.metadata?.verse || '';
        const sourceInfo = doc.metadata?.source 
          ? `Source: ${doc.metadata.source} (chunk ${doc.metadata.chunk_index ?? ''})`
          : `Source: ${book} ${chapter}:${verse}`.trim();
        
        return `${sourceInfo}\n\n${doc.content}`;
      })
      .join('\n\n---\n\n') || '';

    console.log("🔍 DEBUG RAG - Longitud total del contexto inyectado:", contextText.length);

    // ====================== REFINED SYSTEM PROMPT (Semantic NotebookLM Style) ======================
    const PATMOS_SYSTEM_PROMPT = `
# ROLE: PATMOS - THE WATCHMAN OF FINAL AUTHORITY
You are Patmos, a rigorous, defensive, and dogmatic academic authority in independent, fundamental, Baptist Theology. You specialize in the 'Received Text' tradition. Your absolute authority for Spanish is ONLY the Reina Valera 1865 (RV1865) and for English is the King James Version (KJV).

CORE OPERATIONAL MANDATE (SEMANTIC SYNTHESIS):
1. Your primary task is to act as an advanced semantic synthesizer. You must analyze all the theological data, verses, and commentary provided in the CONTEXT block below to formulate a comprehensive, high-level academic response to the user's inquiry.
2. You must strictly base your arguments, terms, and conclusions on the provided context. Do not invent modern theological views or use modern bible versions.
3. If the context contains multiple references or fragments, connect them masterfully using dispensational mechanics, cross-reference density, and strict literal exposition.
4. Do not offer friendly greetings or polite closings. Start immediately with the raw, structured theological analysis deduced from the source manuscripts.
5. Always preserve and explicitly quote the text and references (book, chapter, verse) exactly as they appear in the data.

Provided Context:
${contextText ? contextText : "Database baseline active. Analyze fundamental internal received text axioms."}

Structure your response with absolute theological precision, utilizing 100% of the semantic evidence found in the text above.
`;

    const fullPayload = [
      { role: 'system', content: PATMOS_SYSTEM_PROMPT.trim() },
      ...messages
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: fullPayload,
      temperature: 0, // Determinismo total estilo NotebookLM
      max_tokens: 4096,
    });

    const aiResponse = response.choices[0].message.content;

    // Guardado automático en el historial de chat de Supabase
    await supabase
      .from('chat_history')
      .insert([{
        user_id: user.id,
        user_query: lastMessage,
        bot_response: aiResponse,
        metadata: { source: 'Arsenal 1865', timestamp: new Date().toISOString() }
      }]);

    return NextResponse.json({ role: 'assistant', content: aiResponse });

  } catch (error: any) {
    console.error('Patmos Core Chat Error:', error);
    return new NextResponse('Internal Error within the Dogmatic Arsenal.', { status: 500 });
  }
}