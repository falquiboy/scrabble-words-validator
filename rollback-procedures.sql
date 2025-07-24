-- =============================================================================
-- ROLLBACK PROCEDURES - Use ONLY if optimizations fail
-- =============================================================================
-- Date: 2025-07-23
-- Purpose: Emergency rollback procedures for database optimization failures
-- Author: Claude Code Assistant

-- WARNING: These procedures will DESTROY current data and restore backups
-- Only use if optimization has caused critical issues

-- =============================================================================
-- PROCEDURE 1: COMPLETE TABLE ROLLBACK (NUCLEAR OPTION)
-- =============================================================================

-- Use this if entire table optimization failed
-- Replace TABLENAME with actual table name

/*
-- TEMPLATE FOR COMPLETE TABLE ROLLBACK:

BEGIN;

-- Step 1: Drop current table (DANGEROUS!)
DROP TABLE IF EXISTS {TABLE_NAME} CASCADE;

-- Step 2: Recreate from backup
CREATE TABLE {TABLE_NAME} AS 
SELECT * FROM {TABLE_NAME}_backup_20250723;

-- Step 3: Recreate indexes (see index recreation section below)
-- Step 4: Recreate constraints and triggers (see constraint recreation section)

COMMIT;
*/

-- =============================================================================
-- PROCEDURE 2: LEXICON_INDEXES ROLLBACK (MOST LIKELY NEEDED)
-- =============================================================================

-- Complete rollback of lexicon_indexes table
-- Use this if anagram optimization fails catastrophically

/*
BEGIN TRANSACTION;

-- Verify backup exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lexicon_indexes_backup_20250723') THEN
        RAISE EXCEPTION 'Backup table lexicon_indexes_backup_20250723 does not exist!';
    END IF;
END
$$;

-- Drop current table
DROP TABLE IF EXISTS lexicon_indexes CASCADE;

-- Recreate from backup
CREATE TABLE lexicon_indexes AS 
SELECT * FROM lexicon_indexes_backup_20250723;

-- Recreate original indexes
CREATE INDEX IF NOT EXISTS idx_lexicon_norm_word 
ON lexicon_indexes(norm_word);

CREATE INDEX IF NOT EXISTS idx_lexicon_norm_length 
ON lexicon_indexes(norm_length);

CREATE INDEX IF NOT EXISTS idx_lexicon_norm_alph 
ON lexicon_indexes(norm_alph);

CREATE INDEX IF NOT EXISTS idx_lexicon_length_alph 
ON lexicon_indexes(norm_length, norm_alph);

-- Verify rollback success
SELECT 'LEXICON_INDEXES ROLLBACK' as operation, COUNT(*) as restored_rows FROM lexicon_indexes;

COMMIT;
*/

-- =============================================================================
-- PROCEDURE 3: DICTIONARY TABLES ROLLBACK
-- =============================================================================

-- Rollback dictionary_entries
/*
BEGIN;

DROP TABLE IF EXISTS dictionary_entries CASCADE;
CREATE TABLE dictionary_entries AS 
SELECT * FROM dictionary_entries_backup_20250723;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_dictionary_entries_lemma 
ON dictionary_entries(lemma);

CREATE INDEX IF NOT EXISTS idx_dictionary_entries_key_value 
ON dictionary_entries(key_value);

-- Recreate primary key and constraints
ALTER TABLE dictionary_entries ADD CONSTRAINT dictionary_entries_pkey PRIMARY KEY (entry_id);
ALTER TABLE dictionary_entries ADD CONSTRAINT dictionary_entries_key_value_key UNIQUE (key_value);

COMMIT;
*/

