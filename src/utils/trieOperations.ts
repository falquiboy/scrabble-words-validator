import { sqliteDB } from '@/services/SQLiteWordDatabase';
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
  
  try {
    await sqliteDB.init();
    const serializedTrie = await sqliteDB.loadTrie();
    
    if (serializedTrie && serializedTrie.data) {
      console.log('Found serialized trie in SQLite, deserializing...');
      trie.deserialize(serializedTrie.data);
      return trie.getAllWords().length;
    }
  } catch (error) {
    console.warn('Failed to load trie from SQLite cache:', error);
  }
  
  return 0;
};

export const saveTrie = async (trie: Trie) => {
  console.log('Saving trie to cache...');
  const serializedTrie = trie.serialize();
  
  try {
    await sqliteDB.init();
    await sqliteDB.saveTrie({
      data: serializedTrie,
      wordCount: trie.getAllWords().length,
      timestamp: Date.now()
    });
    console.log('✅ Trie saved to SQLite cache');
  } catch (error) {
    console.error('❌ Failed to save trie to SQLite cache:', error);
  }
};