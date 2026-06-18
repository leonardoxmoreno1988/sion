import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Configuración de entorno inteligente
const rootDir = process.cwd();
const envLocalPath = path.resolve(rootDir, '.env.local');
const envStandardPath = path.resolve(rootDir, '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envStandardPath)) {
  dotenv.config({ path: envStandardPath });
}

// Mapeo flexible idéntico a tu script de Manifiesto
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Error: No se pudieron cargar todas las credenciales necesarias desde el entorno.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function activarCapitulo() {
  // 🎯 REEMPLAZAR AQUÍ CADA VEZ QUE CAMBIES DE CAPÍTULO
  const TARGET_BOOK = "Genesis";
  const TARGET_CHAPTER = 10;

  console.log(`📡 Buscando registros sin embedding para: ${TARGET_BOOK} Capítulo ${TARGET_CHAPTER}...`);

  // Extraer las filas que acabamos de meter por SQL
  const { data: rows, error: fetchError } = await supabase
    .from('documents')
    .select('id, content')
    .eq('metadata->>book', TARGET_BOOK)
    .eq('metadata->>chapter', TARGET_CHAPTER.toString())
    .is('embedding', null);

  if (fetchError) {
    console.error('❌ Error obteniendo filas:', fetchError);
    return;
  }

  if (!rows || rows.length === 0) {
    console.log('✅ Todos los registros de este capítulo ya tienen embeddings o no se encontraron filas nuevas.');
    return;
  }

  console.log(`🤖 Generando ${rows.length} embeddings con OpenAI para este bloque...`);

  for (const row of rows) {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: row.content,
      encoding_format: 'float',
    });

    const vector = response.data[0].embedding;

    const { error: updateError } = await supabase
      .from('documents')
      .update({ embedding: vector })
      .eq('id', row.id);

    if (updateError) {
      console.error(`❌ Error actualizando fila ${row.id}:`, updateError);
    } else {
      console.log(`🚀 Vector inyectado con éxito para ID: ${row.id}`);
    }
  }

  console.log(`\n👑 ¡Génesis ${TARGET_CHAPTER} se encuentra activo en producción para Patmos!`);
}

activarCapitulo().catch(console.error);