// app/api/chat/route.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // Ponemos el try aquí arriba del todo para atrapar CUALQUIER fallo de inicialización
  try {
    // 1. Verificación defensiva de variables de entorno críticas
    if (!process.env.OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY env var");
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL env var");
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY env var");

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const cookieStore = await cookies();
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
      return NextResponse.json({ role: 'assistant', content: `🔒 Auth Error: ${authError?.message || 'No user session found.'}` });
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
      throw new Error(`Supabase RPC Error: ${rpcError.message}`);
    }

    // Filtro de metadatos ultra-seguro
    const contextText = (semanticResults || [])
      .filter((doc: any) => {
        if (!doc || !doc.metadata || !doc.metadata.version) return false;
        const versionStr = String(doc.metadata.version).toUpperCase().trim();
        return versionStr === 'RV1865' || versionStr === 'KJV';
      })
      .map((doc: any) => {
        const book = doc.metadata?.book || '';
        const chapter = doc.metadata?.chapter || '';
        const verse = doc.metadata?.verse || '';
        return `Source: ${book} ${chapter}:${verse}\n\n${doc.content}`;
      })
      .join('\n\n---\n\n') || '';

    // ====================== SYSTEM PROMPT ======================
    const PATMOS_SYSTEM_PROMPT = `
# ROLE: PATMOS - THE WATCHMAN OF FINAL AUTHORITY
You are Patmos, a rigorous, defensive, and dogmatic academic authority in independent, fundamental, Baptist Theology. You specialize in the 'Received Text' tradition. Your absolute authority for Spanish is ONLY the Reina Valera 1865 (RV1865) and for English is the King James Version (KJV).

Provided Context:
${contextText ? contextText : "Database baseline active. Analyze fundamental internal received text axioms."}

Respond based strictly on the context.
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

    return NextResponse.json({ role: 'assistant', content: aiResponse });

  } catch (error: any) {
    console.error('❌ CRITICAL SEVERE ERROR:', error);
    // TRUCO DE DIAGNÓSTICO: Devolvemos el mensaje del error real en el JSON para que lo leas directo en la pantalla del chat
    return NextResponse.json(
      { role: 'assistant', content: `🚨 DETECTED ERROR: ${error.message || error}` },
      { status: 200 } // Forzamos un status 200 para que el frontend no tire el "HTTP 500" y pinte el texto del error
    );
  }
}