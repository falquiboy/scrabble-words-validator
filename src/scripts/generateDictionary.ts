import { supabase } from '@/integrations/supabase/client';
import { writeFileSync } from 'fs';
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
  lengthIndex: Map<number, number[]>; // length -> word indices
  alphagramIndex: Map<string, number[]>; // alphagram -> word indices
}

async function fetchAllWords(): Promise<string[]> {
  console.log('Fetching words from Supabase...');
  const { data, error } = await supabase
    .from('words')
    .select('word')
    .order('word');

  if (error) throw error;
  if (!data) return [];

  return data.map(row => row.word);
}

function processWords(words: string[]): DictionaryData {
  console.log('Processing words...');
  const processedWords: Word[] = words.map(word => ({
    word: word.toUpperCase(),
    alphagram: sortSpanishLetters(word.toUpperCase()),
    length: word.length
  }));

  // Create indices
  const lengthIndex = new Map<number, number[]>();
  const alphagramIndex = new Map<string, number[]>();

  processedWords.forEach((word, index) => {
    // Length index
    if (!lengthIndex.has(word.length)) {
      lengthIndex.set(word.length, []);
    }
    lengthIndex.get(word.length)!.push(index);

    // Alphagram index
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
  console.log('Serializing dictionary...');
  
  // Calculate total size
  const headerSize = 16; // magic(4) + version(4) + wordCount(4) + maxWordLength(4)
  
  // Calculate words section size
  let wordsSize = 0;
  for (const word of data.words) {
    wordsSize += 2 + word.word.length; // length(2) + chars
    wordsSize += 2 + word.alphagram.length; // length(2) + chars
    wordsSize += 1; // length of word
  }

  // Calculate indices size
  let indicesSize = 4; // number of length entries
  for (const [, indices] of data.lengthIndex) {
    indicesSize += 4 + indices.length * 4; // length + indices
  }
  
  indicesSize += 4; // number of alphagram entries
  for (const [alphagram, indices] of data.alphagramIndex) {
    indicesSize += 2 + alphagram.length + 4 + indices.length * 4; // alphagram length + chars + indices length + indices
  }

  const totalSize = headerSize + wordsSize + indicesSize;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const encoder = new TextEncoder();
  let offset = 0;

  // Write header
  encoder.encodeInto(data.header.magic, new Uint8Array(buffer, offset, 4));
  offset += 4;
  view.setUint32(offset, data.header.version);
  offset += 4;
  view.setUint32(offset, data.header.wordCount);
  offset += 4;
  view.setUint32(offset, data.header.maxWordLength);
  offset += 4;

  // Write words
  for (const word of data.words) {
    // Write word
    view.setUint16(offset, word.word.length);
    offset += 2;
    encoder.encodeInto(word.word, new Uint8Array(buffer, offset, word.word.length));
    offset += word.word.length;

    // Write alphagram
    view.setUint16(offset, word.alphagram.length);
    offset += 2;
    encoder.encodeInto(word.alphagram, new Uint8Array(buffer, offset, word.alphagram.length));
    offset += word.alphagram.length;

    // Write length
    view.setUint8(offset, word.length);
    offset += 1;
  }

  // Write length index
  view.setUint32(offset, data.lengthIndex.size);
  offset += 4;
  for (const [length, indices] of data.lengthIndex) {
    view.setUint8(offset, length);
    offset += 1;
    view.setUint32(offset, indices.length);
    offset += 4;
    indices.forEach(index => {
      view.setUint32(offset, index);
      offset += 4;
    });
  }

  // Write alphagram index
  view.setUint32(offset, data.alphagramIndex.size);
  offset += 4;
  for (const [alphagram, indices] of data.alphagramIndex) {
    view.setUint16(offset, alphagram.length);
    offset += 2;
    encoder.encodeInto(alphagram, new Uint8Array(buffer, offset, alphagram.length));
    offset += alphagram.length;
    view.setUint32(offset, indices.length);
    offset += 4;
    indices.forEach(index => {
      view.setUint32(offset, index);
      offset += 4;
    });
  }

  return buffer;
}

async function main() {
  try {
    const words = await fetchAllWords();
    console.log(`Fetched ${words.length} words`);

    const data = processWords(words);
    console.log('Dictionary processed');
    console.log(`Max word length: ${data.header.maxWordLength}`);
    console.log(`Length indices: ${data.lengthIndex.size}`);
    console.log(`Alphagram indices: ${data.alphagramIndex.size}`);

    const binary = serializeDictionary(data);
    console.log(`Binary size: ${binary.byteLength} bytes`);

    // Escribir el archivo con el tipo MIME correcto
    const binaryBuffer = Buffer.from(binary);
    writeFileSync('public/dictionary.bin', binaryBuffer, {
      encoding: null
    });
    
    // También crear un archivo .htaccess para asegurar el tipo MIME correcto
    writeFileSync('public/.htaccess', 
      'AddType application/octet-stream .bin\n' +
      '<Files "dictionary.bin">\n' +
      '  Header set Content-Type "application/octet-stream"\n' +
      '</Files>'
    );

    console.log('Dictionary binary and .htaccess saved to public/');
  } catch (error) {
    console.error('Error generating dictionary:', error);
    process.exit(1);
  }
}

main();