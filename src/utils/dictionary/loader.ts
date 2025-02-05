import { DictionaryData, DictionaryHeader, Word } from './types';

export async function loadDictionary(): Promise<DictionaryData> {
  console.log('Loading dictionary binary...');
  const response = await fetch('/dictionary.bin');
  if (!response.ok) {
    throw new Error(`Failed to load dictionary: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return deserializeDictionary(buffer);
}

function deserializeDictionary(buffer: ArrayBuffer): DictionaryData {
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  let offset = 0;

  // Read and validate magic number
  const magicBuffer = new Uint8Array(buffer, offset, 4);
  const magic = decoder.decode(magicBuffer);
  offset += 4;

  if (magic !== 'DICT') {
    console.error('Invalid magic number:', magic);
    throw new Error('Invalid dictionary format: incorrect magic number');
  }

  // Read version
  const version = view.getUint32(offset);
  offset += 4;

  if (version !== 1) {
    console.error('Unsupported version:', version);
    throw new Error(`Unsupported dictionary version: ${version}`);
  }

  // Read header
  const header: DictionaryHeader = {
    magic,
    version,
    wordCount: view.getUint32(offset),
    maxWordLength: view.getUint32(offset + 4)
  };
  offset += 8;

  console.log('Dictionary header:', header);

  // Read words
  const words: Word[] = [];
  for (let i = 0; i < header.wordCount; i++) {
    try {
      // Read word
      const wordLength = view.getUint16(offset);
      offset += 2;
      if (wordLength > 100) { // Sanity check
        throw new Error(`Invalid word length: ${wordLength}`);
      }
      const wordBuffer = new Uint8Array(buffer, offset, wordLength);
      const word = decoder.decode(wordBuffer);
      offset += wordLength;

      // Read alphagram
      const alphagramLength = view.getUint16(offset);
      offset += 2;
      if (alphagramLength > 100) { // Sanity check
        throw new Error(`Invalid alphagram length: ${alphagramLength}`);
      }
      const alphagramBuffer = new Uint8Array(buffer, offset, alphagramLength);
      const alphagram = decoder.decode(alphagramBuffer);
      offset += alphagramLength;

      // Read length
      const length = view.getUint8(offset);
      offset += 1;

      words.push({ word, alphagram, length });

      if (i === 0 || i === header.wordCount - 1) {
        console.log(`Word ${i}:`, { word, alphagram, length });
      }
    } catch (error) {
      console.error(`Error reading word at index ${i}, offset ${offset}:`, error);
      throw error;
    }
  }

  // Read indices
  const lengthIndex = new Map<number, number[]>();
  const lengthIndexSize = view.getUint32(offset);
  offset += 4;

  console.log('Reading length index, size:', lengthIndexSize);
  
  for (let i = 0; i < lengthIndexSize; i++) {
    const length = view.getUint8(offset);
    offset += 1;
    const indicesCount = view.getUint32(offset);
    offset += 4;
    
    if (indicesCount > header.wordCount) { // Sanity check
      throw new Error(`Invalid indices count: ${indicesCount}`);
    }

    const indices: number[] = [];
    for (let j = 0; j < indicesCount; j++) {
      indices.push(view.getUint32(offset));
      offset += 4;
    }
    lengthIndex.set(length, indices);
  }

  // Read alphagram index
  const alphagramIndex = new Map<string, number[]>();
  const alphagramIndexSize = view.getUint32(offset);
  offset += 4;

  console.log('Reading alphagram index, size:', alphagramIndexSize);

  for (let i = 0; i < alphagramIndexSize; i++) {
    const alphagramLength = view.getUint16(offset);
    offset += 2;
    if (alphagramLength > 100) { // Sanity check
      throw new Error(`Invalid alphagram length: ${alphagramLength}`);
    }
    const alphagramBuffer = new Uint8Array(buffer, offset, alphagramLength);
    const alphagram = decoder.decode(alphagramBuffer);
    offset += alphagramLength;
    
    const indicesCount = view.getUint32(offset);
    offset += 4;
    
    if (indicesCount > header.wordCount) { // Sanity check
      throw new Error(`Invalid indices count: ${indicesCount}`);
    }

    const indices: number[] = [];
    for (let j = 0; j < indicesCount; j++) {
      indices.push(view.getUint32(offset));
      offset += 4;
    }
    alphagramIndex.set(alphagram, indices);
  }

  console.log('Dictionary loaded successfully');
  console.log('Total words:', words.length);
  console.log('Length index size:', lengthIndex.size);
  console.log('Alphagram index size:', alphagramIndex.size);

  return {
    header,
    words,
    lengthIndex,
    alphagramIndex
  };
}