import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Forzamos la ejecución dinámica para evitar fallos de compilación por falta de claves en el build
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
    // 1. Generamos el embedding de la consulta usando el modelo de 1536 dimensiones
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: lastMessage,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. Búsqueda semántica usando tu nueva función RPC en Postgres
    const { data: semanticResults, error: rpcError } = await supabase
      .rpc('match_documents', { 
        query_embedding: queryEmbedding,
        match_threshold: 0.35, 
        match_count: 8 
      });

    if (rpcError) {
      console.error("❌ Error en la ejecución de la función RPC:", rpcError.message);
    }

    // 3. Mapeamos y estructuramos el contexto leyendo 'content' y 'metadata'
    // Filtramos para asegurar que Patmos herede contexto veraz de tus versiones de autoridad
    const contextText = semanticResults
      ?.filter((doc: any) => doc.metadata?.version === 'RV1865' || doc.metadata?.version === 'KJV')
      .map((doc: any) => {
        const book = doc.metadata?.book || 'Scripture';
        const chapter = doc.metadata?.chapter || '';
        const verse = doc.metadata?.verse || '';
        return `Referencia: ${book} ${chapter}:${verse}\nTexto: ${doc.content}`;
      })
      .join('\n\n---\n\n') || '';

    console.log("🔍 DEBUG RAG - Fragmentos inyectados al prompt:", semanticResults?.length || 0);

    // ====================== STRICT SYSTEM PROMPT (NotebookLM style) ======================
    const PATMOS_SYSTEM_PROMPT = `
# ROLE: PATMOS - THE WATCHMAN OF FINAL AUTHORITY
You are Patmos, a rigorous, defensive, and dogmatic academic authority in independent, fundamental, Baptist Theology. You specialize in the 'Received Text' tradition. Your absolute authority for Spanish is ONLY the Reina Valera 1865 (RV1865) and for English is the King James Version (KJV).

STRICT GROUNDING RULES (YOU MUST NEVER BREAK THESE):

1. Respond ONLY with information that appears literally in the provided context below.
2. NEVER use your prior knowledge, training data, general information, or personal interpretations under any circumstance.
3. If the question cannot be fully answered from the context, respond EXACTLY with this phrase and nothing else:
   "I do not have sufficient information in the provided context to answer this question."
4. Do not add explanations, apologies, phrases like "according to my knowledge", "in my opinion", or anything not present in the context.
5. When citing verses, always indicate the exact reference (book, chapter, verse) exactly as it appears in the context.

Provided Context:
${contextText}

You must remain 100% grounded in the context above for the entire conversation.
`;

    const fullPayload = [
      { role: 'system', content: PATMOS_SYSTEM_PROMPT.trim() },
      ...messages
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: fullPayload,
      temperature: 0, // Determinismo absoluto
      max_tokens: 4096,
    });

    const aiResponse = response.choices[0].message.content;

    // Guardar historial en la base de datos
    const { error: dbError } = await supabase
      .from('chat_history')
      .insert([
        {
          user_id: user.id,
          user_query: lastMessage,
          bot_response: aiResponse,
          metadata: { source: 'Arsenal 1865', timestamp: new Date().toISOString() }
        }
      ]);

    if (dbError) {
      console.error('Database log failure:', dbError);
    }

    return NextResponse.json({ role: 'assistant', content: aiResponse });

  } catch (error: any) {
    console.error('Patmos Core Chat Error:', error);
    return new NextResponse('Internal Error within the Dogmatic Arsenal.', { status: 500 });
  }
}