-- Rollback dictionary_senses
/*
BEGIN;

DROP TABLE IF EXISTS dictionary_senses CASCADE;
CREATE TABLE dictionary_senses AS 
SELECT * FROM dictionary_senses_backup_20250723;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_dictionary_senses_entry_id 
ON dictionary_senses(entry_id);

CREATE INDEX IF NOT EXISTS idx_dictionary_senses_definition 
ON dictionary_senses USING gin(to_tsvector('spanish', definition));

-- Recreate constraints
ALTER TABLE dictionary_senses ADD CONSTRAINT dictionary_senses_pkey PRIMARY KEY (sense_id);
ALTER TABLE dictionary_senses ADD CONSTRAINT dictionary_senses_entry_id_fkey 
FOREIGN KEY (entry_id) REFERENCES dictionary_entries(entry_id) ON DELETE CASCADE;

COMMIT;
*/

-- =============================================================================
-- PROCEDURE 4: INDEX-ONLY ROLLBACK
-- =============================================================================

-- Use this if only indexes need to be rolled back
-- This is the safest option if data is intact

-- Drop all potentially problematic new indexes
/*
-- List indexes to drop based on your optimization
DROP INDEX IF EXISTS idx_new_optimization_1;
DROP INDEX IF EXISTS idx_new_optimization_2;
DROP INDEX IF EXISTS idx_new_composite_optimization;

-- Recreate original indexes from backup documentation
SELECT index_definition 
FROM pre_optimization_indexes 
WHERE table_name = 'lexicon_indexes'
ORDER BY index_name;

-- Execute each CREATE INDEX statement from the results above
*/

-- =============================================================================
-- PROCEDURE 5: CONSTRAINT RECREATION
-- =============================================================================

-- Primary keys recreation
/*
-- For dictionary_entries
ALTER TABLE dictionary_entries ADD CONSTRAINT dictionary_entries_pkey PRIMARY KEY (entry_id);

-- For dictionary_senses  
ALTER TABLE dictionary_senses ADD CONSTRAINT dictionary_senses_pkey PRIMARY KEY (sense_id);

-- For word_dictionary_relations
ALTER TABLE word_dictionary_relations ADD CONSTRAINT word_dictionary_relations_pkey PRIMARY KEY (relation_id);
*/

-- Foreign keys recreation
/*
-- dictionary_senses -> dictionary_entries
ALTER TABLE dictionary_senses ADD CONSTRAINT dictionary_senses_entry_id_fkey 
FOREIGN KEY (entry_id) REFERENCES dictionary_entries(entry_id) ON DELETE CASCADE;

-- word_dictionary_relations -> dictionary_entries
ALTER TABLE word_dictionary_relations ADD CONSTRAINT word_dictionary_relations_entry_id_fkey 
FOREIGN KEY (entry_id) REFERENCES dictionary_entries(entry_id) ON DELETE CASCADE;

-- dictionary_verbs -> dictionary_entries
ALTER TABLE dictionary_verbs ADD CONSTRAINT dictionary_verbs_entry_id_fkey 
FOREIGN KEY (entry_id) REFERENCES dictionary_entries(entry_id) ON DELETE CASCADE;
*/

-- Unique constraints recreation
/*
ALTER TABLE dictionary_entries ADD CONSTRAINT dictionary_entries_key_value_key UNIQUE (key_value);
ALTER TABLE dictionary_senses ADD CONSTRAINT dictionary_senses_entry_id_sense_number_key UNIQUE (entry_id, sense_number);
ALTER TABLE word_dictionary_relations ADD CONSTRAINT word_dictionary_relations_word_entry_id_relation_type_key UNIQUE (word, entry_id, relation_type);
*/

-- =============================================================================
-- PROCEDURE 6: FUNCTION AND TRIGGER RECREATION
-- =============================================================================

