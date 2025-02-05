import { readFileSync, writeFileSync } from 'fs';
import { sortSpanishLetters } from './utils/spanishSort';

interface Word {
  word: string;
  alphagram: string;
  length: number;
}

interface DictionaryHeader {
  magic: string; // "DICT"
  version: number; // 1
  wordCount: number;
  maxWordLength: number;
}

interface DictionaryData {
  header: DictionaryHeader;
  words: Word[];
  lengthIndex: Map<number, number[]>;
  alphagramIndex: Map<string, number[]>;
}

function readWordsFromFile(): string[] {
  console.log('Leyendo archivo words.txt...');
  const content = readFileSync('words.txt', 'utf-8');
  const words = content.split('\n')
    .map(line => line.trim())
    .filter(word => word.length > 0);
  return words;
}

function processWords(words: string[]): DictionaryData {
  console.log('Procesando palabras...');
  
  // Crear arrays para almacenar datos e índices
  const processedWords: Word[] = new Array(words.length);
  const lengthIndex = new Map<number, number[]>();
  const alphagramIndex = new Map<string, number[]>();
  
  // Procesar palabras en un solo bucle
  for (let i = 0; i < words.length; i++) {
    const word = words[i].toUpperCase();
    const alphagram = sortSpanishLetters(word);
    const length = word.length;
    
    // Almacenar palabra procesada
    processedWords[i] = { word, alphagram, length };
    
    // Actualizar índice por longitud
    if (!lengthIndex.has(length)) {
      lengthIndex.set(length, []);
    }
    lengthIndex.get(length)!.push(i);
    
    // Actualizar índice por alfagrama
    if (!alphagramIndex.has(alphagram)) {
      alphagramIndex.set(alphagram, []);
    }
    alphagramIndex.get(alphagram)!.push(i);
    
    // Mostrar progreso cada 10000 palabras
    if ((i + 1) % 10000 === 0) {
      console.log(`Procesadas ${i + 1} palabras...`);
    }
  }

  const header: DictionaryHeader = {
    magic: 'DICT',
    version: 1,
    wordCount: processedWords.length,
    maxWordLength: Math.max(...processedWords.map(w => w.length))
  };

  return {
    header,
    words: processedWords,
    lengthIndex,
    alphagramIndex
  };
}

function serializeDictionary(data: DictionaryData): ArrayBuffer {
  console.log('Serializando diccionario...');
  
  // Calcular tamaño total
  const headerSize = 16; // magic(4) + version(4) + wordCount(4) + maxWordLength(4)
  
  // Calcular tamaño de la sección de palabras
  let wordsSize = 0;
  for (const word of data.words) {
    if (word.word.length > 15) {
      console.warn(`Advertencia: Palabra "${word.word}" excede el límite de 15 caracteres`);
    }
    wordsSize += 1; // length byte (uint8)
    wordsSize += word.word.length; // chars
    wordsSize += 1; // alphagram length byte (uint8)
    wordsSize += word.alphagram.length; // chars
  }

  // Calcular tamaño de índices
  let indicesSize = 4; // número de entradas de longitud
  for (const [, indices] of data.lengthIndex) {
    indicesSize += 1 + 2 + indices.length * 2; // longitud(1) + num_indices(2) + índices(2 cada uno)
  }
  
  indicesSize += 4; // número de entradas de alfagrama
  for (const [alphagram, indices] of data.alphagramIndex) {
    indicesSize += 1 + alphagram.length + 2 + indices.length * 2;
  }

  const totalSize = headerSize + wordsSize + indicesSize;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const encoder = new TextEncoder();
  let offset = 0;

  // Escribir header
  encoder.encodeInto(data.header.magic, new Uint8Array(buffer, offset, 4));
  offset += 4;
  view.setUint32(offset, data.header.version, true);
  offset += 4;
  view.setUint32(offset, data.header.wordCount, true);
  offset += 4;
  view.setUint32(offset, data.header.maxWordLength, true);
  offset += 4;

  // Escribir palabras
  for (const word of data.words) {
    // Escribir longitud y palabra
    view.setUint8(offset, word.word.length);
    offset += 1;
    encoder.encodeInto(word.word, new Uint8Array(buffer, offset, word.word.length));
    offset += word.word.length;

    // Escribir longitud y alfagrama
    view.setUint8(offset, word.alphagram.length);
    offset += 1;
    encoder.encodeInto(word.alphagram, new Uint8Array(buffer, offset, word.alphagram.length));
    offset += word.alphagram.length;
  }

  // Escribir índice de longitudes
  view.setUint32(offset, data.lengthIndex.size, true);
  offset += 4;
  for (const [length, indices] of data.lengthIndex) {
    view.setUint8(offset, length);
    offset += 1;
    view.setUint16(offset, indices.length, true);
    offset += 2;
    indices.forEach(index => {
      view.setUint16(offset, index, true);
      offset += 2;
    });
  }

  // Escribir índice de alfagramas
  view.setUint32(offset, data.alphagramIndex.size, true);
  offset += 4;
  for (const [alphagram, indices] of data.alphagramIndex) {
    view.setUint8(offset, alphagram.length);
    offset += 1;
    encoder.encodeInto(alphagram, new Uint8Array(buffer, offset, alphagram.length));
    offset += alphagram.length;
    view.setUint16(offset, indices.length, true);
    offset += 2;
    indices.forEach(index => {
      view.setUint16(offset, index, true);
      offset += 2;
    });
  }

  return buffer;
}

async function main() {
  try {
    const words = readWordsFromFile();
    console.log(`Leídas ${words.length} palabras`);

    const data = processWords(words);
    console.log('Diccionario procesado');
    console.log(`Longitud máxima de palabra: ${data.header.maxWordLength}`);
    console.log(`Índices por longitud: ${data.lengthIndex.size}`);
    console.log(`Índices por alfagrama: ${data.alphagramIndex.size}`);

    const binary = serializeDictionary(data);
    console.log(`Tamaño del binario: ${binary.byteLength} bytes`);

    const binaryBuffer = Buffer.from(binary);
    writeFileSync('public/dictionary.bin', binaryBuffer, {
      encoding: null
    });
    
    writeFileSync('public/.htaccess', 
      'AddType application/octet-stream .bin\n' +
      '<Files "dictionary.bin">\n' +
      '  Header set Content-Type "application/octet-stream"\n' +
      '</Files>'
    );

    console.log('Diccionario binario y .htaccess guardados en public/');
  } catch (error) {
    console.error('Error generando diccionario:', error);
    process.exit(1);
  }
}

main();