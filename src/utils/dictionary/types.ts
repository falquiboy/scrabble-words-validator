export interface DictionaryHeader {
  magic: string; // "DICT"
  version: number; // 1
  wordCount: number;
  maxWordLength: number;
}

export interface Word {
  word: string;
  alphagram: string;
  length: number;
}

export interface DictionaryData {
  header: DictionaryHeader;
  words: Word[];
  lengthIndex: Map<number, number[]>;
  alphagramIndex: Map<string, number[]>;
}