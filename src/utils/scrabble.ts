import { supabase } from "@/integrations/supabase/client";

export const isValidWord = async (word: string): Promise<boolean> => {
  if (!word.trim()) return false;
  
  const { data, error } = await supabase
    .from('FILE2')
    .select('PALABRA')
    .eq('PALABRA', word.toUpperCase())
    .maybeSingle();

  if (error) {
    console.error('Error checking word:', error);
    return false;
  }

  return data !== null;
};

export const countWords = async (): Promise<number> => {
  const { count, error } = await supabase
    .from('FILE2')
    .select('PALABRA', { count: 'exact' });

  if (error) {
    console.error('Error counting words:', error);
    return 0;
  }

  return count || 0;
};

// Add a quick console log to help us confirm the count
(async () => {
  const totalWords = await countWords();
  console.log(`Total words in the list: ${totalWords}`);
})();