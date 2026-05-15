import fs from 'fs';
import usfm from 'usfm-js';

const usfmData = fs.readFileSync('./data/01_GEN_RV1865.usfm', 'utf-8');
const jsonOutput = usfm.toJSON(usfmData);

console.log("--- ESTRUCTURA DETECTADA ---");
console.log(JSON.stringify(jsonOutput, (key, value) => {
    // Solo vemos las primeras 2 capas para no inundar la terminal
    if (Array.isArray(value)) return `[Array de ${value.length} elementos]`;
    return value;
}, 2));

// Intento de ver el primer capítulo si existe
if (jsonOutput.chapters) {
    console.log("\n--- MUESTRA DEL CAPÍTULO 1 ---");
    console.log(JSON.stringify(jsonOutput.chapters[0], null, 2).substring(0, 500));
}