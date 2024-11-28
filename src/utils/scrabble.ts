import { supabase } from "@/integrations/supabase/client";
import { getWordFromCache, isCacheInitialized } from "./wordCache";

export const isValidWord = async (word: string): Promise<boolean> => {
  if (!word.trim()) return false;
  
  // If cache is initialized, use it for validation
  if (isCacheInitialized()) {
    return getWordFromCache(word);
  }
  
  // Fallback to online validation
  try {
    const { data, error } = await supabase
      .from('FILE2')
      .select('PALABRA')
      .eq('PALABRA', word.toUpperCase())
      .maybeSingle();

    if (error) throw error;
    return data !== null;
  } catch (error) {
    console.error('Error checking word:', error);
    throw error;
  }
};

export const countWords = async (): Promise<number> => {
  if (isCacheInitialized()) {
    const cachedWords = localStorage.getItem('scrabble_words');
    if (cachedWords) {
      return JSON.parse(cachedWords).length;
    }
  }

  const { count, error } = await supabase
    .from('FILE2')
    .select('PALABRA', { count: 'exact' });

  if (error) {
    console.error('Error counting words:', error);
    return 0;
  }

  return count || 0;
};