-- Recreate functions that might have been affected
/*
-- Spanish alphabetical sort function
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

-- Search definitions function
CREATE OR REPLACE FUNCTION search_definitions(search_text TEXT)
RETURNS TABLE(
    entry_id INTEGER,
    lemma TEXT,
    sense_number INTEGER,
    definition TEXT,
    rank REAL
) 
LANGUAGE SQL STABLE
AS $$
    SELECT 
        ds.entry_id,
        de.lemma,
        ds.sense_number,
        ds.definition,
        ts_rank(to_tsvector('spanish', ds.definition), plainto_tsquery('spanish', search_text)) as rank
    FROM dictionary_senses ds
    JOIN dictionary_entries de ON ds.entry_id = de.entry_id
    WHERE to_tsvector('spanish', ds.definition) @@ plainto_tsquery('spanish', search_text)
    ORDER BY rank DESC, de.lemma, ds.sense_number;
$$;

-- Get word definitions function
CREATE OR REPLACE FUNCTION get_word_definitions(scrabble_word TEXT)
RETURNS TABLE(
    lemma TEXT,
    sense_number INTEGER,
    definition TEXT,
    gender_code TEXT,
    pos_code TEXT,
    relation_type TEXT
) 
LANGUAGE SQL STABLE
AS $$
    SELECT 
        de.lemma,
        ds.sense_number,
        ds.definition,
        ds.gender_code,
        ds.pos_code,
        wdr.relation_type
    FROM word_dictionary_relations wdr
    JOIN dictionary_entries de ON wdr.entry_id = de.entry_id
    JOIN dictionary_senses ds ON de.entry_id = ds.entry_id
    WHERE UPPER(wdr.word) = UPPER(scrabble_word)
    ORDER BY de.lemma, ds.sense_number;
$$;
*/

-- =============================================================================
-- VERIFICATION PROCEDURES
-- =============================================================================

-- Verify rollback success
/*
-- Check row counts match backups
SELECT 
    'ROLLBACK VERIFICATION' as test_type,
    current_table.table_name,
    current_table.row_count as current_rows,
    backup_stats.row_count as expected_rows,
    CASE 
        WHEN current_table.row_count = backup_stats.row_count THEN '✅ SUCCESS'
        ELSE '❌ FAILED'
    END as rollback_status
FROM (
    SELECT 'lexicon_indexes' as table_name, COUNT(*) as row_count FROM lexicon_indexes
    UNION ALL
    SELECT 'dictionary_entries', COUNT(*) FROM dictionary_entries
    UNION ALL
    SELECT 'dictionary_senses', COUNT(*) FROM dictionary_senses
    UNION ALL
    SELECT 'word_dictionary_relations', COUNT(*) FROM word_dictionary_relations
) current_table
JOIN pre_optimization_stats backup_stats ON current_table.table_name = backup_stats.table_name
ORDER BY current_table.table_name;

-- Verify indexes exist
SELECT 
    'INDEX VERIFICATION' as test_type,
    COUNT(*) as indexes_recreated,
    'Check manually against pre_optimization_indexes table' as note
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('lexicon_indexes', 'dictionary_entries', 'dictionary_senses', 'word_dictionary_relations');

-- Test critical queries work
SELECT 'FUNCTIONALITY TEST' as test_type, COUNT(*) as anagram_test 
FROM lexicon_indexes WHERE norm_length = 5 LIMIT 1;
*/

-- =============================================================================
-- CLEANUP PROCEDURES (Run after successful rollback)
-- =============================================================================

-- Clean up backup tables (ONLY after confirming rollback success)
/*
DROP TABLE IF EXISTS lexicon_indexes_backup_20250723;
DROP TABLE IF EXISTS dictionary_entries_backup_20250723;
DROP TABLE IF EXISTS dictionary_senses_backup_20250723;
DROP TABLE IF EXISTS word_dictionary_relations_backup_20250723;
DROP TABLE IF EXISTS pre_optimization_stats;
DROP TABLE IF EXISTS pre_optimization_indexes;
DROP TABLE IF EXISTS performance_baselines;
*/

-- =============================================================================
-- EMERGENCY CONTACT INFORMATION
-- =============================================================================

/*
If rollback procedures fail:
1. Stop all application traffic immediately
2. Contact database administrator
3. Consider restoring from external backup
4. Document all errors encountered
5. Do not attempt further modifications without expert assistance
*/

SELECT 
    '⚠️  ROLLBACK PROCEDURES READY' as status,
    'Uncomment and modify procedures as needed' as instruction,
    'Test on development environment first!' as warning;