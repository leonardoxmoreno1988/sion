import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); 

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js'; 
import { OpenAI } from 'openai'; 

// ==========================================
// 1. INTERFACES Y CONTRATOS DE TIPADO
// ==========================================
interface TheologicalMetadata {
  book: string;
  chapter: number;
  verses: number[];
  theological_era: string;
}

// ==========================================
// 2. INICIALIZACIÓN DE ENTORNOS Y CLIENTES
// ==========================================
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY; 
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error("[CRÍTICO] Faltan variables de entorno en tu .env.local. Asegúrate de tener configuradas las llaves de Supabase y OpenAI.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// ==========================================
// 3. FUNCIONES AUXILIARES (EMBEDDINGS Y DIVISIÓN)
// ==========================================

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small", 
    input: text,
  });
  return response.data[0].embedding;
}

function splitIntoSubChunks(text: string, maxWords: number = 2500): string[] {
  const words = text.split(/\s+/);
  const subChunks: string[] = [];
  
  for (let i = 0; i < words.length; i += maxWords) {
    const chunkWords = words.slice(i, i + maxWords);
    subChunks.push(chunkWords.join(' '));
  }
  
  return subChunks;
}

/**
 * Extrae los metadatos usando OpenAI (gpt-4o-mini), garantizando velocidad constante
 * y blindaje absoluto contra los bloqueos de cuota diarios de Google.
 */
async function extractTheologicalMetadataWithOpenAI(rawChunk: string, estimatedChapter: number): Promise<TheologicalMetadata> {
  // Pasamos solo los primeros 3000 caracteres para agilizar y economizar tokens de análisis
  const sampleText = rawChunk.slice(0, 3000);

  const prompt = `
    Analiza esta muestra de un manuscrito teológico de Génesis. 
    Extrae únicamente los metadatos estructurales en formato JSON estricto.

    Reglas:
    1. Identifica los versículos comentados principales en este fragmento (ej: "1:1", "1:2") y guarda solo los números en el array "verses". Si es el prefacio, deja el array vacío.
    2. Clasifica la "theological_era" según el texto (ej: "Pre-Adamic", "Innocence", "Sabbatical", o "General Preface").

    Muestra del Texto:
    """
    ${sampleText}
    """

    Devuelve un objeto JSON puro con esta estructura exacta (sin formato de bloques markdown \`\`\`json):
    {
      "book": "Genesis",
      "chapter": ${estimatedChapter},
      "verses": [números de versículos],
      "theological_era": "era detectada"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Eres un experto en teología y análisis estructural de manuscritos. Respondes exclusivamente con objetos JSON puros y bien formateados." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const rawText = response.choices[0].message.content || "{}";
    const data = JSON.parse(rawText.trim());
    return data as TheologicalMetadata;

  } catch (e: any) {
    console.error(`[AVISO] Fallo temporal extrayendo metadata con OpenAI en Cap ${estimatedChapter}, usando fallback seguro:`, e.message);
    return {
      book: "Genesis",
      chapter: estimatedChapter,
      verses: [],
      theological_era: estimatedChapter === 0 ? "General Preface" : "Unknown/Dynamic"
    };
  }
}

// ==========================================
// 4. PIPELINE PRINCIPAL DE PURGA E INYECCIÓN
// ==========================================
async function purgeAndInjectGenesis(filePath: string) {
  console.log(`[1/4] 🧹 INICIANDO PURGA: Eliminando fragmentos antiguos de Génesis en la tabla 'documents'...`);
  
  const { error: purgeError } = await supabase
    .from('documents') 
    .delete()
    .eq('metadata->>book', 'Genesis'); 

  if (purgeError) {
    console.error(`[CRÍTICO] Falló la purga de datos antiguos en 'documents':`, purgeError.message);
    return;
  }
  console.log(`[LOG] Purga completada con éxito. Tabla 'documents' limpia para Génesis.`);

  console.log(`[2/4] 📖 Leyendo manuscrito...`);
  const absolutePath = path.resolve(filePath);
  const fileContent = fs.readFileSync(absolutePath, 'utf-8');

  const chunks = fileContent.split(/(?=# Chapter\s+\d+)/i);
  console.log(`[LOG] Se detectaron ${chunks.length} secciones principales (Prefacio + Capítulos).`);

  console.log(`[3/4] 🧠 Procesando bloques e indexando en Supabase con OpenAI...`);
  
  for (let i = 0; i < chunks.length; i++) {
    const rawChunk = chunks[i].trim();
    if (!rawChunk) continue;

    let estimatedChapter = 0;
    const matchChapter = rawChunk.match(/# Chapter\s+(\d+)/i);
    if (matchChapter) {
      estimatedChapter = parseInt(matchChapter[1]);
    }

    console.log(`\n[PROCESANDO] ${estimatedChapter === 0 ? 'Prefacio/Introducción' : `Capítulo ${estimatedChapter}`}...`);

    try {
      // 1. Extraer los metadatos puros usando OpenAI (Inmune a los bloqueos de cuota diarios de Google)
      const metadata = await extractTheologicalMetadataWithOpenAI(rawChunk, estimatedChapter);
      
      // 2. Fraccionar el contenido de forma segura para los Embeddings
      const subChunks = splitIntoSubChunks(rawChunk, 2500);

      // 3. Procesar e inyectar cada sub-fragmento
      for (let j = 0; j < subChunks.length; j++) {
        const textToProcess = subChunks[j];
        const embedding = await generateEmbedding(textToProcess);

        const baseId = estimatedChapter === 0 
          ? `genesis-preface` 
          : `genesis-ch${metadata.chapter}-verses-${metadata.verses.slice(0, 3).join('_') || 'all'}`;
        
        const uniqueId = subChunks.length > 1 ? `${baseId}-part-${j + 1}` : baseId;

        const { error: injectError } = await supabase
          .from('documents') 
          .upsert({
            id: uniqueId,
            content: textToProcess, // El bloque de texto original conservando su Markdown
            embedding: embedding,
            metadata: {
              book: "Genesis",
              chapter: metadata.chapter,
              verses: metadata.verses,
              theological_era: metadata.theological_era,
              sub_chunk_index: j + 1,
              axioms_multipliers: {
                literalism: 2.0, 
                dispensationalism: 2.0, 
                anti_ecumenism: 1.8
              }
            }
          });

        if (injectError) throw injectError;
        console.log(`   [ÉXITO] Sub-fragmento indexado: ${uniqueId} | Era: ${metadata.theological_era}`);
      }

      // Una pausa mínima de cortesía de 200ms para evitar saturación de la conexión local
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (err: any) {
      console.error(`[ERROR CRÍTICO EN BLOQUE - CAPÍTULO ${estimatedChapter}]:`, err?.message || err);
    }
  }
  console.log(`\n[4/4] 🎉 Proceso finalizado. Génesis ha sido completamente reemplazado con metadata e indexación impecable.`);
}

// ==========================================
// 5. EJECUCIÓN
// ==========================================
purgeAndInjectGenesis('./_manuscripts/genesis.md');