// app/api/chat/route.ts  (o la ruta que estés usando)

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    
    const { messages, contextText = "" } = await req.json(); 
    
    // ==================== DEBUG RAG ====================
    console.log("🔍 DEBUG RAG - Longitud del contexto recibido:", contextText.length);
    console.log("🔍 DEBUG RAG - Primeros 300 caracteres del contexto:", contextText.substring(0, 300));

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

    // ====================== STRICT SYSTEM PROMPT (NotebookLM style) ======================
    // Este es el prompt que hace que tu RAG se comporte exactamente como NotebookLM
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
      temperature: 0,           // ← Crucial: igual que NotebookLM
      max_tokens: 4096,
    });

    const aiResponse = response.choices[0].message.content;

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