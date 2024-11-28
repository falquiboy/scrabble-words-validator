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