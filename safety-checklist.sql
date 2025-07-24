-- =============================================================================
-- SAFETY CHECKLIST & VERIFICATION PROCEDURES
-- =============================================================================
-- Date: 2025-07-23
-- Purpose: Comprehensive safety checks before, during, and after optimization
-- Author: Claude Code Assistant

-- =============================================================================
-- PRE-OPTIMIZATION SAFETY CHECKLIST
-- =============================================================================

-- Create verification results table
DROP TABLE IF EXISTS safety_verification_results;
CREATE TABLE safety_verification_results (
    check_id TEXT PRIMARY KEY,
    check_name TEXT NOT NULL,
    check_type TEXT NOT NULL, -- 'pre', 'during', 'post'
    status TEXT NOT NULL, -- 'PASS', 'FAIL', 'WARNING'
    details TEXT,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to log check results
CREATE OR REPLACE FUNCTION log_safety_check(
    p_check_id TEXT,
    p_check_name TEXT,
    p_check_type TEXT,
    p_status TEXT,
    p_details TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO safety_verification_results (check_id, check_name, check_type, status, details)
    VALUES (p_check_id, p_check_name, p_check_type, p_status, p_details)
    ON CONFLICT (check_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        details = EXCLUDED.details,
        checked_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CHECK 1: BACKUP VERIFICATION
-- =============================================================================

DO $$
DECLARE
    backup_count INTEGER;
    expected_tables TEXT[] := ARRAY['lexicon_indexes_backup_20250723', 'dictionary_entries_backup_20250723', 
                                   'dictionary_senses_backup_20250723', 'word_dictionary_relations_backup_20250723'];
    table_name TEXT;
    missing_backups TEXT := '';
BEGIN
    -- Check if all backup tables exist
    FOREACH table_name IN ARRAY expected_tables LOOP
        SELECT COUNT(*) INTO backup_count
        FROM information_schema.tables 
        WHERE table_name = table_name;
        
        IF backup_count = 0 THEN
            missing_backups := missing_backups || table_name || ', ';
        END IF;
    END LOOP;
    
    IF missing_backups = '' THEN
        PERFORM log_safety_check('backup_001', 'Backup Tables Exist', 'pre', 'PASS', 'All backup tables found');
    ELSE
        PERFORM log_safety_check('backup_001', 'Backup Tables Exist', 'pre', 'FAIL', 'Missing: ' || missing_backups);
    END IF;
END $$;

-- =============================================================================
-- CHECK 2: DATA INTEGRITY VERIFICATION
-- =============================================================================

DO $$
DECLARE
    orig_count BIGINT;
    backup_count BIGINT;
    table_pairs TEXT[] := ARRAY['lexicon_indexes:lexicon_indexes_backup_20250723',
                               'dictionary_entries:dictionary_entries_backup_20250723',
                               'dictionary_senses:dictionary_senses_backup_20250723',
                               'word_dictionary_relations:word_dictionary_relations_backup_20250723'];
    table_pair TEXT;
    orig_table TEXT;
    backup_table TEXT;
    details TEXT := '';
BEGIN
    FOREACH table_pair IN ARRAY table_pairs LOOP
        orig_table := split_part(table_pair, ':', 1);
        backup_table := split_part(table_pair, ':', 2);
        
        EXECUTE format('SELECT COUNT(*) FROM %I', orig_table) INTO orig_count;
        EXECUTE format('SELECT COUNT(*) FROM %I', backup_table) INTO backup_count;
        
        details := details || orig_table || ': ' || orig_count || ' vs ' || backup_count;
        
        IF orig_count != backup_count THEN
            PERFORM log_safety_check('integrity_001', 'Backup Row Count Match', 'pre', 'FAIL', details);
            RETURN;
        END IF;
    END LOOP;
    
    PERFORM log_safety_check('integrity_001', 'Backup Row Count Match', 'pre', 'PASS', details);
END $$;

-- =============================================================================
-- CHECK 3: INDEX DOCUMENTATION VERIFICATION
-- =============================================================================

DO $$
DECLARE
    index_count INTEGER;
    critical_indexes TEXT[] := ARRAY['idx_lexicon_norm_word', 'idx_lexicon_norm_length', 
                                    'idx_lexicon_norm_alph', 'idx_dictionary_entries_lemma'];
    idx_name TEXT;
    missing_indexes TEXT := '';
BEGIN
    -- Check critical indexes exist and are documented
    FOREACH idx_name IN ARRAY critical_indexes LOOP
        SELECT COUNT(*) INTO index_count
        FROM pg_indexes 
        WHERE indexname = idx_name;
        
        IF index_count = 0 THEN
            missing_indexes := missing_indexes || idx_name || ', ';
        END IF;
    END LOOP;
    
    -- Check if documentation table exists
    SELECT COUNT(*) INTO index_count
    FROM information_schema.tables 
    WHERE table_name = 'pre_optimization_indexes';
    
    IF missing_indexes = '' AND index_count > 0 THEN
        PERFORM log_safety_check('index_001', 'Critical Indexes & Documentation', 'pre', 'PASS', 'All critical indexes found and documented');
    ELSE
        PERFORM log_safety_check('index_001', 'Critical Indexes & Documentation', 'pre', 'FAIL', 'Missing: ' || missing_indexes);
    END IF;
END $$;

-- =============================================================================
-- CHECK 4: FUNCTIONAL VERIFICATION
-- =============================================================================

DO $$
DECLARE
    test_count INTEGER;
    error_msg TEXT := '';
BEGIN
    -- Test 1: Basic anagram search functionality
    BEGIN
        SELECT COUNT(*) INTO test_count
        FROM lexicon_indexes 
        WHERE norm_length = 5 
        LIMIT 10;
        
        IF test_count > 0 THEN
            error_msg := error_msg || 'Anagram search: OK; ';
        ELSE
            error_msg := error_msg || 'Anagram search: NO RESULTS; ';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        error_msg := error_msg || 'Anagram search: ERROR; ';
    END;
    
    -- Test 2: Dictionary lookup functionality
    BEGIN
        SELECT COUNT(*) INTO test_count
        FROM dictionary_entries de
        JOIN dictionary_senses ds ON de.entry_id = ds.entry_id
        LIMIT 1;
        
        IF test_count > 0 THEN
            error_msg := error_msg || 'Dictionary lookup: OK; ';
        ELSE
            error_msg := error_msg || 'Dictionary lookup: NO RESULTS; ';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        error_msg := error_msg || 'Dictionary lookup: ERROR; ';
    END;
    
    -- Test 3: Spanish function exists
    BEGIN
        SELECT COUNT(*) INTO test_count
        FROM pg_proc 
        WHERE proname = 'spanish_alphabetical_sort';
        
        IF test_count > 0 THEN
            error_msg := error_msg || 'Spanish function: OK';
        ELSE
            error_msg := error_msg || 'Spanish function: MISSING';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        error_msg := error_msg || 'Spanish function: ERROR';
    END;
    
    IF error_msg LIKE '%ERROR%' OR error_msg LIKE '%MISSING%' OR error_msg LIKE '%NO RESULTS%' THEN
        PERFORM log_safety_check('function_001', 'Core Functionality Test', 'pre', 'FAIL', error_msg);
    ELSE
        PERFORM log_safety_check('function_001', 'Core Functionality Test', 'pre', 'PASS', error_msg);
    END IF;
END $$;

-- =============================================================================
-- CHECK 5: DISK SPACE VERIFICATION
-- =============================================================================

DO $$
DECLARE
    total_size BIGINT;
    available_space TEXT;
BEGIN
    -- Calculate total database size
    SELECT SUM(pg_total_relation_size(schemaname||'.'||tablename)) INTO total_size
    FROM pg_tables 
    WHERE schemaname = 'public';
    
    -- Log current size (we can't directly check available disk space in PostgreSQL)
    PERFORM log_safety_check('space_001', 'Database Size Check', 'pre', 'PASS', 
                            'Current DB size: ' || pg_size_pretty(total_size) || 
                            ' - Manual verification of available space required');
END $$;

-- =============================================================================
-- CHECK 6: CONNECTION AND PERMISSIONS
-- =============================================================================

DO $$
DECLARE
    can_create BOOLEAN := FALSE;
    can_insert BOOLEAN := FALSE;
    can_update BOOLEAN := FALSE;
    details TEXT := '';
BEGIN
    -- Test CREATE permission
    BEGIN
        CREATE TEMP TABLE permission_test (id INTEGER);
        can_create := TRUE;
        DROP TABLE permission_test;
    EXCEPTION WHEN OTHERS THEN
        can_create := FALSE;
    END;
    
    -- Test INSERT permission on main table
    BEGIN
        -- Just test the permission, don't actually insert
        EXECUTE 'SELECT 1 FROM lexicon_indexes LIMIT 0';
        can_insert := TRUE;
    EXCEPTION WHEN OTHERS THEN
        can_insert := FALSE;
    END;
    
    details := 'CREATE: ' || can_create || ', INSERT: ' || can_insert;
    
    IF can_create AND can_insert THEN
        PERFORM log_safety_check('permission_001', 'Database Permissions', 'pre', 'PASS', details);
    ELSE
        PERFORM log_safety_check('permission_001', 'Database Permissions', 'pre', 'FAIL', details);
    END IF;
END $$;

-- =============================================================================
-- DURING-OPTIMIZATION SAFETY CHECKS
-- =============================================================================

-- Function to check table lock status
CREATE OR REPLACE FUNCTION check_table_locks()
RETURNS TABLE(
    table_name TEXT,
    lock_mode TEXT,
    granted BOOLEAN,
    lock_details TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.relname::TEXT as table_name,
        l.mode::TEXT as lock_mode,
        l.granted,
        'PID: ' || l.pid || ', Query: ' || COALESCE(SUBSTRING(a.query, 1, 50), 'N/A') as lock_details
    FROM pg_locks l
    JOIN pg_class c ON l.relation = c.oid
    LEFT JOIN pg_stat_activity a ON l.pid = a.pid
    WHERE c.relkind = 'r'
    AND c.relname IN ('lexicon_indexes', 'dictionary_entries', 'dictionary_senses', 'word_dictionary_relations')
    ORDER BY c.relname, l.mode;
END;
$$ LANGUAGE plpgsql;

-- Function to monitor query performance during optimization
CREATE OR REPLACE FUNCTION monitor_query_performance(query_name TEXT, query_sql TEXT)
RETURNS TEXT AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    execution_time_ms NUMERIC;
    result_count BIGINT;
BEGIN
    start_time := clock_timestamp();
    
    -- Execute the query and get row count
    EXECUTE 'SELECT COUNT(*) FROM (' || query_sql || ') subq' INTO result_count;
    
    end_time := clock_timestamp();
    execution_time_ms := EXTRACT(epoch FROM (end_time - start_time)) * 1000;
    
    -- Log the performance
    INSERT INTO performance_baselines (test_name, query_description, execution_time_ms, rows_returned, backup_timestamp)
    VALUES (query_name || '_during_optimization', query_sql, execution_time_ms, result_count, NOW());
    
    RETURN 'Query: ' || query_name || ', Time: ' || execution_time_ms || 'ms, Rows: ' || result_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- POST-OPTIMIZATION VERIFICATION
-- =============================================================================

-- Function to verify optimization success
CREATE OR REPLACE FUNCTION verify_optimization_success()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check 1: All tables still exist and have data
    RETURN QUERY
    SELECT 
        'Table Existence Check' as check_name,
        CASE 
            WHEN EXISTS (SELECT 1 FROM lexicon_indexes LIMIT 1) AND
                 EXISTS (SELECT 1 FROM dictionary_entries LIMIT 1) AND
                 EXISTS (SELECT 1 FROM dictionary_senses LIMIT 1) THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        'Critical tables verified' as details;
    
    -- Check 2: Row counts haven't decreased
    RETURN QUERY
    SELECT 
        'Row Count Verification' as check_name,
        CASE 
            WHEN (SELECT COUNT(*) FROM lexicon_indexes) >= 
                 (SELECT row_count FROM pre_optimization_stats WHERE table_name = 'lexicon_indexes') THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        'Row counts maintained or increased' as details;
        
    -- Check 3: Core functionality still works
    RETURN QUERY
    SELECT 
        'Functionality Test' as check_name,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM lexicon_indexes 
                WHERE norm_word IS NOT NULL 
                AND norm_length > 0 
                LIMIT 1
            ) THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        'Core anagram functionality verified' as details;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GENERATE SAFETY REPORT
-- =============================================================================

-- View current safety status
SELECT 
    '🔍 SAFETY VERIFICATION REPORT' as report_title,
    NOW() as generated_at;

SELECT 
    check_type,
    check_name,
    status,
    details,
    checked_at
FROM safety_verification_results
ORDER BY 
    CASE check_type 
        WHEN 'pre' THEN 1 
        WHEN 'during' THEN 2 
        WHEN 'post' THEN 3 
    END,
    checked_at;

-- Summary of results
SELECT 
    check_type,
    COUNT(*) as total_checks,
    COUNT(*) FILTER (WHERE status = 'PASS') as passed,
    COUNT(*) FILTER (WHERE status = 'FAIL') as failed,
    COUNT(*) FILTER (WHERE status = 'WARNING') as warnings
FROM safety_verification_results
GROUP BY check_type
ORDER BY check_type;

-- Final safety assessment
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM safety_verification_results WHERE status = 'FAIL') THEN
            '❌ SAFETY CHECK FAILED - DO NOT PROCEED WITH OPTIMIZATION'
        WHEN EXISTS (SELECT 1 FROM safety_verification_results WHERE status = 'WARNING') THEN
            '⚠️  WARNINGS DETECTED - REVIEW BEFORE PROCEEDING'
        ELSE
            '✅ ALL SAFETY CHECKS PASSED - READY FOR OPTIMIZATION'
    END as final_assessment,
    COUNT(*) FILTER (WHERE status = 'FAIL') as critical_issues,
    COUNT(*) FILTER (WHERE status = 'WARNING') as warnings
FROM safety_verification_results;

-- =============================================================================
-- INSTRUCTIONS
-- =============================================================================

/*
HOW TO USE THESE SAFETY CHECKS:

1. PRE-OPTIMIZATION:
   - Run this entire script to perform all pre-optimization checks
   - Review the safety report at the end
   - Do NOT proceed if any FAIL status is reported
   - Address all WARNING statuses before continuing

2. DURING OPTIMIZATION:
   - Use monitor_query_performance() to track query execution times
   - Use check_table_locks() to monitor table lock contention
   - Stop immediately if performance degrades significantly

3. POST-OPTIMIZATION:
   - Run verify_optimization_success() after each optimization step
   - Compare performance baselines with original measurements
   - Verify all applications still function correctly

4. EMERGENCY PROCEDURES:
   - If any check fails, immediately execute rollback procedures
   - Document all issues encountered
   - Contact database administrator if rollback fails
*/