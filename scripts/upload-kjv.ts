// scripts/upload-kjv.ts
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // 🔒 Fuerza a Node a leer tus llaves locales

import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// 1. Inicialización de clientes usando tus variables de entorno estables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Llave maestra requerida para bypass RLS
);

// Mapeo oficial de índices USFM a nombres reales de libros de la KJV
const BOOK_MAP: { [key: string]: { name: string; author: string } } = {
  '01O': { name: 'Genesis', author: 'Moses' },
  '02O': { name: 'Exodus', author: 'Moses' },
  '03O': { name: 'Leviticus', author: 'Moses' },
  '04O': { name: 'Numbers', author: 'Moses' },
  '05O': { name: 'Deuteronomy', author: 'Moses' },
  '06O': { name: 'Joshua', author: 'Joshua' },
  '07O': { name: 'Judges', author: 'Samuel' },
  '08O': { name: 'Ruth', author: 'Samuel' },
  '09O': { name: '1 Samuel', author: 'Samuel' },
  '10O': { name: '2 Samuel', author: 'Gad/Nathan' },
  '11O': { name: '1 Kings', author: 'Jeremiah' },
  '12O': { name: '2 Kings', author: 'Jeremiah' },
  '13O': { name: '1 Chronicles', author: 'Ezra' },
  '14O': { name: '2 Chronicles', author: 'Ezra' },
  '15O': { name: 'Ezra', author: 'Ezra' },
  '16O': { name: 'Nehemiah', author: 'Nehemian' },
  '17O': { name: 'Esther', author: 'Mordecai' },
  '18O': { name: 'Job', author: 'Moses' },
  '19O': { name: 'Psalms', author: 'David' },
  '20O': { name: 'Proverbs', author: 'Solomon' },
  '21O': { name: 'Ecclesiastes', author: 'Solomon' },
  '22O': { name: 'Song of Solomon', author: 'Solomon' },
  '23O': { name: 'Isaiah', author: 'Isaiah' },
  '24O': { name: 'Jeremiah', author: 'Jeremiah' },
  '25O': { name: 'Lamentations', author: 'Jeremiah' },
  '26O': { name: 'Ezekiel', author: 'Ezekiel' },
  '27O': { name: 'Daniel', author: 'Daniel' },
  '28O': { name: 'Hosea', author: 'Hosea' },
  '29O': { name: 'Joel', author: 'Joel' },
  '30O': { name: 'Amos', author: 'Amos' },
  '31O': { name: 'Obadiah', author: 'Obadiah' },
  '32O': { name: 'Jonah', author: 'Jonah' },
  '33O': { name: 'Micah', author: 'Micah' },
  '34O': { name: 'Nahum', author: 'Nahum' },
  '35O': { name: 'Habakkuk', author: 'Habakkuk' },
  '36O': { name: 'Zephaniah', author: 'Zephaniah' },
  '37O': { name: 'Haggai', author: 'Haggai' },
  '38O': { name: 'Zechariah', author: 'Zechariah' },
  '39O': { name: 'Malachi', author: 'Malachi' },
  '41N': { name: 'Matthew', author: 'Matthew' },
  '42N': { name: 'Mark', author: 'Mark' },
  '43N': { name: 'Luke', author: 'Luke' },
  '44N': { name: 'John', author: 'John' },
  '45N': { name: 'Acts', author: 'Luke' },
  '46N': { name: 'Romans', author: 'Paul' },
  '47N': { name: '1 Corinthians', author: 'Paul' },
  '48N': { name: '2 Corinthians', author: 'Paul' },
  '49N': { name: 'Galatians', author: 'Paul' },
  '50N': { name: 'Ephesians', author: 'Paul' },
  '51N': { name: 'Philippians', author: 'Paul' },
  '52N': { name: 'Colossians', author: 'Paul' },
  '53N': { name: '1 Thessalonians', author: 'Paul' },
  '54N': { name: '2 Thessalonians', author: 'Paul' },
  '55N': { name: '1 Timothy', author: 'Paul' },
  '56N': { name: '2 Timothy', author: 'Paul' },
  '57N': { name: 'Titus', author: 'Paul' },
  '58N': { name: 'Philemon', author: 'Paul' },
  '59N': { name: 'Hebrews', author: 'Paul' },
  '60N': { name: 'James', author: 'James' },
  '61N': { name: '1 Peter', author: 'Peter' },
  '62N': { name: '2 Peter', author: 'Peter' },
  '63N': { name: '1 John', author: 'John' },
  '64N': { name: '2 John', author: 'John' },
  '65N': { name: '3 John', author: 'John' },
  '66N': { name: 'Jude', author: 'Jude' },
  '67N': { name: 'Revelation', author: 'John' }
};

