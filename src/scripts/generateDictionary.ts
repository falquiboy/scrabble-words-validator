import { readFileSync, writeFileSync } from 'fs';
import { sortSpanishLetters } from '@/utils/spanishSort';

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
  const processedWords: Word[] = words.map(word => ({
    word: word.toUpperCase(),
    alphagram: sortSpanishLetters(word.toUpperCase()),
    length: word.length
  }));

  // Crear índices
  const lengthIndex = new Map<number, number[]>();
  const alphagramIndex = new Map<string, number[]>();

  processedWords.forEach((word, index) => {
    // Índice por longitud
    if (!lengthIndex.has(word.length)) {
      lengthIndex.set(word.length, []);
    }
    lengthIndex.get(word.length)!.push(index);

    // Índice por alfagrama
    if (!alphagramIndex.has(word.alphagram)) {
      alphagramIndex.set(word.alphagram, []);
    }
    alphagramIndex.get(word.alphagram)!.push(index);
  });

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
    wordsSize += 2 + word.word.length; // length(2) + chars
    wordsSize += 2 + word.alphagram.length; // length(2) + chars
    wordsSize += 1; // length of word
  }

  // Calcular tamaño de índices
  let indicesSize = 4; // número de entradas de longitud
  for (const [, indices] of data.lengthIndex) {
    indicesSize += 4 + indices.length * 4; // longitud + índices
  }
  
  indicesSize += 4; // número de entradas de alfagrama
  for (const [alphagram, indices] of data.alphagramIndex) {
    indicesSize += 2 + alphagram.length + 4 + indices.length * 4; // longitud alfagrama + chars + longitud índices + índices
  }

  const totalSize = headerSize + wordsSize + indicesSize;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const encoder = new TextEncoder();
  let offset = 0;

  // Escribir header
  encoder.encodeInto(data.header.magic, new Uint8Array(buffer, offset, 4));
  offset += 4;
  view.setUint32(offset, data.header.version, true); // Usar little-endian
  offset += 4;
  view.setUint32(offset, data.header.wordCount, true);
  offset += 4;
  view.setUint32(offset, data.header.maxWordLength, true);
  offset += 4;

  // Escribir palabras
  for (const word of data.words) {
    // Escribir palabra
    view.setUint16(offset, word.word.length, true);
    offset += 2;
    encoder.encodeInto(word.word, new Uint8Array(buffer, offset, word.word.length));
    offset += word.word.length;

    // Escribir alfagrama
    view.setUint16(offset, word.alphagram.length, true);
    offset += 2;
    encoder.encodeInto(word.alphagram, new Uint8Array(buffer, offset, word.alphagram.length));
    offset += word.alphagram.length;

    // Escribir longitud
    view.setUint8(offset, word.length);
    offset += 1;
  }

  // Escribir índice de longitudes
  view.setUint32(offset, data.lengthIndex.size, true);
  offset += 4;
  for (const [length, indices] of data.lengthIndex) {
    view.setUint8(offset, length);
    offset += 1;
    view.setUint32(offset, indices.length, true);
    offset += 4;
    indices.forEach(index => {
      view.setUint32(offset, index, true);
      offset += 4;
    });
  }

  // Escribir índice de alfagramas
  view.setUint32(offset, data.alphagramIndex.size, true);
  offset += 4;
  for (const [alphagram, indices] of data.alphagramIndex) {
    view.setUint16(offset, alphagram.length, true);
    offset += 2;
    encoder.encodeInto(alphagram, new Uint8Array(buffer, offset, alphagram.length));
    offset += alphagram.length;
    view.setUint32(offset, indices.length, true);
    offset += 4;
    indices.forEach(index => {
      view.setUint32(offset, index, true);
      offset += 4;
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

    // Escribir el archivo con el tipo MIME correcto
    const binaryBuffer = Buffer.from(binary);
    writeFileSync('public/dictionary.bin', binaryBuffer, {
      encoding: null
    });
    
    // Crear archivo .htaccess para asegurar el tipo MIME correcto
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