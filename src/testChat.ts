import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); 

import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai'; 

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
const openai = new OpenAI({ apiKey: openaiApiKey });

async function preguntarAPatmos(preguntaUsuario: string) {
  console.log(`\n🎯 Pregunta del usuario: "${preguntaUsuario}"`);
  console.log("🧠 Generando vector de la pregunta con OpenAI...");

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: preguntaUsuario,
  });
  const preguntaEmbedding = embeddingResponse.data[0].embedding;

  console.log("🔍 Buscando en Supabase los 3 fragmentos más relevantes de tu comentario...");

  // CAMBIO CLAVE: Ahora pedimos match_count: 3
  const { data: matches, error: matchError } = await supabase.rpc('match_documents', {
    query_embedding: preguntaEmbedding,
    match_threshold: 0.25, // Bajamos un pelín el umbral para asegurar que entren los 3 mejores
    match_count: 3,       
    filter: { book: 'Genesis' } 
  });

  if (matchError || !matches || matches.length === 0) {
    console.error("❌ No se encontraron fragmentos relevantes.", matchError?.message);
    return;
  }

  console.log(`\n📌 ¡Se encontraron ${matches.length} fragmentos relevantes!`);
  
  // Imprimimos la lista de fragmentos encontrados para auditar qué leyó el sistema
  matches.forEach((match: any, idx: number) => {
    console.log(`   [${idx + 1}] ID: ${match.id} | Similitud: ${(match.similarity * 100).toFixed(2)}% | Era: ${match.metadata?.theological_era}`);
  });

  // Unimos el contenido de los 3 fragmentos en un solo gran bloque de contexto
  const contextoUnificado = matches.map((m: any) => `[FRAGMENTO ID: ${m.id}]\n${m.content}`).join("\n\n---\n\n");

  console.log("\n🤖 Redactando respuesta combinando todas las fuentes encontradas...");

  const chatResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { 
        role: "system", 
        content: `Eres PATMOS, el asistente teológico de la aplicación. Tu única fuente de verdad son los fragmentos del comentario teológico provistos por el autor. Responde la pregunta de forma directa, seria y analítica utilizando estrictamente la doctrina de los fragmentos. Si los fragmentos contienen información contradictoria o complementaria, unifícala de forma coherente.
        
        CONTEXTO DEL MANUSCRITO (MÚLTIPLES FRAGMENTOS):
        """
        ${contextoUnificado}
        """` 
      },
      { role: "user", content: preguntaUsuario }
    ],
    temperature: 0.3
  });

  console.log("\n==================================================");
  console.log("👑 RESPUESTA DE PATMOS (CON MULTI-CONCHEO):");
  console.log(chatResponse.choices[0].message.content);
  console.log("==================================================");
}

// Ejecutamos la misma pregunta para comparar el resultado directamente
preguntarAPatmos("¿Quiénes son los hijos de Dios en Génesis 6 y qué postura tiene el manuscrito sobre los Nefilim?");