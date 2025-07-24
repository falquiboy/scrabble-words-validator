-- =============================================================================
-- PERFORMANCE ANALYSIS - Identify Critical Optimization Opportunities  
-- =============================================================================
-- Execute this in Supabase SQL Editor to identify the biggest bottlenecks

-- 1. ANALYZE CURRENT INDEXES ON CRITICAL TABLES
-- =============================================================================

SELECT 
    '🔍 CURRENT INDEXES ANALYSIS' as analysis_type,
    tablename,
    indexname,
    CASE 
        WHEN indexdef LIKE '%UNIQUE%' THEN '🔑 UNIQUE'
        WHEN indexdef LIKE '%gin%' THEN '🔎 FULL-TEXT' 
        WHEN indexdef LIKE '%btree%' THEN '🌳 BTREE'
        ELSE '❓ OTHER'
    END as index_type,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
    'dictionary_entries', 'dictionary_senses', 'hooks', 'leaves', 
    'lemmas_info', 'lexicon_keys', 'scrabble_words', 'verb_entries', 'verb_senses'
)
ORDER BY tablename, indexname;

-- 2. TABLE SIZE ANALYSIS - Identify largest tables needing optimization
-- =============================================================================

SELECT 
    '📊 TABLE SIZE ANALYSIS' as analysis_type,
    table_name,
    row_count,
    table_size_pretty,
    CASE 
        WHEN row_count > 100000 THEN '🔴 LARGE - High Priority for Indexing'
        WHEN row_count > 10000 THEN '🟡 MEDIUM - Medium Priority'
        ELSE '🟢 SMALL - Low Priority'
    END as optimization_priority
FROM pre_optimization_stats
ORDER BY table_size_bytes DESC;

-- 3. MISSING INDEXES ANALYSIS - Critical patterns we should optimize
-- =============================================================================

-- Check if scrabble_words has length+alphagram index (critical for anagram search)
SELECT 
    '🎯 CRITICAL INDEX CHECK: scrabble_words' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'scrabble_words' 
            AND (indexdef LIKE '%length%' AND indexdef LIKE '%alphagram%')
        ) THEN '✅ Length+Alphagram index EXISTS'
        ELSE '❌ MISSING - This will cause SLOW anagram searches!'
    END as status;

-- Check if leaves has optimized index on 'leave' column
SELECT 
    '🎯 CRITICAL INDEX CHECK: leaves' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'leaves' 
            AND indexdef LIKE '%leave%'
            AND indexname != 'leaves_pkey'
        ) THEN '✅ Leave column index EXISTS'
        ELSE '❌ MISSING - This will cause SLOW equity calculations!'
    END as status;

-- Check if hooks has any performance indexes
SELECT 
    '🎯 CRITICAL INDEX CHECK: hooks' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'hooks' 
            AND indexname != 'hooks_pkey'
        ) THEN '✅ Performance indexes EXIST on hooks'
        ELSE '❌ MISSING - Hooks table needs optimization (user reported slow)'
    END as status;

-- 4. QUERY PATTERN ANALYSIS - Identify most common access patterns
-- =============================================================================

-- Analyze table access patterns (this helps us understand which indexes to create)
SELECT 
    '📈 OPTIMIZATION RECOMMENDATIONS' as recommendation_type,
    'Priority 1: scrabble_words needs (length, alphagram) composite index' as recommendation
UNION ALL
SELECT 
    '📈 OPTIMIZATION RECOMMENDATIONS',
    'Priority 2: leaves needs optimized index on leave column'
UNION ALL
SELECT 
    '📈 OPTIMIZATION RECOMMENDATIONS',
    'Priority 3: hooks needs analysis for slow performance'
UNION ALL
SELECT 
    '📈 OPTIMIZATION RECOMMENDATIONS',
    'Priority 4: lexicon_keys may need text search optimization'
UNION ALL
SELECT 
    '📈 OPTIMIZATION RECOMMENDATIONS',
    'Priority 5: dictionary_* tables may benefit from composite indexes';

-- 5. SAFE INDEX CREATION PLAN
-- =============================================================================

SELECT 
    '🛡️ SAFE OPTIMIZATION PLAN' as plan_step,
    '1. Create scrabble_words(length, alphagram) - HIGHEST IMPACT' as action,
    'Low Risk - Composite index on existing columns' as risk_level
UNION ALL
SELECT 
    '🛡️ SAFE OPTIMIZATION PLAN',
    '2. Create leaves(leave) - HIGH IMPACT for equity calculations', 
    'Low Risk - Single column index'
UNION ALL
SELECT 
    '🛡️ SAFE OPTIMIZATION PLAN',
    '3. Analyze and optimize hooks table - MEDIUM IMPACT',
    'Medium Risk - Need to analyze schema first'
UNION ALL
SELECT 
    '🛡️ SAFE OPTIMIZATION PLAN',
    '4. Measure performance improvement after each step',
    'No Risk - Monitoring only'
UNION ALL
SELECT 
    '🛡️ SAFE OPTIMIZATION PLAN',
    '5. Can rollback any index with simple DROP INDEX command',
    'No Risk - Non-destructive operations';

-- =============================================================================
-- EXECUTION SUMMARY
-- =============================================================================

SELECT 
    '🚀 READY FOR OPTIMIZATION' as final_status,
    NOW() as analysis_completed_at,
    'Execute recommended indexes one by one' as next_action;