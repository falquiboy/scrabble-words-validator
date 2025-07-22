-- MISION 1: Agregar columna norm_word con normalizaciones Scrabble
-- Migration: add_norm_word_column_to_lexicon_indexes
-- Description: Adds norm_word column to lexicon_indexes table with Scrabble normalizations
-- Date: 2025-07-15
-- Author: Claude Code Assistant

-- Add norm_word column to lexicon_indexes table
ALTER TABLE public.lexicon_indexes 
ADD COLUMN IF NOT EXISTS norm_word TEXT;

-- Create index for performance optimization
CREATE INDEX IF NOT EXISTS idx_lexicon_norm_word 
ON public.lexicon_indexes(norm_word);

-- Update norm_word column with Scrabble normalizations
-- CH -> C, LL -> K, RR -> W (letters not used in Spanish Scrabble)
UPDATE public.lexicon_indexes 
SET norm_word = REPLACE(REPLACE(REPLACE(
  UPPER(non_diac_word), 
  'CH', 'C'), 
  'LL', 'K'), 
  'RR', 'W')
WHERE norm_word IS NULL OR norm_word = '';

-- Add comment to document the column purpose
COMMENT ON COLUMN public.lexicon_indexes.norm_word IS 
'Normalized word for Scrabble validation. CH->C, LL->K, RR->W transformations applied to non_diac_word';