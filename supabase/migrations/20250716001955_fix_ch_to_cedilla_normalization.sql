-- FIX: Corregir CH -> C a CH -> Ç (cedilla)
-- Migration: fix_ch_to_cedilla_normalization  
-- Description: Fixes incorrect CH -> C normalization to proper CH -> Ç (cedilla)
-- Date: 2025-07-16
-- Author: Claude Code Assistant

-- Corregir la normalizacion de CH a cedilla (Ç)
-- CH debe ser Ç, no C comun, para Scrabble español
UPDATE public.lexicon_indexes 
SET norm_word = REPLACE(REPLACE(REPLACE(
  UPPER(non_diac_word), 
  'CH', 'Ç'),  -- Correcto: CH -> Ç (cedilla)
  'LL', 'K'), 
  'RR', 'W')
WHERE norm_word IS NOT NULL;

-- Actualizar comentario para reflejar la correccion
COMMENT ON COLUMN public.lexicon_indexes.norm_word IS 
'Normalized word for Scrabble validation. CH->Ç, LL->K, RR->W transformations applied to non_diac_word';