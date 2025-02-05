import { DictionaryData, DictionaryHeader, Word } from './types';

export async function loadDictionary(): Promise<DictionaryData> {
  console.log('Loading dictionary binary...');
  const response = await fetch('/dictionary.bin');
  const buffer = await response.arrayBuffer();
  return deserializeDictionary(buffer);
}

function deserializeDictionary(buffer: ArrayBuffer): DictionaryData {
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  let offset = 0;

  // Read header
  const magic = decoder.decode(new Uint8Array(buffer, offset, 4));
  offset += 4;
  if (magic !== 'DICT') {
    throw new Error('Invalid dictionary format');
  }

  const version = view.getUint32(offset);
  offset += 4;
  if (version !== 1) {
    throw new Error(`Unsupported dictionary version: ${version}`);
  }

  const header: DictionaryHeader = {
    magic,
    version,
    wordCount: view.getUint32(offset),
    maxWordLength: view.getUint32(offset + 4)
  };
  offset += 8;

  // Read words
  const words: Word[] = [];
  for (let i = 0; i < header.wordCount; i++) {
    // Read word
    const wordLength = view.getUint16(offset);
    offset += 2;
    const word = decoder.decode(new Uint8Array(buffer, offset, wordLength));
    offset += wordLength;

    // Read alphagram
    const alphagramLength = view.getUint16(offset);
    offset += 2;
    const alphagram = decoder.decode(new Uint8Array(buffer, offset, alphagramLength));
    offset += alphagramLength;

    // Read length
    const length = view.getUint8(offset);
    offset += 1;

    words.push({ word, alphagram, length });
  }

  // Read length index
  const lengthIndex = new Map<number, number[]>();
  const lengthIndexSize = view.getUint32(offset);
  offset += 4;
  
  for (let i = 0; i < lengthIndexSize; i++) {
    const length = view.getUint8(offset);
    offset += 1;
    const indicesCount = view.getUint32(offset);
    offset += 4;
    
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

  for (let i = 0; i < alphagramIndexSize; i++) {
    const alphagramLength = view.getUint16(offset);
    offset += 2;
    const alphagram = decoder.decode(new Uint8Array(buffer, offset, alphagramLength));
    offset += alphagramLength;
    
    const indicesCount = view.getUint32(offset);
    offset += 4;
    
    const indices: number[] = [];
    for (let j = 0; j < indicesCount; j++) {
      indices.push(view.getUint32(offset));
      offset += 4;
    }
    alphagramIndex.set(alphagram, indices);
  }

  return {
    header,
    words,
    lengthIndex,
    alphagramIndex
  };
}