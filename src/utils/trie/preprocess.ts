import { preprocessDictionary } from './serialization';
import { wordDB } from '@/services/WordDatabase';

export async function generateBinaryDictionary(): Promise<ArrayBuffer> {
  console.log('Iniciando pre-procesamiento del diccionario...');
  const words = await wordDB.getAllWords();
  console.log(`Pre-procesando ${words.length} palabras...`);
  
  const startTime = performance.now();
  const binaryData = await preprocessDictionary(words);
  const endTime = performance.now();
  
  console.log(`Diccionario pre-procesado en ${((endTime - startTime) / 1000).toFixed(2)}s`);
  console.log(`Tamaño del binario: ${(binaryData.byteLength / 1024 / 1024).toFixed(2)}MB`);
  
  return binaryData;
}