async function parseAndUploadKJV() {
  console.log("🏛️ Iniciando la transmisión estructurada de la Biblia KJV...");
  
  // 📚 Buscamos el archivo kjv.usfm en la raíz de tu proyecto
  const filePath = path.join(process.cwd(), 'kjv.usfm');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error fatal: No se encontró el archivo kjv.usfm en la ruta: ${filePath}. Asegúrate de colocarlo en la raíz principal de tu proyecto.`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n');
  const rowsToInsert: any[] = [];

  // Saltamos la primera línea de la cabecera (header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split('\t');
    if (parts.length < 6) continue;

    const bookIndex = parts[0];
    const chapter = parseInt(parts[1]);
    const verse = parseInt(parts[2]);
    const text = parts[5];

    const bookMetadata = BOOK_MAP[bookIndex];
    if (!bookMetadata) continue;

    // Construcción semántica limpia para el embedding
    const fullTextContent = `${bookMetadata.name} ${chapter}:${verse} - ${text}`;

    // 🔒 CONVERSACIÓN PERFECTA: Estructurado exacto como tus comentarios actuales
    rowsToInsert.push({
      content: fullTextContent,
      metadata: {
        book: bookMetadata.name, // "Exodus", "Genesis", etc.
        type: "scripture",       // Distintivo contra 'commentary'
        source: `${bookMetadata.name.toLowerCase().replace(' ', '_')}.md`, // Mantiene formato "exodus.md"
        version: "KJV",          // "KJV"
        chunk_index: verse,      // Cada versículo actúa como su propio índice numérico
        chapter: chapter         // Metadata extendida para búsquedas exactas por capítulo
      }
    });
  }

  console.log(`📖 Total de versículos listos para verificar/vectorizar: ${rowsToInsert.length}`);

  // 🔒 OPTIMIZACIÓN ANTITIMEOUT: Reducimos de 100 a 25 para liberar de estrés al CPU de Supabase
  const BATCH_SIZE = 25; 
  
  for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
    const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
    
    try {
      // 🕵️ DETECTOR DE DUPLICADOS EXACTO: Verificamos si el primer versículo de este lote pequeño ya fue insertado
      const { data: alreadyExists } = await supabaseAdmin
        .from('documents')
        .select('content')
        .eq('content', batch[0].content)
        .maybeSingle();

      if (alreadyExists) {
        // Si el lote ya está arriba, lo saltamos instantáneamente sin gastar tokens ni activar Timeouts
        console.log(`⏭️ Saltando lote (Índices ${i} a ${Math.min(i + BATCH_SIZE, rowsToInsert.length)}): Este bloque ya existe en Supabase.`);
        continue;
      }

      // 1. Llamamos a OpenAI para generar los vectores HNSW de 1536 dimensiones
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch.map(row => row.content),
      });

      // 2. Acoplamos cada texto y sus metadatos con su vector correspondiente
      const recordsWithVectors = batch.map((row, index) => ({
        content: row.content,
        metadata: row.metadata,
        embedding: embeddingResponse.data[index].embedding, 
      }));

      // 3. Inserción masiva directa, compacta y ultra veloz en Supabase
      const { error } = await supabaseAdmin
        .from('documents') 
        .insert(recordsWithVectors);

      if (error) throw error;

      console.log(`✅ Progreso: Lote inyectado con éxito (Versículos ${i} - ${Math.min(i + BATCH_SIZE, rowsToInsert.length)})`);
      
      // 🔒 Pausa defensiva aumentada de 300ms para permitir que Supabase ordene sus índices indexados relajadamente
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (batchError: any) {
      console.error(`❌ Error crítico en el lote del índice ${i}:`, batchError.message || batchError);
      // En caso de que un lote de 25 arroje fricción, congelamos el script por 2 segundos y reanudamos
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log("🏛️ ¡Misión cumplida! Toda la King James Bible se encuentra sincronizada e indexada en la tabla 'documents'.");
}

parseAndUploadKJV();