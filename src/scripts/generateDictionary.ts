import { readFileSync, writeFileSync } from 'fs';

import { sortSpanishLetters } from '../utils/spanishSort.ts';

// Interfaces

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

const BATCH_SIZE = 10000;

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

const processedWords: Word[] = new Array(words.length);

const lengthIndex = new Map<number, number[]>();

const alphagramIndex = new Map<string, number[]>();

let maxWordLength = 0;

for (let i = 0; i < words.length; i++) {

const word = words[i].toUpperCase();
const alphagram = sortSpanishLetters(word);
const length = word.length;
maxWordLength = Math.max(maxWordLength, length);
processedWords[i] = { word, alphagram, length };
if (!lengthIndex.has(length)) {
  lengthIndex.set(length, []);
}
lengthIndex.get(length)!.push(i);
if (!alphagramIndex.has(alphagram)) {
  alphagramIndex.set(alphagram, []);
}
alphagramIndex.get(alphagram)!.push(i);
if ((i + 1) % BATCH_SIZE === 0 || i + 1 === words.length) {
  console.log(`Procesadas ${i + 1} palabras...`);
}
}

const header: DictionaryHeader = {

magic: 'DICT',
version: 1,
wordCount: processedWords.length,
maxWordLength
};

return { header, words: processedWords, lengthIndex, alphagramIndex };

}

function serializeDictionary(data: DictionaryData): ArrayBuffer {

console.log('Serializando diccionario...');

const headerSize = 16; // magic(4) + version(4) + wordCount(4) + maxWordLength(4)

let wordsSize = 0;

for (const word of data.words) {

wordsSize += 1 + word.word.length + 1 + word.alphagram.length;
}

let indicesSize = 4;

for (const [, indices] of data.lengthIndex) {

indicesSize += 1 + 2 + indices.length * 2;
}

indicesSize += 4;

for (const [alphagram, indices] of data.alphagramIndex) {

indicesSize += 1 + alphagram.length + 2 + indices.length * 2;
}

const totalSize = headerSize + wordsSize + indicesSize;

const buffer = new ArrayBuffer(totalSize);

const view = new DataView(buffer);

const encoder = new TextEncoder();

let offset = 0;

// Write header

encoder.encodeInto(data.header.magic, new Uint8Array(buffer, offset, 4));

offset += 4;

view.setUint32(offset, data.header.version, true);

offset += 4;

view.setUint32(offset, data.header.wordCount, true);

offset += 4;

view.setUint32(offset, data.header.maxWordLength, true);

offset += 4;

// Write words in batches

for (const word of data.words) {

view.setUint8(offset, word.word.length);
offset += 1;
encoder.encodeInto(word.word, new Uint8Array(buffer, offset, word.word.length));
offset += word.word.length;
view.setUint8(offset, word.alphagram.length);
offset += 1;
encoder.encodeInto(word.alphagram, new Uint8Array(buffer, offset, word.alphagram.length));
offset += word.alphagram.length;
}

// Write length index

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

// Write alphagram index

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
writeFileSync('public/dictionary.bin', binaryBuffer);
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