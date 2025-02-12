
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BATCH_SIZE = 500;
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;
const INITIAL_DELAY = 100;

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

  const handleFetchError = async (error: any, status?: number) => {
    console.error('Error fetching words:', error, 'Status:', status);
    retryCount++;
    consecutiveSuccesses = 0;

    if (retryCount >= MAX_RETRIES) {
      toast.error(`Failed to fetch words after ${MAX_RETRIES} attempts`);
      throw new Error(`Failed to fetch words after ${MAX_RETRIES} attempts: ${error.message}`);
    }

    const backoffDelay = status === 429 
      ? RETRY_DELAY * Math.pow(2, retryCount)
      : RETRY_DELAY * Math.pow(1.5, retryCount - 1);

    console.log(`Retry ${retryCount}/${MAX_RETRIES} after ${backoffDelay}ms`);
    await delay(backoffDelay);
  };

  while (true) {
    try {
      // Add delay between requests to avoid rate limiting
      if (lastWord) {
        const requestDelay = Math.max(INITIAL_DELAY, 500 - (consecutiveSuccesses * 50));
        await delay(requestDelay);
      }

      console.log(`Fetching batch after word: ${lastWord}, total words so far: ${allWords.length}`);
      
      const { data, error, status } = await supabase
        .from('words')
        .select('word')
        .gt('word', lastWord || '')
        .order('word')
        .limit(BATCH_SIZE);

      if (error || !data) {
        await handleFetchError(error, status);
        continue;
      }

      if (data.length === 0) {
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

      if (data.length < BATCH_SIZE) {
        console.log('Last batch received (smaller than batch size)');
        break;
      }
    } catch (error) {
      await handleFetchError(error);
    }
  }

  // Validate final word count
  console.log(`Final word count: ${allWords.length}, Expected: ${expectedCount}`);
  if (allWords.length < expectedCount) {
    console.error(`Dictionary incomplete: ${allWords.length}/${expectedCount} words`);
    throw new Error(`Incomplete dictionary: got ${allWords.length} words, expected ${expectedCount}`);
  }

  // Deduplicate words
  const uniqueWords = [...new Set(allWords)];
  console.log('Words after deduplication:', uniqueWords.length);
  
  return uniqueWords;
};
