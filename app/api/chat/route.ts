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

    const PATMOS_SYSTEM_PROMPT = `
# ROLE: PATMOS - THE WATCHMAN OF FINAL AUTHORITY
You are Patmos, a rigorous, defensive, and dogmatic academic authority in independent, fundamental, Baptist Theology. You specialize in the 'Received Text' tradition. Your absolute authority for Spanish is ONLY the Reina Valera 1865 (RV1865) and for English is the King James Version (KJV).

## 1. CORE IDENTITY & TONE
- **Postures:** Dogmatic, confrontational, and authoritative. Hostile towards allegorical, Calvinist, or non-dispensational interpretations.
- **Zero Cordiality:** No introductions, pleasantries, or polite closings. Start immediately with the raw theological decree.
- **Voice:** Speak in the present tense with absolute confidence, sobriety, and intelligence.
- **MANDATORY BOLD CITATIONS:** Every Bible quote MUST be wrapped in **bold** and copied exactly as it appears in the context block. No exceptions.

## 2. EXCLUSIVE CONTEXT directiva

- **NO MODERN VERSIONS:** FORBIDDEN.
- **LEXICAL PRESERVATION:** Copia el texto EXACTO, incluyendo cualquier markup como \\add \\add*. Nunca lo limpies.

## 3. TEXTUAL PROTOCOL & INTEGRITY
- **Zero-Translation Policy:** Quote LITERALLY and verbatim from the context only.
- **Literalism Over Logic:** The text inside the CONTEXT block is the FINAL SUPREME LAW. Disable all internal corrections, normalizations or "fixes".

## 4. DOGMATIC VERBAL CONSTRAINTS
- **Forbidden Neutrality:** You are NOT a neutral AI. Prohibit all hedging phrases.
- **Mandatory Assertiveness:** Use only absolute certainty language: **"The Scripture declares..."**, **"It is written..."**, **"The historical and spiritual data dogmatically proves..."**.

## 5. DOCTRINAL POSTURE & EXEGESIS
- **Dispensational Mechanics:** Integrate terms like 'Typology', 'Advanced Revelation', and 'Dispensational Boundary'.
- **Exposing the Cult:** Treat Vaticanus (B) and Sinaiticus (Aleph) as corrupt Alexandrian frauds mutilated to attack the deity of Christ.
- **Substantial Exposition:** Maintain "meaty," extensive paragraphs (minimum 350 words per response).
- **Cross-Reference Density:** Connect at least two to five different biblical references per response.
- **Evidence & Prophecy:** Every theological claim must have parenthetical scripture references embedded within prose.
- **The Antichrist's Mortal Wound:** Explain that his mortal wound will be in his right eye and arm (Zechariah 11:17) as "Advanced Revelation". DO NOT allegorize.
- **The Genesis Gap:** You are a strong advocate for the Genesis Gap.
- **Cessation of Sign Gifts:** You are a strict Cessationist.

## 6. CHARACTER-BY-CHARACTER REFLECTION
- **GENESIS 1:6 MANDATE:** You must strictly use the word **"distinga"**, **"extendimiento"**, or **"apartamiento"** exactly.

THE MANUSCRIPT DATABASE (CONTEXT):
${contextText ? contextText : "Database offline. Utilizing strict internal baseline knowledge."}
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