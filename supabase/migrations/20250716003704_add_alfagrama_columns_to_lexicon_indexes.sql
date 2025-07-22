-- MISION 2: Agregar columnas de alfagrama para busqueda acelerada de anagramas
-- Migration: add_alfagrama_columns_to_lexicon_indexes
-- Description: Adds norm_alph and norm_length columns for Spanish anagram search optimization
-- Date: 2025-07-16
-- Author: Claude Code Assistant

-- Paso 1: Agregar columnas norm_alph y norm_length
ALTER TABLE public.lexicon_indexes 
ADD COLUMN IF NOT EXISTS norm_alph TEXT,
ADD COLUMN IF NOT EXISTS norm_length INTEGER;

-- Paso 2: Crear funcion para ordenar caracteres segun alfabeto espanol con digrafos
-- Orden: AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ (vocales primero, luego consonantes)
CREATE OR REPLACE FUNCTION spanish_alphabetical_sort(input_word TEXT)
RETURNS TEXT AS $$
DECLARE
    char_order TEXT := 'AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ';
    result TEXT := '';
    char_array TEXT[];
    i INTEGER;
    j INTEGER;
    current_char TEXT;
    temp_char TEXT;
BEGIN
    -- Convertir palabra a array de caracteres
    char_array := string_to_array(UPPER(input_word), NULL);
    
    -- Ordenamiento burbuja basado en posicion en char_order
    FOR i IN 1..array_length(char_array, 1) LOOP
        FOR j IN 1..array_length(char_array, 1) - 1 LOOP
            -- Obtener posiciones en el alfabeto espanol
            IF COALESCE(POSITION(char_array[j] IN char_order), 999) > COALESCE(POSITION(char_array[j + 1] IN char_order), 999) THEN
                -- Intercambiar caracteres
                temp_char := char_array[j];
                char_array[j] := char_array[j + 1];
                char_array[j + 1] := temp_char;
            END IF;
        END LOOP;
    END LOOP;
    
    -- Convertir array de vuelta a string
    result := array_to_string(char_array, '');
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Paso 3: Poblar columnas con alfagramas y longitudes
UPDATE public.lexicon_indexes 
SET 
    norm_alph = spanish_alphabetical_sort(norm_word),
    norm_length = LENGTH(norm_word)
WHERE norm_word IS NOT NULL;

-- Paso 4: Crear indices para optimizacion de busquedas
CREATE INDEX IF NOT EXISTS idx_lexicon_norm_length 
ON public.lexicon_indexes(norm_length);

CREATE INDEX IF NOT EXISTS idx_lexicon_norm_alph 
ON public.lexicon_indexes(norm_alph);

-- Indice compuesto para busquedas de anagramas (longitud + alfagrama)
CREATE INDEX IF NOT EXISTS idx_lexicon_length_alph 
ON public.lexicon_indexes(norm_length, norm_alph);

-- Paso 5: Agregar comentarios descriptivos
COMMENT ON COLUMN public.lexicon_indexes.norm_alph IS 
'Alphabetically sorted normalized word using Spanish alphabet order: AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ. Used for anagram searches.';

COMMENT ON COLUMN public.lexicon_indexes.norm_length IS 
'Length of normalized word. Used for fast filtering before anagram searches.';