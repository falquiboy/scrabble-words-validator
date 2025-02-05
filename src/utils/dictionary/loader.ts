import { DictionaryData, DictionaryHeader, Word } from './types';

export async function loadDictionary(): Promise<DictionaryData> {
  console.log('Loading dictionary binary...');
  try {
    const response = await fetch('/dictionary.bin');
    if (!response.ok) {
      throw new Error(`Failed to load dictionary: ${response.status} ${response.statusText}`);
    }
    
    // Verificar que realmente estamos recibiendo un archivo binario
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/octet-stream')) {
      console.error('Unexpected content type:', contentType);
      throw new Error('Invalid response type: expected binary file');
    }

    const buffer = await response.arrayBuffer();
    console.log('Dictionary binary loaded, size:', buffer.byteLength);
    return deserializeDictionary(buffer);
  } catch (error) {
    console.error('Error loading dictionary:', error);
    throw error;
  }
}

function deserializeDictionary(buffer: ArrayBuffer): DictionaryData {
  const view = new DataView(buffer);
  const decoder = new TextDecoder();
  let offset = 0;

  try {
    // Read and validate magic number
    const magicBuffer = new Uint8Array(buffer, offset, 4);
    const magic = decoder.decode(magicBuffer);
    console.log('Magic number read:', magic);
    offset += 4;

    if (magic !== 'DICT') {
      console.error('Invalid magic number:', magic);
      throw new Error('Invalid dictionary format: incorrect magic number');
    }

    // Read version - Aceptamos cualquier versión por ahora
    const version = view.getUint32(offset);
    console.log('Dictionary version:', version);
    offset += 4;

    // Read header
    const header: DictionaryHeader = {
      magic,
      version,
      wordCount: view.getUint32(offset),
      maxWordLength: view.getUint32(offset + 4)
    };
    offset += 8;

    console.log('Dictionary header:', header);

    // Read words with additional validation
    const words: Word[] = [];
    for (let i = 0; i < header.wordCount; i++) {
      // Read word
      const wordLength = view.getUint16(offset);
      offset += 2;
      
      if (wordLength > 100) {
        throw new Error(`Invalid word length at index ${i}: ${wordLength}`);
      }
      
      const wordBuffer = new Uint8Array(buffer, offset, wordLength);
      const word = decoder.decode(wordBuffer);
      offset += wordLength;

      // Read alphagram
      const alphagramLength = view.getUint16(offset);
      offset += 2;
      
      if (alphagramLength > 100) {
        throw new Error(`Invalid alphagram length at index ${i}: ${alphagramLength}`);
      }
      
      const alphagramBuffer = new Uint8Array(buffer, offset, alphagramLength);
      const alphagram = decoder.decode(alphagramBuffer);
      offset += alphagramLength;

      // Read length
      const length = view.getUint8(offset);
      offset += 1;

      words.push({ word, alphagram, length });

      // Log first and last word for debugging
      if (i === 0 || i === header.wordCount - 1) {
        console.log(`Word ${i}:`, { word, alphagram, length });
      }
    }

    // Read indices with validation
    const lengthIndex = new Map<number, number[]>();
    const lengthIndexSize = view.getUint32(offset);
    offset += 4;

    if (lengthIndexSize > header.wordCount) {
      throw new Error(`Invalid length index size: ${lengthIndexSize}`);
    }

    console.log('Reading length index, size:', lengthIndexSize);
    
    for (let i = 0; i < lengthIndexSize; i++) {
      const length = view.getUint8(offset);
      offset += 1;
      const indicesCount = view.getUint32(offset);
      offset += 4;
      
      if (indicesCount > header.wordCount) {
        throw new Error(`Invalid indices count at length ${length}: ${indicesCount}`);
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

    if (alphagramIndexSize > Math.pow(header.wordCount, 2)) {
      throw new Error(`Invalid alphagram index size: ${alphagramIndexSize}`);
    }

    console.log('Reading alphagram index, size:', alphagramIndexSize);

    for (let i = 0; i < alphagramIndexSize; i++) {
      const alphagramLength = view.getUint16(offset);
      offset += 2;
      
      if (alphagramLength > 100) {
        throw new Error(`Invalid alphagram length at index ${i}: ${alphagramLength}`);
      }
      
      const alphagramBuffer = new Uint8Array(buffer, offset, alphagramLength);
      const alphagram = decoder.decode(alphagramBuffer);
      offset += alphagramLength;
      
      const indicesCount = view.getUint32(offset);
      offset += 4;
      
      if (indicesCount > header.wordCount) {
        throw new Error(`Invalid indices count for alphagram ${alphagram}: ${indicesCount}`);
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
  } catch (error) {
    console.error('Error deserializing dictionary:', error);
    throw error;
  }
}