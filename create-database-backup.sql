-- =============================================================================
-- DATABASE BACKUP SCRIPT - Execute BEFORE any optimizations
-- =============================================================================
-- Date: 2025-07-23
-- Purpose: Create complete backup of database state before optimizations
-- Author: Claude Code Assistant

-- 1. CREATE BACKUP TABLES FOR CRITICAL DATA
-- =============================================================================

-- Backup critical tables identified by user
DROP TABLE IF EXISTS dictionary_entries_backup_20250723;
CREATE TABLE dictionary_entries_backup_20250723 AS 
SELECT * FROM dictionary_entries;

DROP TABLE IF EXISTS dictionary_senses_backup_20250723;
CREATE TABLE dictionary_senses_backup_20250723 AS
SELECT * FROM dictionary_senses;

DROP TABLE IF EXISTS hooks_backup_20250723;
CREATE TABLE hooks_backup_20250723 AS
SELECT * FROM hooks;

DROP TABLE IF EXISTS leaves_backup_20250723;
CREATE TABLE leaves_backup_20250723 AS
SELECT * FROM leaves;

DROP TABLE IF EXISTS lemmas_info_backup_20250723;
CREATE TABLE lemmas_info_backup_20250723 AS
SELECT * FROM lemmas_info;

DROP TABLE IF EXISTS lexicon_keys_backup_20250723;
CREATE TABLE lexicon_keys_backup_20250723 AS 
SELECT * FROM lexicon_keys;

DROP TABLE IF EXISTS scrabble_words_backup_20250723;
CREATE TABLE scrabble_words_backup_20250723 AS
SELECT * FROM scrabble_words;

DROP TABLE IF EXISTS verb_entries_backup_20250723;
CREATE TABLE verb_entries_backup_20250723 AS
SELECT * FROM verb_entries;

DROP TABLE IF EXISTS verb_senses_backup_20250723;
CREATE TABLE verb_senses_backup_20250723 AS
SELECT * FROM verb_senses;

-- 2. DOCUMENT CURRENT TABLE STATISTICS
-- =============================================================================

