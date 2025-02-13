
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const INITIAL_BATCH_SIZE = 5000;
const MAX_BATCH_SIZE = 10000;
const MIN_BATCH_SIZE = 1000;
const MAX_RETRIES = 5;
const MAX_PARALLEL_REQUESTS = 3;

export const fetchAllWords = async (
  expectedCount: number,
  onProgress: (progress: number) => void
) => {
  let allWords: string[] = [];
  let lastWord: string | null = null;
  let retryCount = 0;
  let lastProgress = 0;
  let batchSize = INITIAL_BATCH_SIZE;
  let consecutiveSuccesses = 0;
  
  const inFlightRequests: Promise<string[]>[] = [];
  const processedWords = new Set<string>();

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const adjustBatchSize = (success: boolean, latency: number) => {
    if (success) {
      consecutiveSuccesses++;
      if (latency < 1000 && consecutiveSuccesses > 2) {
        batchSize = Math.min(batchSize * 1.5, MAX_BATCH_SIZE);
        console.log(`Increased batch size to ${batchSize}`);
      }
    } else {
      consecutiveSuccesses = 0;
      batchSize = Math.max(batchSize / 2, MIN_BATCH_SIZE);
      console.log(`Reduced batch size to ${batchSize}`);
    }
  };

  const fetchBatch = async (startWord: string): Promise<string[]> => {
    const startTime = Date.now();
    try {
      const { data, error } = await supabase
        .from('words')
        .select('word')
        .gt('word', startWord)
        .order('word')
        .limit(Math.floor(batchSize));

      if (error) throw error;

      const latency = Date.now() - startTime;
      adjustBatchSize(true, latency);

      return data?.map(w => w.word) || [];
    } catch (error) {
      console.error('Batch fetch error:', error);
      adjustBatchSize(false, 0);
      throw error;
    }
  };

  const fetchBatchWithRetry = async (startWord: string): Promise<string[]> => {
    let currentRetry = 0;
    
    while (currentRetry < MAX_RETRIES) {
      try {
        return await fetchBatch(startWord);
      } catch (error) {
        currentRetry++;
        if (currentRetry >= MAX_RETRIES) throw error;
        
        const backoffDelay = Math.min(1000 * Math.pow(2, currentRetry), 10000);
        console.log(`Retry ${currentRetry}/${MAX_RETRIES} after ${backoffDelay}ms`);
        await delay(backoffDelay);
      }
    }
    
    throw new Error('Max retries exceeded');
  };

  try {
    let hasMore = true;
    
    while (hasMore) {
      // Mantener MAX_PARALLEL_REQUESTS solicitudes en vuelo
      while (inFlightRequests.length < MAX_PARALLEL_REQUESTS && hasMore) {
        const request = fetchBatchWithRetry(lastWord || '')
          .then(words => {
            if (words.length > 0) {
              lastWord = words[words.length - 1];
              return words;
            }
            hasMore = false;
            return [];
          });
          
        inFlightRequests.push(request);
      }

      // Esperar a que termine al menos una solicitud
      const completedBatch = await Promise.race(inFlightRequests);
      const index = inFlightRequests.findIndex(p => p.then(() => completedBatch));
      if (index !== -1) {
        inFlightRequests.splice(index, 1);
      }

      // Procesar las palabras recibidas
      for (const word of completedBatch) {
        if (!processedWords.has(word)) {
          processedWords.add(word);
          allWords.push(word);
        }
      }

      // Actualizar progreso
      const currentProgress = Math.floor((allWords.length / expectedCount) * 100);
      if (currentProgress > lastProgress) {
        lastProgress = currentProgress;
        onProgress(currentProgress);
        console.log(`Loading progress: ${currentProgress}% (${allWords.length}/${expectedCount} words)`);
      }

      // Verificar si hemos terminado
      if (allWords.length >= expectedCount || completedBatch.length === 0) {
        hasMore = false;
      }
    }

    // Esperar las solicitudes pendientes
    if (inFlightRequests.length > 0) {
      const remainingBatches = await Promise.all(inFlightRequests);
      for (const batch of remainingBatches) {
        for (const word of batch) {
          if (!processedWords.has(word)) {
            processedWords.add(word);
            allWords.push(word);
          }
        }
      }
    }

    console.log(`Final word count: ${allWords.length}, Expected: ${expectedCount}`);
    
    if (allWords.length < expectedCount) {
      throw new Error(`Incomplete dictionary: got ${allWords.length} words, expected ${expectedCount}`);
    }

    return allWords;
    
  } catch (error) {
    console.error('Error fetching words:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to fetch dictionary');
    throw error;
  }
};
