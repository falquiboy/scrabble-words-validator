
import { wordDB } from '@/services/WordDatabase';
import { Trie } from '@/utils/trie';

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
    // Store the word as-is in the trie, without processing digraphs
    const upperWord = word.toUpperCase();
    trie.insert(upperWord, upperWord);
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