-- Create table to store pre-optimization statistics
DROP TABLE IF EXISTS pre_optimization_stats;
CREATE TABLE pre_optimization_stats (
    table_name TEXT,
    row_count BIGINT,
    table_size_bytes BIGINT,
    table_size_pretty TEXT,
    backup_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Insert current statistics for all critical tables
INSERT INTO pre_optimization_stats (table_name, row_count, table_size_bytes, table_size_pretty)
SELECT 
    'dictionary_entries',
    (SELECT COUNT(*) FROM dictionary_entries),
    pg_total_relation_size('dictionary_entries'),
    pg_size_pretty(pg_total_relation_size('dictionary_entries'))
UNION ALL
SELECT 
    'dictionary_senses',
    (SELECT COUNT(*) FROM dictionary_senses),
    pg_total_relation_size('dictionary_senses'),
    pg_size_pretty(pg_total_relation_size('dictionary_senses'))
UNION ALL
SELECT 
    'hooks',
    (SELECT COUNT(*) FROM hooks),
    pg_total_relation_size('hooks'),
    pg_size_pretty(pg_total_relation_size('hooks'))
UNION ALL
SELECT 
    'leaves',
    (SELECT COUNT(*) FROM leaves),
    pg_total_relation_size('leaves'),
    pg_size_pretty(pg_total_relation_size('leaves'))
UNION ALL
SELECT 
    'lemmas_info',
    (SELECT COUNT(*) FROM lemmas_info),
    pg_total_relation_size('lemmas_info'),
    pg_size_pretty(pg_total_relation_size('lemmas_info'))
UNION ALL
SELECT 
    'lexicon_keys',
    (SELECT COUNT(*) FROM lexicon_keys),
    pg_total_relation_size('lexicon_keys'),
    pg_size_pretty(pg_total_relation_size('lexicon_keys'))
UNION ALL
SELECT 
    'scrabble_words',
    (SELECT COUNT(*) FROM scrabble_words),
    pg_total_relation_size('scrabble_words'),
    pg_size_pretty(pg_total_relation_size('scrabble_words'))
UNION ALL
SELECT 
    'verb_entries',
    (SELECT COUNT(*) FROM verb_entries),
    pg_total_relation_size('verb_entries'),
    pg_size_pretty(pg_total_relation_size('verb_entries'))
UNION ALL
SELECT 
    'verb_senses',
    (SELECT COUNT(*) FROM verb_senses),
    pg_total_relation_size('verb_senses'),
    pg_size_pretty(pg_total_relation_size('verb_senses'));

-- 3. DOCUMENT ALL CURRENT INDEXES
-- =============================================================================

-- Create table to store index definitions
DROP TABLE IF EXISTS pre_optimization_indexes;
CREATE TABLE pre_optimization_indexes (
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    index_definition TEXT,
    backup_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all current index definitions
INSERT INTO pre_optimization_indexes (schema_name, table_name, index_name, index_definition)
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
    'dictionary_entries', 
    'dictionary_senses', 
    'hooks',
    'leaves',
    'lemmas_info',
    'lexicon_keys',
    'scrabble_words',
    'verb_entries',
    'verb_senses'
)
ORDER BY tablename, indexname;

-- 4. CREATE PERFORMANCE BASELINE
-- =============================================================================

-- Create table to store query performance baselines
DROP TABLE IF EXISTS performance_baselines;
CREATE TABLE performance_baselines (
    test_name TEXT,
    query_description TEXT,
    execution_time_ms REAL,
    rows_returned BIGINT,
    query_plan TEXT,
    backup_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Performance tests will be run separately due to EXPLAIN ANALYZE requirements

-- 5. VERIFICATION QUERIES
-- =============================================================================

-- Verify backup table creation and row counts
SELECT 
    'BACKUP VERIFICATION' as test_type,
    original.table_name,
    original.row_count as original_rows,
    backup.row_count as backup_rows,
    CASE 
        WHEN original.row_count = backup.row_count THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as status
FROM (
    SELECT 'dictionary_entries' as table_name, COUNT(*) as row_count FROM dictionary_entries
    UNION ALL  
    SELECT 'dictionary_senses', COUNT(*) FROM dictionary_senses
    UNION ALL
    SELECT 'hooks', COUNT(*) FROM hooks
    UNION ALL
    SELECT 'leaves', COUNT(*) FROM leaves
    UNION ALL
    SELECT 'lemmas_info', COUNT(*) FROM lemmas_info
    UNION ALL
    SELECT 'lexicon_keys', COUNT(*) FROM lexicon_keys
    UNION ALL
    SELECT 'scrabble_words', COUNT(*) FROM scrabble_words
    UNION ALL
    SELECT 'verb_entries', COUNT(*) FROM verb_entries
    UNION ALL
    SELECT 'verb_senses', COUNT(*) FROM verb_senses
) original
JOIN (
    SELECT 'dictionary_entries' as table_name, COUNT(*) as row_count FROM dictionary_entries_backup_20250723
    UNION ALL
    SELECT 'dictionary_senses', COUNT(*) FROM dictionary_senses_backup_20250723  
    UNION ALL
    SELECT 'hooks', COUNT(*) FROM hooks_backup_20250723
    UNION ALL
    SELECT 'leaves', COUNT(*) FROM leaves_backup_20250723
    UNION ALL
    SELECT 'lemmas_info', COUNT(*) FROM lemmas_info_backup_20250723
    UNION ALL
    SELECT 'lexicon_keys', COUNT(*) FROM lexicon_keys_backup_20250723
    UNION ALL
    SELECT 'scrabble_words', COUNT(*) FROM scrabble_words_backup_20250723
    UNION ALL
    SELECT 'verb_entries', COUNT(*) FROM verb_entries_backup_20250723
    UNION ALL
    SELECT 'verb_senses', COUNT(*) FROM verb_senses_backup_20250723
) backup ON original.table_name = backup.table_name
ORDER BY original.table_name;

-- Display current statistics
SELECT 
    'CURRENT DATABASE STATE' as summary,
    table_name,
    row_count,
    table_size_pretty,
    backup_timestamp
FROM pre_optimization_stats
ORDER BY table_size_bytes DESC;

-- Display index count
SELECT 
    'INDEX DOCUMENTATION' as summary,
    COUNT(*) as total_indexes_documented,
    MIN(backup_timestamp) as documented_at
FROM pre_optimization_indexes;

-- =============================================================================
-- BACKUP COMPLETION CONFIRMATION
-- =============================================================================

SELECT 
    '🎯 BACKUP COMPLETED SUCCESSFULLY' as status,
    NOW() as completion_time,
    'Ready for optimization phase' as next_step;

-- =============================================================================
-- IMPORTANT NOTES:
-- 1. Run performance baseline tests separately (see performance-baseline.sql)
-- 2. Verify all backup tables have correct row counts
-- 3. Keep this backup for at least 7 days after optimization completion
-- 4. Test rollback procedures on development environment first
-- =============================================================================