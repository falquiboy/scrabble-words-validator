-- =============================================================================
-- PERFORMANCE BASELINE TESTING - Run AFTER backup creation
-- =============================================================================
-- Date: 2025-07-23
-- Purpose: Establish performance baselines before optimization
-- Author: Claude Code Assistant

-- Enable timing for all queries
\timing on

-- =============================================================================
-- CRITICAL QUERY PERFORMANCE TESTS
-- =============================================================================

-- Test 1: Anagram Search Performance (Most Critical)
-- This tests the core anagram functionality
SELECT 'Test 1: Anagram Search (7 letters)' as test_name;
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT non_diac_word, norm_word, norm_alph
FROM lexicon_indexes 
WHERE norm_length = 7 
AND norm_alph = (
    SELECT spanish_alphabetical_sort('AERTOIL') 
    LIMIT 1
)
LIMIT 100;

-- Test 2: Word Validation Performance
SELECT 'Test 2: Word Validation' as test_name;
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*) 
FROM lexicon_indexes 
WHERE norm_word = 'CASA';

-- Test 3: Dictionary Lookup Performance
SELECT 'Test 3: Dictionary Lookup' as test_name;
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT de.lemma, ds.definition, ds.sense_number
FROM dictionary_entries de
JOIN dictionary_senses ds ON de.entry_id = ds.entry_id
WHERE de.lemma = 'casa'
ORDER BY ds.sense_number;

-- Test 4: Word-Dictionary Relation Lookup
SELECT 'Test 4: Word-Dictionary Relations' as test_name;
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT w.word, de.lemma, ds.definition
FROM word_dictionary_relations w
JOIN dictionary_entries de ON w.entry_id = de.entry_id
JOIN dictionary_senses ds ON de.entry_id = ds.entry_id
WHERE UPPER(w.word) = 'CASAS'
LIMIT 10;

-- Test 5: Full-Text Search in Definitions
SELECT 'Test 5: Full-Text Search' as test_name;
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT ds.definition, de.lemma, ds.sense_number
FROM dictionary_senses ds
JOIN dictionary_entries de ON ds.entry_id = de.entry_id
WHERE to_tsvector('spanish', ds.definition) @@ plainto_tsquery('spanish', 'casa')
LIMIT 20;

-- Test 6: Anagram Search with Pattern Matching
SELECT 'Test 6: Pattern-based Anagram Search' as test_name;
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT non_diac_word, norm_word
FROM lexicon_indexes 
WHERE norm_length BETWEEN 5 AND 8
AND norm_word ~ '^[AEIOU].*[RSLTN]$'
LIMIT 50;

-- Test 7: Large Result Set Query (worst case)
SELECT 'Test 7: Large Result Set' as test_name;
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT non_diac_word, norm_word, norm_length
FROM lexicon_indexes 
WHERE norm_length = 5
ORDER BY non_diac_word
LIMIT 1000;

-- =============================================================================
-- INDEX USAGE ANALYSIS
-- =============================================================================

-- Check current index usage statistics
SELECT 'INDEX USAGE STATISTICS' as analysis_type;

SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename IN ('lexicon_indexes', 'dictionary_entries', 'dictionary_senses', 'word_dictionary_relations')
ORDER BY tablename, times_used DESC;

-- =============================================================================
-- TABLE SCAN ANALYSIS
-- =============================================================================

-- Check table scan statistics
SELECT 'TABLE SCAN STATISTICS' as analysis_type;

SELECT 
    schemaname,
    tablename,
    seq_scan as sequential_scans,
    seq_tup_read as seq_tuples_read,
    idx_scan as index_scans,
    idx_tup_fetch as idx_tuples_fetched,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND tablename IN ('lexicon_indexes', 'dictionary_entries', 'dictionary_senses', 'word_dictionary_relations')
ORDER BY tablename;

-- =============================================================================
-- QUERY COMPLEXITY TESTS
-- =============================================================================

-- Test 8: Complex Join Performance
SELECT 'Test 8: Complex Multi-table Join' as test_name;
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    li.non_diac_word as scrabble_word,
    de.lemma,
    ds.definition,
    ds.pos_code,
    COUNT(*) OVER (PARTITION BY de.lemma) as sense_count
FROM lexicon_indexes li
JOIN word_dictionary_relations wdr ON UPPER(wdr.word) = UPPER(li.non_diac_word)
JOIN dictionary_entries de ON wdr.entry_id = de.entry_id
JOIN dictionary_senses ds ON de.entry_id = ds.entry_id
WHERE li.norm_length = 6
LIMIT 100;

-- Test 9: Aggregation Performance
SELECT 'Test 9: Aggregation Query' as test_name;
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT 
    norm_length,
    COUNT(*) as word_count,
    MIN(non_diac_word) as first_word,
    MAX(non_diac_word) as last_word
FROM lexicon_indexes
GROUP BY norm_length
ORDER BY norm_length;

-- Test 10: Subquery Performance
SELECT 'Test 10: Subquery with IN clause' as test_name;
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT non_diac_word, norm_word
FROM lexicon_indexes
WHERE key_lemma IN (
    SELECT key_value 
    FROM dictionary_entries 
    WHERE lemma LIKE 'cas%'
)
LIMIT 50;

-- =============================================================================
-- CURRENT DATABASE SIZE ANALYSIS
-- =============================================================================

-- Detailed size breakdown
SELECT 'DATABASE SIZE ANALYSIS' as analysis_type;

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = schemaname AND table_name = tablename) as column_count
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('lexicon_indexes', 'dictionary_entries', 'dictionary_senses', 'word_dictionary_relations')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =============================================================================
-- COMPLETION SUMMARY
-- =============================================================================

SELECT 
    '🎯 PERFORMANCE BASELINE COMPLETED' as status,
    NOW() as completion_time,
    'Review query plans and timing before optimization' as next_step;

-- =============================================================================
-- INSTRUCTIONS FOR USE:
-- 1. Run this script in Supabase SQL Editor
-- 2. Save all execution times and query plans
-- 3. Compare these results after each optimization
-- 4. Focus on queries that show the highest execution times
-- 5. Monitor index usage patterns for optimization opportunities
-- =============================================================================

-- Disable timing
\timing off