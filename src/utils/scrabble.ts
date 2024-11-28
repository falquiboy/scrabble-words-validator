import { supabase } from "@/integrations/supabase/client";

// Spanish Scrabble letter values
const letterValues: { [key: string]: number } = {
  'A': 1, 'E': 1, 'O': 1, 'I': 1, 'S': 1, 'N': 1, 'L': 1, 'R': 1, 'U': 1, 'T': 1,
  'D': 2, 'G': 2,
  'C': 3, 'B': 3, 'M': 3, 'P': 3,
  'H': 4, 'F': 4, 'V': 4, 'Y': 4,
  'Q': 5,
  'J': 8, 'Ñ': 8,
  'X': 10,
  'Z': 10
};

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

export const calculateWordScore = (word: string): number => {
  return word
    .toUpperCase()
    .split('')
    .reduce((score, letter) => score + (letterValues[letter] || 0), 0);
};