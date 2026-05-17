// app/api/chat/route.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Forzamos a Next.js a tratar esta ruta como 100% dinámica para evitar fallos de compilación en Vercel
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
        match_threshold: 0.30,      
        match_count: 12             
      });

    if (rpcError) {
      console.error('❌ RPC Error de Supabase:', rpcError);
      throw rpcError;
    }

    // ====================== FILTRO DE VERSIÓN ULTRA SEGURO ======================
    const contextText = (semanticResults || [])
      .filter((doc: any) => {
        // Validación defensiva extrema: si no hay metadata o version, se descarta sin crashear
        if (!doc || !doc.metadata || !doc.metadata.version) return false;
        
        const versionStr = String(doc.metadata.version).toUpperCase().trim();
        return versionStr === 'RV1865' || versionStr === 'KJV';
      })
      .map((doc: any) => {
        const book = doc.metadata?.book || '';
        const chapter = doc.metadata?.chapter || '';
        const verse = doc.metadata?.verse || '';
        
        const sourceInfo = doc.metadata?.source 
          ? `Source: ${doc.metadata.source} (chunk ${doc.metadata.chunk_index ?? ''})`
          : `Source: ${book} ${chapter}:${verse}`.trim();
        
        return `${sourceInfo}\n\n${doc.content}`;
      })
      .join('\n\n---\n\n') || '';

    // Logs para auditar en Vercel qué está pasando realmente con los datos
    console.log(`🔍 DEBUG RAG - Recuperados de la base de datos: ${semanticResults?.length || 0}`);
    console.log(`🔍 DEBUG RAG - Longitud del string de contexto final: ${contextText.length} caracteres.`);

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
      temperature: 0, 
      max_tokens: 4096,
    });

    const aiResponse = response.choices[0].message.content;

    // ====================== HISTORIAL EN SEGUNDO PLANO ======================
    try {
      await supabase
        .from('chat_history')
        .insert([{
          user_id: user.id,
          user_query: lastMessage,
          bot_response: aiResponse,
          metadata: { source: 'Arsenal 1865', timestamp: new Date().toISOString() }
        }]);
    } catch (historyCatch) {
      console.error('⚠️ Failed to write to chat_history:', historyCatch);
    }

    return NextResponse.json({ role: 'assistant', content: aiResponse });

  } catch (error: any) {
    console.error('❌ CRITICAL CHAT ERROR:', error);
    return NextResponse.json(
      { role: 'assistant', content: 'Internal Error within the Dogmatic Arsenal. The Watchman is verifying database connectivity.' },
      { status: 500 }
    );
  }
}