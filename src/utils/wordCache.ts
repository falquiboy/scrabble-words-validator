import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = 'scrabble_words';
const CACHE_VERSION_KEY = 'scrabble_words_version';
const CURRENT_VERSION = '1';

export const initializeWordCache = async () => {
  try {
    // First check if we can connect to Supabase
    const { data, error } = await supabase.from('FILE2').select('PALABRA').limit(1);
    if (error) throw error;

    const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    if (cachedVersion !== CURRENT_VERSION) {
      console.log('Initializing word cache...');
      const { data: words, error: fetchError } = await supabase
        .from('FILE2')
        .select('PALABRA');
      
      if (fetchError) throw fetchError;
      
      const wordList = words.map(w => w.PALABRA);
      localStorage.setItem(CACHE_KEY, JSON.stringify(wordList));
      localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
      console.log('Word cache initialized with', wordList.length, 'words');
    }
    return true;
  } catch (error) {
    console.error('Error initializing cache:', error);
    return false;
  }
};

export const getWordFromCache = (word: string): boolean => {
  const cachedWords = localStorage.getItem(CACHE_KEY);
  if (!cachedWords) return false;
  
  const wordList = JSON.parse(cachedWords);
  return wordList.includes(word.toUpperCase());
};

export const isCacheInitialized = (): boolean => {
  const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
  const cachedWords = localStorage.getItem(CACHE_KEY);
  return cachedVersion === CURRENT_VERSION && !!cachedWords;
};