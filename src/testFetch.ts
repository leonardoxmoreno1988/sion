import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); 

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function testFetch() {
  console.log("🔍 Consultando los primeros 3 fragmentos de Génesis en Supabase...");

  const { data, error } = await supabase
    .from('documents')
    .select('id, metadata->chapter, metadata->theological_era, content')
    .eq('metadata->>book', 'Genesis')
    .limit(3);

  if (error) {
    console.error("❌ Error al consultar:", error.message);
    return;
  }

  console.log("\n==================================================");
  data.forEach((row, index) => {
    console.log(`\n📄 FRAGMENTO ${index + 1}:`);
    console.log(`🆔 ID: ${row.id}`);
    console.log(`📖 Capítulo: ${row.chapter}`);
    console.log(`⏳ Era Teológica: ${row.theological_era}`);
    console.log(`📝 Contenido (Muestra): ${row.content.slice(0, 150)}...`);
    console.log("--------------------------------------------------");
  });
}

testFetch();