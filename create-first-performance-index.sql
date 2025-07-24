-- =============================================================================
-- PERFORMANCE OPTIMIZATION #1: Scrabble Words Anagram Index
-- =============================================================================
-- Date: 2025-07-23
-- Purpose: Create critical composite index for anagram searches
-- Expected Impact: 70-90% faster anagram searches
-- Risk Level: LOW (Non-destructive, can rollback easily)

-- 1. PRE-OPTIMIZATION PERFORMANCE TEST
-- =============================================================================

-- Test current performance on anagram search (save these results!)
EXPLAIN ANALYZE 
SELECT word 
FROM scrabble_words 
WHERE length = 7 
AND alphagram = 'ACDNORS'  -- Example: ACONDRS -> CANDORS, DACRONS, etc
LIMIT 10;

-- 2. CHECK IF INDEX ALREADY EXISTS
-- =============================================================================

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'scrabble_words' 
            AND indexname = 'idx_scrabble_words_length_alphagram'
        ) THEN '⚠️  INDEX ALREADY EXISTS - Skip creation'
        ELSE '✅ READY TO CREATE INDEX'
    END as index_status;

-- 3. CREATE THE CRITICAL PERFORMANCE INDEX
-- =============================================================================

-- This is the most important index for anagram performance
-- It will dramatically speed up length + alphagram queries
CREATE INDEX CONCURRENTLY idx_scrabble_words_length_alphagram 
ON scrabble_words(length, alphagram);

-- CONCURRENTLY means:
-- ✅ No table locking during creation
-- ✅ App continues working normally
-- ✅ Safe for production use

-- 4. VERIFY INDEX CREATION
-- =============================================================================

-- Confirm the index was created successfully
SELECT 
    '✅ INDEX VERIFICATION' as status,
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename = 'scrabble_words' 
AND indexname = 'idx_scrabble_words_length_alphagram';

-- 5. POST-OPTIMIZATION PERFORMANCE TEST
-- =============================================================================

-- Test the same query again to measure improvement
EXPLAIN ANALYZE 
SELECT word 
FROM scrabble_words 
WHERE length = 7 
AND alphagram = 'ACDNORS'
LIMIT 10;

-- 6. INDEX USAGE ANALYSIS
-- =============================================================================

-- Check if PostgreSQL is using our new index
SELECT 
    '📊 INDEX USAGE STATS' as metric_type,
    schemaname,
    tablename, 
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE tablename = 'scrabble_words'
AND indexname = 'idx_scrabble_words_length_alphagram';

-- 7. TABLE STATISTICS UPDATE
-- =============================================================================

-- Update table statistics for optimal query planning
ANALYZE scrabble_words;

-- 8. SUCCESS CONFIRMATION
-- =============================================================================

SELECT 
    '🎯 OPTIMIZATION #1 COMPLETED' as status,
    'scrabble_words(length, alphagram) index created' as optimization,
    'Expected: 70-90% faster anagram searches' as expected_impact,
    NOW() as completed_at;

-- =============================================================================
-- ROLLBACK PROCEDURE (if needed)
-- =============================================================================
-- If anything goes wrong, execute this:
-- DROP INDEX CONCURRENTLY IF EXISTS idx_scrabble_words_length_alphagram;

-- =============================================================================
-- IMPORTANT NOTES:
-- 1. Compare execution times from before/after EXPLAIN ANALYZE
-- 2. Index creation may take 30-120 seconds depending on table size
-- 3. CONCURRENTLY means zero downtime for your app
-- 4. This index will dramatically improve anagram search performance
-- =============================================================================