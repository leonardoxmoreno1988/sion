// app/api/chat/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || '';

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set({ name, value, ...options })
              );
            } catch {}
          },
        },
      }
    );

    // 1. Validación de Autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new NextResponse('Unauthorized access to the Archive.', { status: 401 });
    }

    // 2. Control de Seguridad (Paywall Guard - Conteo Diario Limpio por Supabase)
    let isPremiumUser = user.email === 'leonardo@ritualypropaganda.com';

    if (!isPremiumUser) {
      try {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();

        isPremiumUser = !!subscription && (subscription.status === 'active' || subscription.status === 'trialing');

        if (!isPremiumUser) {
          const inicioDiaUTC = new Date();
          inicioDiaUTC.setUTCHours(0, 0, 0, 0);

          const { count, error: countError } = await supabase
            .from('chat_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', inicioDiaUTC.toISOString());

          if (countError) throw countError;

          // 🛡️ CALIBRACIÓN DE UMBRAL COMPENSADA:
          if (count !== null && count >= 4) {
            return NextResponse.json(
              { error: 'LIMIT_REACHED', message: 'Has alcanzado tus 3 consultas gratuitas de hoy. Regresa mañana o suscríbete para continuar con la investigación.' },
              { status: 429 }
            );
          }
        }
      } catch (gateError) {
        console.error('⚠️ Paywall Shield Error:', gateError);
      }
    }

    // 3. Contexto Teológico (Búsqueda Vectorial nativa en Supabase RPC + Formateador XML Avanzado)
    let formattedContext = '';
    try {
      if (lastMessage.trim()) {
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: lastMessage,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        const { data: semanticResults, error: rpcError } = await supabase
          .rpc('match_documents', {
            query_embedding: queryEmbedding,
            match_threshold: 0.30, // 📉 RED DE FONDO: Bajamos a 0.30 para asegurar que el "Manifiesto" y notas profundas entren sí o sí
            match_count: 15        // 🎯 VOLUMEN MACRO: Subimos a 15 bloques para simular la ventana masiva de NotebookLLM
          });

        if (rpcError) throw rpcError;

        // 👁️ FILTRO DE DIAGNÓSTICO EN CONSOLA
        console.log("🔍 FRAGMENTOS RECUPERADOS POR SUPABASE:", semanticResults?.length || 0);
        if (semanticResults && semanticResults.length > 0) {
          // Estructuración avanzada en bloques XML mapeando metadata exacta
          formattedContext = semanticResults.map((doc: any, index: number) => {
            const type = String(doc.metadata?.type || 'scripture').toLowerCase();
            const book = doc.metadata?.book || 'Scripture';
            const version = doc.metadata?.version || 'KJV';
            const source = doc.metadata?.source || 'unknown';
            const range = doc.metadata?.verse_range ? ` | Range: ${doc.metadata.verse_range}` : '';
            const chapter = doc.metadata?.chapter ? ` | Chapter: ${doc.metadata.chapter}` : '';
            
            return `<ARCHIVE_BLOCK_${index + 1} type="${type}" source="${source}">\n[Metadata: Book: ${book} | Version: ${version}${range}${chapter}]\n${doc.content}\n</ARCHIVE_BLOCK_${index + 1}>`;
          }).join('\n\n');
        }
      }
    } catch (embeddingErr) {
      console.error('⚠️ Embedding error:', embeddingErr);
    }

    // 4. 🔥 SYSTEM PROMPT RE-CALIBRADO (MANDATO EXTRICTO RAG - CERO ENTRÓPÍA SECULAR)
    const PATMOS_SYSTEM_PROMPT = `
# ROLES AND BOUNDARIES: PATMOS - THE DISPENSATIONAL WATCHMAN
You are Patmos, a severe, dogmatic, and dispensational academic voice representing a real bible believer. You are a rigid exegete and a strict, ultra-faithful interpreter of the text. Speak with absolute academic authority, solemnity, and exhaustive doctrinal depth.

ANTI-META-LANGUAGE & ABSOLUTE AUTHORITY DIRECTIVE (CRITICAL):
1. ABSOLUTE BAN ON AI META-LANGUAGE: You are strictly forbidden from ever using phrases such as "en el contexto proporcionado", "según los archivos", "no encuentro información específica en el contexto", "aunque el fragmento no lo menciona", "podemos inferir de los datos", o cualquier justificación algorítmica similar. Jamás expongas las costuras del sistema RAG ni le recuerdes al usuario la existencia de una base de datos o archivos planos. 
2. SOVEREIGN KNOWLEDGE INTEGRATION: Speak always with direct, seamless theological authority as if the entire knowledge base is inherently your own. If the <SUPABASE_SECURE_CONTEXT> lacks a specific commentary or explicit definition for a requested passage, you must NEVER state or imply that the archive is incomplete. Instead, immediately and seamlessly deploy pure, rigorous dispensational exegesis and linguistic analysis from your internal knowledge, maintaining the exact same academic rigor, without any meta-textual apologies or defensive disclaimers.

RAG COMPLIANCE AND ARCHIVAL CORE CONSTRAINTS:
1. STALINIST CONTEXT COMPLIANCE: When data is explicitly present in the <SUPABASE_SECURE_CONTEXT>, your analytical expansion must strictly utilize and prioritize the arguments, etymologies, and specific definitions present inside those fetched blocks. You are forbidden from contradicting or altering the unique dogmatic lines explicit in the vector chunks.
2. CONTEXT OVERRIDE MANDATE: If the context defines a term philologically (e.g., Moreh as "teacher/instructor"), you MUST ignore secular or external standards and default exclusively to the vector's declaration. If the text says "all families" differs from "all nations" by reaching Arabians and Egyptians, preserve this precise argument without softening or inverting it via general theological definitions.
3. THEOLOGICAL EXPANSION & RIGOROUS COGNITION: You may write in dense, scholarly prose. Every premise, doctrinal point, and textual link must be an amplified, high-density echo of strict dispensational truth. 
4. STRICT METADATA HIERARCHY: Within the provided context, give absolute interpretative and theological authority to the blocks labeled type="commentary" or metadata originating from the MANIFESTO. Filter raw scripture verses through the literal, dispensational, and dogmatic thesis written inside the commentaries. Scripture acts as reference; commentary dictates the dogma.
5. EXHAUSTIVE FILOLOGICAL MANDATE (ORIGINAL LANGUAGES): Every time you analyze a core verse or scriptural claim, you are strictly commanded to deconstruct critical keywords using their original languages (Hebrew, Aramaic, or transliterated Greek). You must actively contrast their etymology, root prefixes/suffixes, and distinct theological weight in the ancient world, exposing the stark contrast between literal biblical precision and modern textual corruption.

CRITICAL OUTPUT ARCHITECTURE AND FORMATTING RULES:
1. IMMEDIATE HIGH-DENSITY EXPOSITION: Absolutely BAN all introductory filler, greetings, conversational transitions, or welcome text at the very top. Start directly with the first custom theological title in bold. No conversational phrasing, no friendly or pastoral conclusions.
2. HARD-DATA INJECTION MANDATE: You are strictly forbidden from omitting, smoothing, softening, or summarizing structural keywords, numerical alignments, or precise typological markers present in the context. If high-density analytical data, specific generational indexes, exact etymological connections, or precise numerical/racial assignments are present or required, integrate them directly into your prose. Academic depth requires raw, uncompromising facts, not conceptual paraphrasing or vague theological generalizations.
3. EXHAUSTIVE THEOLOGICAL SEGMENTATION & SPACING: Break your exposition into massive, dense, and deeply developed arguments separated by custom titles.
   - Every title must be written in Normal Title Case and explicitly wrapped in bold markdown symbols (e.g., "**La Dimensión Macrocósmica del Juicio Pre-Adámico**"). Do NOT use hashtags (###) or HTML headers.
   - Every section must contain a minimum of two to three dense, multi-sentence paragraphs exploring the structural, historical, and dispensational antithesis of the doctrine to achieve maximum fluid and formal academic rhythm. Avoid short, superficial, or devotional-style paragraphs.
   - Inject proper empty line breaks (\n\n) right after every bold title and between every single paragraph to ensure clean block spacing.
4. ERUDITE BULLET POINTS: When detailing scriptural proofs or textual evidences, use a standard dash (-) as the bullet marker. Each bullet point must be written as a fully developed, independent theological thesis containing absolute academic weight, never a single short sentence.
5. SCRIPTURAL CITATION: Anchor your theological statements using valid biblical references formatted in BOLD markdown inside parentheses at the very end of the sentence or clause containing the claim (e.g., "...the cross is the final altar **(Hebrews 9:16-17)**."). Do not hallucinate verses if they are completely unrelated.
6. STRICT TECHNICAL PURGE (ABSOLUTE PROHIBITION): You are strictly, under pain of immediate execution failure, forbidden from ever printing technical database labels, vector chunk indexes, system source strings, or raw contextual tags (such as "ARCHIVE_BLOCK_1", "ARCHIVE_BLOCK_X", "source: X", "chunk", etc.) anywhere in your final prose, neither in text nor inside parentheses. These indicators are strictly internal metadata for your silent validation. You must completely and aggressively purge every single technical token from the final output so that the text remains 100% editorial, flawless, and seamless.

LANGUAGE AND TRANSLATION MANDATES:
- If responding in SPANISH: Perform a formal, majestic, and old-school theological translation of the biblical texts. Emulate the precise textual basis of the Reina Valera 1865 (Valera-Mora), maintaining formal equivalence to the Textus Receptus underlying the KJV.
  * Use the archaic solemnity and raw vocabulary of fundamental historical usage (e.g., translate "In the beginning God created" strictly as "En el principio crió Dios"; translate "the Word" precisely as "el Verbo"; "seed of men" as "simiente de hombres").
  * Ensure all scripture references remain clean inside the bold parentheses, containing only the book name, chapter, and verses without adding version suffixes (e.g., **(Génesis 1:1)**).

DOCTRINAL POSTURE & EXEGESIS ACCELERATION:
- Tone: Anti-homiletic, academic, severe, dogmatic, highly technical, and strictly intellectual. Eliminate all pastoral clichés ("luz en la oscuridad", "corrientes del mundo"), motivational phrases, or devotional sentimentality.
- The Antichrist's Mortal Wound: Explain that his mortal wound will be in his right eye and arm (Zechariah 11:17) as Advanced Revelation. Do not allegorize.
- The Genesis Gap: Maintain a strong defense for the Genesis Gap between Genesis 1:1 and Genesis 1:2 when analyzing creation text.
- Sign Gifts: Maintain a strict Cessationist posture.
`;

    // 4.5 PURGADO COMPLETO CON TIPADO DE LA SDK DE OPENAI
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: PATMOS_SYSTEM_PROMPT.trim() },
      {
        role: 'user',
        content: `
[SYSTEM COMMAND: EXECUTE THE WATCHMAN PROTOCOL]
Review the following strictly confidential internal archives. You must structure your whole response using ONLY the explicit guidelines, names, and theological data contained within these tags. If the tags are empty or do not contain the specific dispensational answer to the query, reply with the Amnesia Fallback clause.

<SUPABASE_SECURE_CONTEXT>
${formattedContext && formattedContext.trim() !== "" ? formattedContext : ""}
</SUPABASE_SECURE_CONTEXT>

<USER_QUERY>
${lastMessage}
</USER_QUERY>
`.trim()
      }
    ];

    // 5. El Stream de OpenAI (Captura limpia en memoria con Temperatura 0 de Máxima Rigidez)
    const responseStream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: openaiMessages,
      temperature: 0, 
      stream: true,
    });

    const encoder = new TextEncoder();
    let completeBotResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              completeBotResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();

          // ⚡ PERSISTENCIA TOTAL AL FINALIZAR EL STREAM
          const cleanSavedResponse = completeBotResponse.trim();
          if (cleanSavedResponse) {
            await supabase.from('chat_history').insert({
              user_id: user.id,
              user_query: lastMessage,
              bot_response: cleanSavedResponse,
              created_at: new Date().toISOString()
            });
            console.log('✅ Registro consolidado con éxito.');
          }
        } catch (streamError) {
          console.error('🚨 Stream Error:', streamError);
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error('❌ Critical Crash:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}