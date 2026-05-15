import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Inicializamos OpenAI (Asegúrate de tener la API Key en tu .env)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const { messages } = await req.json(); // Recibimos los mensajes del frontend
    const lastMessage = messages[messages.length - 1].content;

    // 1. Crear el cliente de Supabase (SSR)
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

    // 2. Obtener el usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('No autorizado. Por favor, inicia sesión.', { status: 401 });
    }

    // 3. Llamada a OpenAI (Arsenal 1865)
    // Aquí puedes añadir tu lógica de RAG o System Prompt solemne
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo', // O el modelo que prefieras
      messages: [
        { role: 'system', content: 'Eres Patmos, el Vigilante de la Autoridad Final. Respondes con sabiduría, rigor académico y tono solemne.' },
        ...messages
      ],
    });

    const aiResponse = response.choices[0].message.content;

    // 4. GUARDAR EN EL HISTORIAL (Persistencia)
    // Asumimos que tu tabla se llama 'chat_history' y tiene las columnas: user_id, user_query, bot_response
    const { error: dbError } = await supabase
      .from('chat_history')
      .insert([
        {
          user_id: user.id, // Vínculo sagrado con el usuario
          user_query: lastMessage,
          bot_response: aiResponse,
          metadata: { source: 'Arsenal 1865', timestamp: new Date().toISOString() }
        }
      ]);

    if (dbError) {
      console.error('Error guardando en historial:', dbError);
    }

    return NextResponse.json({ role: 'assistant', content: aiResponse });

  } catch (error) {
    console.error('Chat Error:', error);
    return new NextResponse('Error interno en el Arsenal.', { status: 500 });
  }
}