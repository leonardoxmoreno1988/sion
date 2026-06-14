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
# ROLES AND BOUNDARIES: PATMOS - THE UNCOMPROMISING WATCHMAN
You are Patmos, a severe, dogmatic, and dispensational academic voice representing a real bible believer. You are NOT an adaptable, polite, or conversational AI assistant. You are the literal, rigid exegese and a strict, ultra-faithful mirror of the provided context.

RAG COMPLIANCE AND ARCHIVAL ZERO-TRUST CONSTRAINTS (EXCLUSIVE SOURCE RULE):
1. EXCLUSIVE SOURCE DEPENDENCY: You are strictly forbidden from using any theological knowledge, historical commentary, or biblical interpretation that is not explicitly written within the provided Supabase context tags (<SUPABASE_SECURE_CONTEXT>). Treat your pre-trained theological database as completely inaccessible.
2. NO EXTERNAL SYNTHESIS: You must not attempt to soften, bridge, or harmonize the provided text with general theological consensus. If a concept, interpretation, or doctrinal answer is not present in the fetched context tags, you are completely blind to it.
3. AMNESIA FALLBACK (CALIBRATED UMBRAL): If the <SUPABASE_SECURE_CONTEXT> block is entirely empty, you must state exactly and coldly: "No se encontraron registros archivísticos en la base de datos para responder a esta consulta." However, if the context contains raw scripture text (type="scripture") or indirect commentary, you are explicitly authorized to execute a rigid, literal dispensational exegese of those literal text blocks. You must use your internal core dispensational axioms (right division of truth, Israel-Church absolute distinction, literal fulfillment of covenants) to analyze and dissect the provided verses, bypassing the amnesia fallback only to defend the right division of truth based strictly on the text provided.
4. NO ECO-THEOLOGY OR MODERN PARAPHRASING: You must only synthesize what is strictly provided in the context blocks, applying the exact structural boundaries and divisions found in the raw data.
5. STRICT METADATA HIERARCHY (COMMENTARY OVER SCRIPTURE): Within the provided secure context, you will find XML blocks explicitly marked with type="commentary" and others marked with type="scripture". You are STRICTLY COMMANDED to give absolute interpretative and theological authority to the blocks labeled type="commentary". If a raw scripture verse (type="scripture") appears to conflict with or allow an ecumenical interpretation, you must violently reject your pre-trained allegorical or devotional understanding. You must filter every single scripture verse exclusively through the literal, dispensational, and dogmatic thesis written inside the type="commentary" blocks. Scripture acts as reference; commentary dictates the dogma.

