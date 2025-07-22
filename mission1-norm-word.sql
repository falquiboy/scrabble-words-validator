-- 🎯 MISIÓN 1: Agregar columna norm_word con normalizaciones Scrabble
-- Ejecutar via: npx supabase db reset --linked --debug

-- Paso 1: Agregar columna norm_word
ALTER TABLE public.lexicon_indexes 
ADD COLUMN IF NOT EXISTS norm_word TEXT;

-- Paso 2: Aplicar normalizaciones Scrabble (CH→Ç, LL→K, RR→W)
UPDATE public.lexicon_indexes 
SET norm_word = REPLACE(REPLACE(REPLACE(
  UPPER(non_diac_word), 
  'CH', 'Ç'), 
  'LL', 'K'), 
  'RR', 'W')
WHERE norm_word IS NULL OR norm_word = '';

-- Paso 3: Crear índice para optimización
CREATE INDEX IF NOT EXISTS idx_lexicon_norm_word 
ON public.lexicon_indexes(norm_word);

-- Paso 4: Verificar resultados
SELECT 
  non_diac_word, 
  norm_word,
  CASE 
    WHEN non_diac_word != norm_word THEN '✅ Normalizado'
    ELSE '➖ Sin cambios'
  END as status
FROM public.lexicon_indexes 
WHERE non_diac_word ILIKE '%ch%' 
   OR non_diac_word ILIKE '%ll%' 
   OR non_diac_word ILIKE '%rr%'
LIMIT 10;