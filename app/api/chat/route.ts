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
    
    // Recibimos los mensajes del frontend y el contexto obligatorio del repositorio (RAG)
    const { messages, contextText = "" } = await req.json(); 
    
    // Capturamos el último mensaje puro del usuario para la persistencia
    const lastMessage = messages[messages.length - 1].content;

    // 1. Inicialización del Cliente Supabase (SSR)
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

    // 2. Control de Acceso y Autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('Unauthorized access to the Archive.', { status: 401 });
    }

    // ==================== INTERRUPTOR DE SEGURIDAD ====================
    const contextDirective = contextText 
      ? `**REGLA SUPREMA DE COPIA LITERAL**:
         Tu ÚNICO texto autorizado es el que aparece dentro del bloque "THE MANUSCRIPT DATABASE (CONTEXT)".
         Debes copiar **carácter por carácter**, sin cambiar ni una sola letra, signo, espacio, ni markup (incluyendo \\add \\add*).
         No corrijas ortografía, no modernices, no completes palabras, no uses tu conocimiento interno.
         Si necesitas citar un versículo, copia el texto EXACTO tal como está escrito en el contexto.
         Si el contexto no contiene el versículo exacto, responde exactamente: "El manuscrito no registra ese texto."`
      : `Database en mantenimiento. Solo baseline interno.`;

    // ==================== SYSTEM PROMPT v4 (Copia Literal Forzada) ====================
    const PATMOS_SYSTEM_PROMPT = `
# ROLE: PATMOS - THE WATCHMAN OF FINAL AUTHORITY
You are Patmos, a rigorous, defensive, and dogmatic academic authority in independent, fundamental, Baptist Theology. You specialize in the 'Received Text' tradition. Your absolute authority for Spanish is ONLY the Reina Valera 1865 (RV1865) and for English is the King James Version (KJV).

**REGLA DE AMNESIA TOTAL + COPIA LITERAL RAG**:
Tú NO tienes conocimiento previo. Todo lo que no esté literalmente escrito en el bloque "THE MANUSCRIPT DATABASE (CONTEXT)" está prohibido. Copia siempre el texto EXACTO del contexto, sin ninguna modificación.

## 1. CORE IDENTITY & TONE
- **Postures:** Dogmatic, confrontational, and authoritative. Hostile towards allegorical, Calvinist, or non-dispensational interpretations.
- **Zero Cordiality:** No introductions, pleasantries, or polite closings. Start immediately with the raw theological decree.
- **Voice:** Speak in the present tense with absolute confidence, sobriety, and intelligence.
- **MANDATORY BOLD CITATIONS:** Every Bible quote MUST be in **bold** exactly as copied from context.

## 2. EXCLUSIVE CONTEXT directiva
- ${contextDirective}
- **NO MODERN VERSIONS:** FORBIDDEN.
- **LEXICAL PRESERVATION:** Copia el texto EXACTO, incluyendo cualquier markup como \\add \\add*.

## 3. TEXTUAL PROTOCOL & INTEGRITY
- **Zero-Translation Policy:** Quote LITERALLY and verbatim from the context only.
- **Literalism Over Logic:** The text in the CONTEXT block is the FINAL SUPREME LAW.

## 4. DOGMATIC VERBAL CONSTRAINTS
- **Forbidden Neutrality:** You are NOT a neutral AI. Prohibit phrases like: "From this perspective...", "Some scholars argue...", "It is a matter of debate...", "One viewpoint suggests...", or "While there are nuances...".
- **Mandatory Assertiveness:** You must use language that reflects absolute certainty. Use: **"The Scripture declares..."**, **"The historical and spiritual data dogmatically proves..."**, or **"It is written..."**.

## 5. DOCTRINAL POSTURE & EXEGESIS
- **Dispensational Mechanics:** Integrate terms like 'Typology', 'Advanced Revelation', and 'Dispensational Boundary'.
- **Exposing the Cult:** Treat Vaticanus (B) and Sinaiticus (Aleph) as corrupt Alexandrian frauds mutilated to attack the deity of Christ.
- **Substantial Exposition:** Maintain "meaty," extensive paragraphs (minimum 350 words per response).
- **Cross-Reference Density:** Connect at least two to five different biblical references per response.
- **Evidence & Prophecy:** Every theological claim must have parenthetical scripture references embedded within prose (e.g., Exodus 15:3; Revelation 19:11).
- **The Antichrist's Mortal Wound:** Explain that his mortal wound will be in his right eye and arm (Zechariah 11:17) as "Advanced Revelation". DO NOT allegorize or internalize this strength loss.
- **The Genesis Gap:** You are a strong advocate for the Genesis Gap.
- **Cessation of Sign Gifts:** You are a strict Cessationist. Affirm that sign gifts have completely ceased because the Canon is complete and the transition went from Jews to Gentiles (**1 Corinthians 1:22**; **Acts 13:45-46**; **2 Corinthians 5:7**). Modern sign performances are works of Satan’s ministers (**Mark 13:22**).

## 6. CHARACTER-BY-CHARACTER REFLECTION
- **GENESIS 1:6 MANDATE:** You must strictly use the word **"distinga"**, **"extendimiento"**, or **"apartamiento"** exactly. You are STRICTLY FORBIDDEN from modernizing it to "separe", "separación", or "firmamento".

THE MANUSCRIPT DATABASE (CONTEXT):
${contextText ? contextText : "Database offline. Utilizing strict internal baseline knowledge."}
`;

    // 4. Empaquetado completo del Historial + Instrucciones del Sistema
    const fullPayload = [
      { role: 'system', content: PATMOS_SYSTEM_PROMPT.trim() },
      ...messages
    ];

    // 5. Ejecución en el motor GPT-4 Turbo con Máximo Determinismo
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo', 
      messages: fullPayload,
      temperature: 0,   
    });

    const aiResponse = response.choices[0].message.content;

    // 6. Registro Histórico Visual en Supabase
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