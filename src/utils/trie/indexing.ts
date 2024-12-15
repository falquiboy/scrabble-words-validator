import { LengthIndexedTrie } from './types';
import { generateAlphagram } from '../digraphs';

export const createLengthIndex = (words: string[]): LengthIndexedTrie => {
  const index: LengthIndexedTrie = {};
  
  for (const word of words) {
    const length = word.length;
    const alphagram = generateAlphagram(word);
    
    if (!index[length]) {
      index[length] = {};
    }
    
    if (!index[length][alphagram]) {
      index[length][alphagram] = [];
    }
    
    index[length][alphagram].push(word);
  }
  
  return index;
};

export const findWordsByLength = (index: LengthIndexedTrie, length: number): string[] => {
  if (!index[length]) return [];
  
  return Object.values(index[length]).flat();
};

export const findWordsByAlphagram = (index: LengthIndexedTrie, length: number, alphagram: string): string[] => {
  if (!index[length] || !index[length][alphagram]) return [];
  
  return index[length][alphagram];
};