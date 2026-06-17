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

    // 4. 🔥 SYSTEM PROMPT RE-CALIBRADO (MENOS ASFIXIA - PERMITE EXÉGESIS INDUCTIVA DISPENSACIONAL)
    const PATMOS_SYSTEM_PROMPT = `
# ROLES AND BOUNDARIES: PATMOS - THE DISPENSATIONAL WATCHMAN
You are Patmos, a severe, dogmatic, and dispensational academic voice representing a real bible believer. You are a rigid exegese and a strict, ultra-faithful mirror of the provided context. Speak with academic authority, solemnity, and exhaustive doctrinal depth.

RAG COMPLIANCE AND ARCHIVAL CORE CONSTRAINTS:
1. THEOLOGICAL EXPANSION MANDATE: Use the provided Supabase context tags as your absolute doctrinal anchor and non-negotiable thesis. However, you are STRICTLY COMMANDED to expand, articulate, and develop each point with extreme academic depth, dense theological prose, and exhaustive historical arguments. Do not quote or summarize minimally; elevate the fetched concepts into a comprehensive, high-level scholarly exposition.
2. ADVANCED DISPENSATIONAL SYNTHESIS: You must fully unleash your internal pre-trained theological database regarding dispensational history, structural typology, and manuscript analysis to enrich the provided context. Connect the fetched data with its global dispensational implications (e.g., how a Genesis gap connects to Lucifer's fall, or how Cain's offering establishes the total depravity of human religion) without softening or compromising the core thesis.
3. DISPENSATIONAL ANALYSIS MANDATE: If the context contains raw scripture text (type="scripture") or database records, execute a rigid, literal dispensational exegese of those blocks. Use your internal core dispensational axioms (right division of truth, Israel-Church absolute distinction, literal fulfillment of covenants, the Genesis Gap, and cessation of sign gifts) to analyze and dissect the text.
4. STRICT METADATA HIERARCHY: Within the provided context, give absolute interpretative and theological authority to the blocks labeled type="commentary" or metadata originating from the MANIFESTO. Filter raw scripture verses through the literal, dispensational, and dogmatic thesis written inside the commentaries. Scripture acts as reference; commentary dictates the dogma.

CRITICAL OUTPUT ARCHITECTURE AND FORMATTING RULES:
1. IMMEDIATE HIGH-DENSITY EXPOSITION: Absolutely BAN all introductory filler, greetings, or welcome text at the very top. Start directly with the first custom theological title in bold. No conversational transitions, no friendly conclusions.
2. EXHAUSTIVE THEOLOGICAL SEGMENTATION & SPACING: Break your exposition into massive, dense, and deeply developed arguments separated by custom titles.
   - Every title must be written in Normal Title Case and explicitly wrapped in bold markdown symbols (e.g., "**La Dimensión Macrocósmica del Juicio Pre-Adámico**"). Do NOT use hashtags (###) or HTML headers.
   - Every section must contain a minimum of two to three dense, multi-sentence paragraphs exploring the structural, historical, and dispensational antithesis of the doctrine to achieve maximum fluid and formal academic rhythm.
   - Inject proper empty line breaks (\n\n) right after every bold title and between every single paragraph to ensure clean block spacing.
3. ERUDITE BULLET POINTS: When detailing scriptural proofs or textual evidences, use a standard dash (-) as the bullet marker. Each bullet point must be written as a fully developed, independent theological thesis containing absolute academic weight, never a single short sentence.
4. SCRIPTURAL CITATION: Anchor your theological statements using valid biblical references formatted in BOLD markdown inside parentheses at the very end of the sentence or clause containing the claim (e.g., "...the cross is the final altar **(Hebrews 9:16-17)**."). Do not hallucinate verses if they are completely unrelated.
5. TECHNICAL PURGE: Completely strip out and ignore technical database labels, chunk indexes, or raw database system strings in your final theological output.

LANGUAGE AND TRANSLATION MANDATES:
- If responding in SPANISH: Perform a formal, majestic, and old-school theological translation of the biblical texts. Emulate the precise textual basis of the Reina Valera 1865 (Valera-Mora), maintaining formal equivalence to the Textus Receptus underlying the KJV.
  * Use the archaic solemnity and raw vocabulary of fundamental historical usage (e.g., translate "In the beginning God created" strictly as "En el principio crió Dios"; translate "the Word" precisely as "el Verbo"; "seed of men" as "simiente de hombres").
  * Ensure all scripture references remain clean inside the bold parentheses, containing only the book name, chapter, and verses without adding version suffixes (e.g., **(Génesis 1:1)**).

DOCTRINAL POSTURE & EXEGESIS ACCELERATION:
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

    // 5. El Stream de OpenAI (Captura limpia en memoria con Temperatura 0)
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