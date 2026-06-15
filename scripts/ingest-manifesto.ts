import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// 🔥 Intentar cargar .env.local (estándar de Next.js) o .env tradicional
const rootDir = process.cwd();
const envLocalPath = path.resolve(rootDir, '.env.local');
const envStandardPath = path.resolve(rootDir, '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
  console.log('📝 Cargando credenciales desde .env.local');
} else if (fs.existsSync(envStandardPath)) {
  dotenv.config({ path: envStandardPath });
  console.log('📝 Cargando credenciales desde .env');
} else {
  console.error('❌ Error Crítico: No se encontró ningún archivo .env o .env.local en la raíz del proyecto.');
  process.exit(1);
}

// Mapeo flexible de variables (acepta nombres limpios o con el prefijo de Next.js)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Validador visual del Búnker
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('\n❌ Error: Faltan llaves específicas dentro de tu archivo de configuración:');
  console.error(`- SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL ? '✅' : '❌'}`);
  console.error(`- SUPABASE_SERVICE_ROLE_KEY (Llave secreta de servicio): ${SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'}`);
  console.error(`- OPENAI_API_KEY: ${OPENAI_API_KEY ? '✅' : '❌'}`);
  console.error('\n💡 Consejo: Asegúrate de que los nombres de las variables en tu archivo coincidan con estos campos.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface ManifestoChunk {
  text: string;
  metadata: {
    type: string;
    book: string;
    chapter: number;
    verse_range: string;
    version: string;
    source: string;
    chunk_index: number;
  };
}

async function cargarManifiesto() {
  console.log('\n🛡️ Iniciando la carga del Manifiesto Doctrinal de Patmos...');

  const rutaJson = path.join(rootDir, 'patmos_manifesto.json');
  if (!fs.existsSync(rutaJson)) {
    console.error(`❌ Error: No se encontró el archivo patmos_manifesto.json en la raíz: ${rutaJson}`);
    process.exit(1);
  }

  const bloques: ManifestoChunk[] = JSON.parse(fs.readFileSync(rutaJson, 'utf-8'));
  console.log(`📖 Detectados ${bloques.length} axiomas de alta densidad para indexar.`);

  console.log('🧹 Removiendo versiones previas del MANIFESTO en Supabase...');
  await supabase
    .from('documents') 
    .delete()
    .match({ 'metadata->>book': 'MANIFESTO' });

  for (const bloque of bloques) {
    console.log(`⏳ Generando embedding para Axioma #${bloque.metadata.chunk_index}...`);

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: bloque.text,
      encoding_format: 'float',
    });

    const vector = response.data[0].embedding;

    console.log(`🚀 Inyectando Axioma #${bloque.metadata.chunk_index} en Supabase...`);
    const { error: insertError } = await supabase
      .from('documents') 
      .insert({
        content: bloque.text,
        embedding: vector,
        metadata: bloque.metadata
      });

    if (insertError) {
      console.error(`❌ Error al insertar Axioma #${bloque.metadata.chunk_index}:`, insertError);
      process.exit(1);
    }
  }

  console.log('\n👑 ¡Misión cumplida! El Manifiesto Doctrinal está activo en producción.');
}

cargarManifiesto().catch(console.error);