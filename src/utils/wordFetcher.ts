import { supabase } from '@/integrations/supabase/client';

const BATCH_SIZE = 10000;
const MAX_RETRIES = 3;

export const fetchWordBatch = async (startAfter: string | null = null) => {
  let query = supabase
    .from('words')
    .select('word')
    .order('word')
    .limit(BATCH_SIZE);
    
  if (startAfter) {
    query = query.gt('word', startAfter);
  }
  
  return query;
};

export const fetchAllWords = async (
  expectedCount: number,
  onProgress: (progress: number) => void
) => {
  let allWords: string[] = [];
  let lastWord: string | null = null;
  let lastProgress = 0;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      const { data, error } = await fetchWordBatch(lastWord);
      
      if (error) {
        console.error('Supabase fetch error:', error);
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          throw new Error(`Failed to fetch words after ${MAX_RETRIES} attempts: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      if (!data || data.length === 0) {
        if (!lastWord) {
          throw new Error('No words found in database');
        }
        break;
      }

      // Reset retry count on successful fetch
      retryCount = 0;
      
      const batchWords = data.map(w => w.word.toUpperCase());
      allWords.push(...batchWords);
      lastWord = data[data.length - 1].word;
      
      const currentProgress = Math.floor((allWords.length / expectedCount) * 100);
      if (currentProgress > lastProgress) {
        lastProgress = currentProgress;
        onProgress(currentProgress);
        console.log(`Loading progress: ${currentProgress}% (${allWords.length}/${expectedCount} words)`);
      }
      
      if (data.length < BATCH_SIZE) {
        break;
      }
      
      // Add a small delay between batches to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error in batch fetch:', error);
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (allWords.length < expectedCount) {
    throw new Error(`Incomplete dictionary: got ${allWords.length} words, expected ${expectedCount}`);
  }

  // Deduplicate words
  const uniqueWords = [...new Set(allWords)];
  console.log('Unique words after deduplication:', uniqueWords.length);
  
  return uniqueWords;
};