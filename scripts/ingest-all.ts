// scripts/ingest-all.ts

// 💥 Reemplaza la forma en que importas el configurador por esto:
import pkg from '@next/env';
const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd()); // Ahora sí cargará el .env.local sin chistar

// El resto de tus imports se quedan exactamente igual:
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

// ... (Todo el código de procesamiento de abajo se mantiene igual)

// Clientes con variables de entorno de tu archivo local
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Llave maestra indispensable para bypass de límites en inserciones
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Segmentador semántico por párrafos (NotebookLM Style)
function chunkMarkdown(text: string, maxLength: number = 1000): string[] {
  // Separamos por párrafos o bloques de títulos markdown
  const paragraphs = text.split(/\n(?=(?:#+|\s*\n))/g);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const cleanParagraph = paragraph.trim();
    if (!cleanParagraph) continue;

    if ((currentChunk + "\n\n" + cleanParagraph).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = cleanParagraph;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${cleanParagraph}` : cleanParagraph;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

// Orquestador por archivo
async function processFile(filePath: string) {
  const fileName = path.basename(filePath, '.md');
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  
  // Determinamos el libro/tema basado en el nombre del archivo
  // Si el archivo se llama "matthew", el libro es "Matthew", si es "two-raptures" es un estudio temático
  const isBibleBook = ['genesis','exodus','matthew','luke','john','romans','hebrews'].includes(fileName.toLowerCase());
  const bookTag = isBibleBook ? fileName.charAt(0).toUpperCase() + fileName.slice(1) : "Theological_Study";
  const docType = "commentary"; // En tu V1 actual todo este conocimiento extendido entra como comentario base de la KJV

  console.log(`\n📖 Procesando: [${fileName}.md] -> Identificado como: ${bookTag} (${docType})`);
  
  const chunks = chunkMarkdown(rawContent);
  console.log(`📦 Generados ${chunks.length} fragmentos semánticos.`);

  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i];

    try {
      // 1. Generar Vector de 1536 dimensiones en OpenAI
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunkText,
      });
      const embedding = embeddingResponse.data[0].embedding;

      // 2. Metadatos unificados para la V1 (Solo KJV Baseline)
      const metadata = {
        version: 'KJV', // Candado para que Next.js lo consuma directamente
        type: docType,
        book: bookTag,
        source: `${fileName}.md`,
        chunk_index: i
      };

      // 3. Subida directa a Supabase
      const { error } = await supabase
        .from('documents')
        .insert([{
          content: chunkText,
          embedding: embedding,
          metadata: metadata
        }]);

      if (error) {
        console.error(`  ❌ Error en fragmento ${i}: ${error.message}`);
      } else {
        console.log(`  ✅ Fragmento ${i + 1}/${chunks.length} indexado.`);
      }

      // Pausa de seguridad (anti-rate-limit de OpenAI)
      await new Promise(resolve => setTimeout(resolve, 80));

    } catch (e: any) {
      console.error(`  💥 Fallo crítico en fragmento ${i}:`, e.message || e);
    }
  }
}

// ==================== BUCLE PRINCIPAL DE CARGA ====================
async function main() {
  const targetFolder = path.join(process.cwd(), '_manuscripts');
  
  if (!fs.existsSync(targetFolder)) {
    console.error(`❌ La carpeta ${targetFolder} no existe. Créala y pon tus .md allí.`);
    return;
  }

  const files = fs.readdirSync(targetFolder).filter(file => file.endsWith('.md'));
  console.log(`🗂️  Se encontraron ${files.length} libros/estudios listos para el Arsenal.`);

  for (const file of files) {
    const fullPath = path.join(targetFolder, file);
    await processFile(fullPath);
  }

  console.log("\n🏁 ¡EL ARSENAL HA SIDO TOTALMENTE ALIMENTADO Y CONFIGURADO PARA LA V1!");
}

main();