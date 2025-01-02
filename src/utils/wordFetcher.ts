import { supabase } from '@/integrations/supabase/client';

const BATCH_SIZE = 2000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const fetchAllWords = async (
  expectedCount: number,
  onProgress: (progress: number) => void
) => {
  let allWords: string[] = [];
  let lastWord: string | null = null;
  let retryCount = 0;
  let lastProgress = 0;

  while (true) {
    try {
      console.log(`Fetching batch after word: ${lastWord}`);
      const { data, error } = await supabase
        .from('words')
        .select('word')
        .gt('word', lastWord || '')
        .order('word')
        .limit(BATCH_SIZE);

      if (error) {
        console.error('Supabase fetch error:', error);
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          throw new Error(`Failed to fetch words after ${MAX_RETRIES} attempts: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        continue;
      }

      if (!data || data.length === 0) {
        console.log('No more words to fetch');
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

      // Add a small delay between batches to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (data.length < BATCH_SIZE) {
        console.log('Last batch received (smaller than batch size)');
        break;
      }
    } catch (error) {
      console.error('Error in batch fetch:', error);
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }

  // Validate final word count
  if (allWords.length < expectedCount) {
    console.error(`Incomplete dictionary: got ${allWords.length} words, expected ${expectedCount}`);
    throw new Error(`Incomplete dictionary: got ${allWords.length} words, expected ${expectedCount}`);
  }

  // Deduplicate words
  const uniqueWords = [...new Set(allWords)];
  console.log('Unique words after deduplication:', uniqueWords.length);
  
  return uniqueWords;
};