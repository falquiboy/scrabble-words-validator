/**
 * Generador de archivo KWG simulado para pruebas
 * Crea un KWG básico con algunas palabras de ejemplo
 */

import fs from 'fs';

// Mapeo de caracteres a tiles
const CHAR_TO_TILE: Record<string, number> = {
  '?': 0,   // Comodín
  'A': 1,
  'B': 2, 
  'C': 3,
  'Ç': 4,   // CH
  'D': 5,
  'E': 6,
  'F': 7,
  'G': 8,
  'H': 9,
  'I': 10,
  'J': 11,
  'K': 12,  // LL
  'L': 13,
  'M': 14,
  'N': 15,
  'Ñ': 16,
  'O': 17,
  'P': 18,
  'Q': 19,
  'R': 20,
  'S': 21,
  'T': 22,
  'U': 23,
  'V': 24,
  'W': 25,  // RR
  'X': 26,
  'Y': 27,
  'Z': 28,
  '^': 31   // Separador GADDAG
};

interface KWGNode {
  tile: number;
  accepts: boolean;
  isEnd: boolean;
  arcIndex: number;
}

function createNode(tile: number, accepts: boolean, isEnd: boolean, arcIndex: number): number {
  let entry = 0;
  entry |= (tile & 0xFF);              // bits 0-7
  entry |= (accepts ? 1 : 0) << 8;    // bit 8
  entry |= (isEnd ? 1 : 0) << 9;      // bit 9
  entry |= (arcIndex & 0x3FFFFF) << 10; // bits 10-31
  return entry;
}

// Palabras de ejemplo para el KWG simulado
const TEST_WORDS = [
  'CASA',
  'CASO', 
  'CAMA',
  'ÇAKA',    // CHALA
  'ÇOKO',    // CHOLO
  'CAKE',    // CALLE
  'CAÑO',
  'NIÑO',
  'AÑO',
  'PEWO',    // PERRO
  'FRIQUE',
  'FERIE',
  'ÇEJE',    // CHEJE
  'ÇELE',    // CHELE
  'AWUMAN'   // ARRUMAN
];

export function generateSimulatedKWG(): ArrayBuffer {
  const nodes: number[] = [];
  let nodeIndex = 0;
  
  // Por simplicidad, creamos un trie simple (no GADDAG completo)
  // Nodo raíz
  nodes.push(createNode(0, false, false, 1));
  nodeIndex++;
  
  // Para este ejemplo, agregamos algunas palabras manualmente
  // En producción, usaríamos Wolges para generar el KWG real
  
  // Agregar palabras de ejemplo
  TEST_WORDS.forEach((word, wordIdx) => {
    console.log(`Agregando palabra: ${word}`);
    
    // Por ahora, solo agregamos nodos secuenciales para demostración
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      const tile = CHAR_TO_TILE[char] || 0;
      const isLast = i === word.length - 1;
      const accepts = isLast;
      const isEnd = wordIdx === TEST_WORDS.length - 1 && isLast;
      const arcIndex = isLast ? 0 : nodeIndex + 1;
      
      nodes.push(createNode(tile, accepts, isEnd, arcIndex));
      nodeIndex++;
    }
  });
  
  // Convertir a ArrayBuffer
  const buffer = new ArrayBuffer(nodes.length * 4);
  const view = new DataView(buffer);
  
  nodes.forEach((node, idx) => {
    view.setUint32(idx * 4, node, true); // Little-endian
  });
  
  console.log(`✅ KWG simulado generado: ${nodes.length} nodos, ${buffer.byteLength} bytes`);
  
  return buffer;
}

// Si se ejecuta directamente
if (require.main === module) {
  const buffer = generateSimulatedKWG();
  fs.writeFileSync('spanish-esp-simulated.kwg', Buffer.from(buffer));
  console.log('📁 Archivo KWG simulado guardado como spanish-esp-simulated.kwg');
}