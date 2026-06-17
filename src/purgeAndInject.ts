import * as dotenv from 'dotenv';
// Cargamos las variables antes de que cualquier cliente intente leerlas
dotenv.config({ path: '.env.local' }); 

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js'; 
import { GoogleGenAI } from '@google/genai';
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
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey || !openaiApiKey) {
  console.error("[CRÍTICO] Faltan variables de entorno en tu .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });
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
 * Extrae la metadata estructurada usando Gemini con un sistema de reintento inteligente
 * ante bloqueos de cuota o rate limits (Error 429).
 */
async function extractTheologicalMetadata(rawChunk: string, estimatedChapter: number): Promise<TheologicalMetadata | null> {
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

  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      if (!response || !response.text) {
        throw new Error("Respuesta vacía de la API");
      }

      const data = JSON.parse(response.text.trim());
      return data as TheologicalMetadata;

    } catch (e: any) {
      const errorStr = JSON.stringify(e);
      
      // Detectamos si es un error de Cuota Agotada / Rate Limit (429)
      if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        attempts++;
        
        // Intentamos extraer dinámicamente el tiempo de espera que pide Google, si no, usamos 60 segundos por defecto
        let waitTimeMs = 60000; 
        const retryMatch = errorStr.match(/retry in ([\d\.]+)s/i);
        if (retryMatch && retryMatch[1]) {
          waitTimeMs = Math.ceil(parseFloat(retryMatch[1])) * 1000 + 2000; // Agregamos 2 segundos de margen
        }

        console.warn(`[CUOTA EXCEDIDA] Gemini nos bloqueó en el Capítulo ${estimatedChapter}. Reintento ${attempts}/${maxAttempts}. Congelando script por ${waitTimeMs / 1000} segundos...`);
        
        // Detener la ejecución el tiempo requerido
        await new Promise(resolve => setTimeout(resolve, waitTimeMs));
        continue; // Volver al inicio del bucle a intentar el mismo capítulo
      }

      // Si es otro tipo de error (ej. parseo de JSON), imprimimos y salimos del bucle
      console.error(`[ERROR DE PARSEO EN CAPÍTULO ${estimatedChapter}]:`, e?.message || e);
      break;
    }
  }

  // Si fallan todos los reintentos, devolvemos metadata segura por defecto en lugar de romper el pipeline
  console.warn(`[AVISO] No se pudo obtener metadata fina para el Capítulo ${estimatedChapter} tras varios intentos. Usando valores por defecto.`);
  return {
    book: "Genesis",
    chapter: estimatedChapter,
    verses: [],
    theological_era: estimatedChapter === 0 ? "General Preface" : "Unknown/Dynamic"
  };
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
    console.error(`[CRÍTICO] Falló la purga de datos antiguos:`, purgeError.message);
    return;
  }
  console.log(`[LOG] Purga completada con éxito. Tabla 'documents' limpia para Génesis.`);

  console.log(`[2/4] 📖 Leyendo manuscrito...`);
  const absolutePath = path.resolve(filePath);
  const fileContent = fs.readFileSync(absolutePath, 'utf-8');

  const chunks = fileContent.split(/(?=# Chapter\s+\d+)/i);
  console.log(`[LOG] Se detectaron ${chunks.length} secciones principales.`);

  console.log(`[3/4] 🧠 Procesando bloques e indexando en Supabase...`);
  
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
      // 1. Extraer los metadatos puros (con reintentos automáticos si Google frena)
      const metadata = await extractTheologicalMetadata(rawChunk, estimatedChapter);
      
      if (!metadata) continue;

      // 2. Fraccionar el contenido de forma segura para OpenAI
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
            content: textToProcess,
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
        console.log(`   [ÉXITO] Sub-fragmento indexado: ${uniqueId}`);
      }

      // Pausa base estándar entre capítulos para mitigar ráfagas comunes
      if (estimatedChapter !== chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3500));
      }

    } catch (err: any) {
      console.error(`[ERROR CRÍTICO EN BLOQUE - CAPÍTULO ${estimatedChapter}]:`, err?.message || err);
    }
  }
  console.log(`\n[4/4] 🎉 Proceso finalizado. Génesis ha sido completamente reemplazado con metadata impecable.`);
}

// ==========================================
// 5. EJECUCIÓN
// ==========================================
purgeAndInjectGenesis('./_manuscripts/genesis.md');