import { supabase } from '@/integrations/supabase/client';

const BATCH_SIZE = 500; // Reduced from 2000 to 500
const MAX_RETRIES = 5; // Increased from 3 to 5
const RETRY_DELAY = 2000; // Increased from 1000 to 2000

export const fetchAllWords = async (
  expectedCount: number,
  onProgress: (progress: number) => void
) => {
  let allWords: string[] = [];
  let lastWord: string | null = null;
  let retryCount = 0;
  let lastProgress = 0;
  let consecutiveSuccesses = 0;

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  while (true) {
    try {
      console.log(`Fetching batch after word: ${lastWord}, total words so far: ${allWords.length}`);
      
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
        
        const backoffDelay = RETRY_DELAY * Math.pow(2, retryCount - 1);
        console.log(`Retry ${retryCount}/${MAX_RETRIES} after ${backoffDelay}ms`);
        await delay(backoffDelay);
        continue;
      }

      if (!data || data.length === 0) {
        console.log('No more words to fetch');
        break;
      }

      // Reset retry count and increment success counter on successful fetch
      retryCount = 0;
      consecutiveSuccesses++;
      
      const batchWords = data.map(w => w.word.toUpperCase());
      allWords.push(...batchWords);
      lastWord = data[data.length - 1].word;
      
      const currentProgress = Math.floor((allWords.length / expectedCount) * 100);
      if (currentProgress > lastProgress) {
        lastProgress = currentProgress;
        onProgress(currentProgress);
        console.log(`Loading progress: ${currentProgress}% (${allWords.length}/${expectedCount} words)`);
      }

      // Adaptive delay based on consecutive successes
      const successDelay = Math.max(50, 200 - (consecutiveSuccesses * 10));
      await delay(successDelay);
      
      if (data.length < BATCH_SIZE) {
        console.log('Last batch received (smaller than batch size)');
        break;
      }
    } catch (error) {
      console.error('Error in batch fetch:', error);
      retryCount++;
      consecutiveSuccesses = 0;
      
      if (retryCount >= MAX_RETRIES) {
        throw error;
      }
      
      const backoffDelay = RETRY_DELAY * Math.pow(2, retryCount - 1);
      console.log(`Retry ${retryCount}/${MAX_RETRIES} after ${backoffDelay}ms`);
      await delay(backoffDelay);
    }
  }

  // Validate final word count with more detailed logging
  console.log(`Final word count: ${allWords.length}, Expected: ${expectedCount}`);
  if (allWords.length < expectedCount) {
    console.error(`Dictionary incomplete: ${allWords.length}/${expectedCount} words`);
    console.log('Last word fetched:', lastWord);
    throw new Error(`Incomplete dictionary: got ${allWords.length} words, expected ${expectedCount}`);
  }

  // Deduplicate words
  const uniqueWords = [...new Set(allWords)];
  console.log('Words after deduplication:', uniqueWords.length);
  
  return uniqueWords;
};