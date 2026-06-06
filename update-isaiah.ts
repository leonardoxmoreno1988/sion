import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// 1. Credenciales directas (Mantenidas de tu configuración)
const supabaseUrl = "https://eaizfpczslirmxrujbkl.supabase.co"; 
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaXpmcGN6c2xpcm14cnVqYmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMwNTQ1NSwiZXhwIjoyMDkzODgxNDU1fQ.3ny_4T62wh-7oHRuvV5-wDGDrN4IsnJgqF3PTVgWtiQ"; 
const openaiKey = "process.env.OPENAI_API_KEY"; 

// Validamos que las llaves estén presentes
if (supabaseUrl.includes("TU_URL") || supabaseKey.includes("TU_SERVICE") || openaiKey.includes("TU_OPENAI")) {
  throw new Error('❌ Error: Tienes que reemplazar los textos de ejemplo con tus llaves reales.');
}

// 2. Inicializa los clientes
const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

async function fixIsaiahEmbeddings() {
  // Cambiado el mensaje de consola a Isaiah 2
  console.log('🔍 Fetching Isaiah rows from Supabase...');

  // Cambiamos el filtro al capítulo 57
  const { data: rows, error: fetchError } = await supabase
    .from('documents')
    .select('id, content')
    .eq('metadata->>book', 'Isaiah')
    .eq('metadata->>chapter', '57') // <--- Cambiado a 57
    .eq('metadata->>type', 'commentary');

  if (fetchError) {
    console.error('❌ Error fetching rows:', fetchError);
    return;
  }

  if (!rows || rows.length === 0) {
    console.log('⚠️ No rows found matching the criteria for Isaiah.');
    return;
  }

  console.log(`🚀 Found ${rows.length} rows for Isaiah. Generating real embeddings...`);

  // 4. Iteramos sobre cada fila del capítulo para inyectar su vector real
  for (const row of rows) {
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small', 
        input: row.content,
      });

      const [{ embedding }] = embeddingResponse.data;

      const { error: updateError } = await supabase
        .from('documents')
        .update({ embedding: embedding })
        .eq('id', row.id);

      if (updateError) {
        console.error(`❌ Error updating row ID ${row.id}:`, updateError);
      } else {
        console.log(`✅ Successfully updated embedding for Row ID: ${row.id}`);
      }
    } catch (e) {
      console.error(`❌ Failed to process row ID ${row.id}:`, e);
    }
  }

  console.log('🏁 Process finished for Isaiah!');
}

// Ejecuta la función
fixIsaiahEmbeddings();