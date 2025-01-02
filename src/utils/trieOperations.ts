import { wordDB } from '@/services/WordDatabase';
import { Trie } from '@/utils/trie';
import { processDigraphs } from '@/utils/digraphs';

export const buildTrieFromWords = async (
  words: string[],
  trie: Trie,
  onProgress: (progress: number) => void
) => {
  let processed = 0;
  const totalWords = words.length;
  let lastProgress = 0;

  trie.clear();
  
  for (const word of words) {
    const processedWord = processDigraphs(word.toUpperCase());
    trie.insert(processedWord, word);
    processed++;
    
    const currentProgress = Math.floor((processed / totalWords) * 100);
    if (currentProgress > lastProgress) {
      lastProgress = currentProgress;
      onProgress(currentProgress);
      console.log(`Building trie progress: ${currentProgress}% (${processed}/${totalWords} words)`);
    }
  }

  return trie;
};

export const loadCachedTrie = async (trie: Trie) => {
  console.log('Checking for serialized trie...');
  const serializedTrie = await wordDB.loadTrie();
  
  if (serializedTrie) {
    console.log('Found serialized trie, deserializing...');
    trie.deserialize(serializedTrie);
    return trie.getAllWords().length;
  }
  
  return 0;
};

export const saveTrie = async (trie: Trie) => {
  console.log('Saving trie to cache...');
  const serializedTrie = trie.serialize();
  await wordDB.saveTrie(serializedTrie);
};