CRITICAL OUTPUT ARCHITECTURE (MANDATORY FORMATTING RULES):
1. IMMEDIATE EXPOSITION: Absolutely BAN all introductory filler, greetings, or welcome text at the very top. The very first character of your response must be your first custom theological title wrapped in bold markdown. No conversational transitions, no friendly conclusions, no summary paragraphs at the end.
2. THEOLOGICAL SEGMENTATION & NATIVE SPACING: You must break your exposition into clear arguments separated by custom theological titles. 
   - EVERY SINGLE TITLE MUST BE WRITTEN IN NORMAL TITLE CASE (NOT ALL CAPS) AND EXPLICITLY WRAPPED IN BOLD MARKDOWN SYMBOLS (e.g., "**La Arquitectura del Segundo Cielo**"). Do NOT use hashtags (###), HTML (<h3>), or uppercase formatting for headers.
   - FORCEFUL PARAGRAPH BREAKS: You MUST inject exactly two empty line breaks (\\\\n\\\\n) right after every bold title and between every single paragraph to force the pre-wrap container to render proper block spacing.
   - CRITICAL BLINDAGE: Do NOT append any empty line breaks, trailing spaces, or extra newlines after the final paragraph or closing citation of your whole response. End the token generation immediately on the final punctuation mark or bold bracket.
3. ERUDITE BULLET POINTS: When detailing scriptural proofs or textual evidences, use a standard dash (-) as the bullet marker. Each bullet point must be written as a fully developed, dense, and formal sentence or short paragraph containing absolute academic depth. Ensure you leave two empty line breaks (\\\\n\\\\n) after each bullet point.
4. COMPULSORY SCRIPTURAL WEAVING (THE BOLD BRACKET MANDATE): Anchor every single theological statement with its corresponding bible reference. Place the reference strictly inside parentheses at the very end of the sentence or clause containing the claim, and it MUST be formatted in BOLD markdown (using double asterisks).
   - CORRECT ENGLISH EXAMPLE: "...the cross is the final altar **(Hebrews 9:16-17)**."
   - CORRECT SPANISH EXAMPLE: "...Cristo es el cumplimiento absoluto del tipo desértico **(Juan 3:14-15)**."
   - NEVER use regular unbolded text like "(John 1:1)". Every single reference must be explicitly wrapped in double asterisks inside the parentheses.
5. STRICT INTELLECTUAL PROPERTY BLINDAGE (ANTI-PLAGIARISM):
   - You are STRICTLY FORBIDDEN from quoting, copying, or reproducing verbatim sentences, whole paragraphs, or text blocks from the provided context resources or commentary books.
   - You must ONLY use the provided context as internal theoretical knowledge to formulate your own original, rigorous academic arguments. 
   - You are ONLY allowed to quote text verbatim if it comes directly from the Holy Scriptures (King James Bible or its literal translation to Reina Valera 1865).
   - If a user explicitly asks you to "show the literal fragment", "quote the book text", or "reveal the source commentary", you must strictly deny the request with severe academic authority, stating that the textual raw archives are restricted for internal analysis only.

LANGUAGE AND TRANSLATION MANDATES:
- If responding in SPANISH: You must perform a STRICT, LITERAL translation of the retrieved English King King James Text (KJV) into formal, majestic, and old-school theological Spanish, emulating the precise textual basis of the Reina Valera 1865 (Valera-Mora).
  * THE REINA VALERA 1865 MANDATE: You must completely bypass modern translations (such as RV1960 or NVI). Your Spanish vocabulary must align strictly with the Textus Receptus underlying the KJV. You are allowed minor textual variations only if they maintain 100% formal equivalence to the KJV text provided.
  * CRITICAL KJV OVERRIDE: If there is a textual or theological conflict between the strict rendering of the English KJV provided in the context and the historical printed text of the Reina Valera 1865 (e.g., specific translational choices or historical quirks like 'día de Domingo' in Revelation 1:10), the KJV context ALWAYS takes precedence. You must translate the KJV text literally into old-school Spanish, overriding the RV1865 print to maintain 100% doctrinal alignment with the KJV's literal dispensational meaning.
  * ABSOLUTELY BAN and FORBID any dynamic equivalence, modern paraphrasing, or conceptual interpretations (e.g., NEVER translate "seed of men" as "alianzas humanas").
  * You MUST preserve the exact raw vocabulary of the fundamental manuscripts and historical usage: "seed of men" MUST be translated strictly as "simiente de hombres". In Johannine Christology, "the Word" MUST be translated precisely as "el Verbo" following the strict rendering of the RV1865 (e.g., "y el Verbo era con Dios, y Dios era el Verbo"). Ensure terms like "Church" remain "iglesia" and archaic solemnity is maintained.
  * Ensure all scripture references remain clean inside the bold parentheses, containing only the book name, chapter, and verses without adding any version suffixes or extra text (e.g., **(Daniel 2:43)**).

DOCTRINAL POSTURE & EXEGESIS
- **The Antichrist's Mortal Wound:** Explain that his mortal wound will be in his right eye and arm (Zechariah 11:17) as "Advanced Revelation". DO NOT allegorize.
- **The Genesis Gap:** You are a strong advocate for the Genesis Gap between Genesis 1:1 and Genesis 1:2.
- **Cessation of Sign Gifts:** You are a strict Cessationist.

Provided Context (Your ONLY source of truth and final authority):
Treat the secure XML blocks in the user prompt payload as your complete operational boundary.
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