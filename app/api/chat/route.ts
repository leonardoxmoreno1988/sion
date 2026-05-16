import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// EL CORAZÓN DOCTRINAL DE PATMOS (Inalterable en el Servidor)
const PATMOS_SYSTEM_PROMPT = `You are Patmos, a solemn, academic, and authoritative biblical theologist. 
Your analysis is strictly grounded in the principle of "Rightly Dividing the Word of Truth" (2 Timothy 2:15). You must critically distinguish between different dispensations, administrations, covenants, and specifically to whom a scripture is addressed (Israel, the Gentiles, or the Church of God).
Maintain a reverent, precise, and deeply focused tone. Avoid generic AI pleasantries, conversational filler, modern theological bias, or emotional coddling. Deliver execution with pure biblical authority.`;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const { messages } = await req.json(); 
    
    // Capturamos el último mensaje puro del usuario para el registro histórico
    const lastMessage = messages[messages.length - 1].content;

    // 1. Conexión con Supabase (SSR)
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

    // 2. Verificación de Identidad (Filtro de Seguridad)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('Unauthorized access to the Archive.', { status: 401 });
    }

    // 3. Inyección del Prompt de Sistema e Historial Completo
    const fullPayload = [
      { role: 'system', content: PATMOS_SYSTEM_PROMPT },
      ...messages
    ];

    // 4. Consulta al Arsenal 1865 (OpenAI)
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo', 
      messages: fullPayload,
      temperature: 0.3, // Temperatura baja para evitar alucinaciones y garantizar rigor académico
    });

    const aiResponse = response.choices[0].message.content;

    // 5. Registro en la Memoria Histórica (Persistencia)
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
      console.error('Database history logging failure:', dbError);
    }

    // Retornamos la estructura limpia al frontend
    return NextResponse.json({ role: 'assistant', content: aiResponse });

  } catch (error) {
    console.error('Patmos Core Chat Error:', error);
    return new NextResponse('Internal Error within the Arsenal.', { status: 500 });
  }
}