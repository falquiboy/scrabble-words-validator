# Database Backup and Rollback Strategy

## Project Overview
This document provides a comprehensive backup and rollback strategy for the Spanish dictionary and Scrabble validation database before implementing any performance optimizations.

**Database Type**: Supabase PostgreSQL  
**Project ID**: duxzmtvrcaphljakflod  
**Environment**: Production  
**Date Created**: 2025-07-23

## Current Database Schema Analysis

### Core Tables Identified

#### 1. **lexicon_indexes** (Primary Scrabble Words Table)
- **Purpose**: Main table for Spanish Scrabble word validation
- **Key Columns**:
  - `non_diac_word` (TEXT) - Word without diacritics
  - `key_lemma`, `key_feminine`, `key_plural`, `key_conj`, `key_variant` (REAL) - Dictionary references
  - `norm_word` (TEXT) - Scrabble normalized word (CH→Ç, LL→K, RR→W)
  - `norm_alph` (TEXT) - Alphabetically sorted normalized word for anagram searches
  - `norm_length` (INTEGER) - Length of normalized word
- **Indexes**:
  - `idx_lexicon_norm_word` on norm_word
  - `idx_lexicon_norm_length` on norm_length  
  - `idx_lexicon_norm_alph` on norm_alph
  - `idx_lexicon_length_alph` on (norm_length, norm_alph)

#### 2. **dictionary_entries** (Dictionary Lemmas)
- **Purpose**: Main entries from Spanish conventional dictionary
- **Key Columns**:
  - `entry_id` (SERIAL PRIMARY KEY)
  - `key_value` (REAL UNIQUE) - Original PDF order reference
  - `lemma` (TEXT) - Dictionary headword
  - `etymology_info`, `parenthesis_info` (TEXT)
  - `total_senses` (INTEGER)
- **Indexes**:
  - `idx_dictionary_entries_lemma` on lemma
  - `idx_dictionary_entries_key_value` on key_value

#### 3. **dictionary_senses** (Dictionary Definitions)
- **Purpose**: Individual definitions/senses for each dictionary entry
- **Key Columns**:
  - `sense_id` (SERIAL PRIMARY KEY)
  - `entry_id` (INTEGER) - FK to dictionary_entries
  - `sense_number` (INTEGER)
  - `definition` (TEXT)
  - Grammatical metadata columns (gender_code, pos_code, etc.)
- **Indexes**:
  - `idx_dictionary_senses_entry_id` on entry_id
  - `idx_dictionary_senses_definition` (GIN full-text search)

#### 4. **word_dictionary_relations** (Cross-Reference Table)
- **Purpose**: Links Scrabble words to dictionary entries
- **Key Columns**:
  - `word` (TEXT) - Scrabble word
  - `entry_id` (INTEGER) - FK to dictionary_entries
  - `relation_type` (TEXT) - Type of relationship
- **Indexes**:
  - `idx_word_dictionary_relations_word` on word
  - `idx_word_dictionary_relations_entry_id` on entry_id
  - `idx_word_dictionary_relations_type` on relation_type

#### 5. **Training System Tables**
- `training_patterns` - AI training patterns
- `training_rules` - Query processing rules
- `training_sessions` - User training sessions
- `training_logs` - Training activity logs

#### 6. **Supporting Tables**
- `dictionary_categories` - Catalogs for grammatical categories
- `dictionary_verbs` - Verb-specific information
- `words` - Legacy Scrabble words table (compatibility)

### Applied Migrations History
1. `001_add_dictionary_schema.sql` - Core dictionary schema
2. `20250714231952_create_training_system.sql` - Training system tables
3. `20250715235915_add_norm_word_column_to_lexicon_indexes.sql` - Added norm_word column
4. `20250716001955_fix_ch_to_cedilla_normalization.sql` - Fixed CH→Ç normalization
5. `20250716003704_add_alfagrama_columns_to_lexicon_indexes.sql` - Added anagram columns

## Backup Procedures

### 1. Pre-Optimization Database Backup

#### Full Schema Backup
```bash
# Create complete schema backup
npx supabase db dump --schema-only > backup_schema_$(date +%Y%m%d_%H%M%S).sql

# Create complete data backup  
npx supabase db dump --data-only > backup_data_$(date +%Y%m%d_%H%M%S).sql

# Create combined backup
npx supabase db dump > backup_complete_$(date +%Y%m%d_%H%M%S).sql
```

#### Critical Table Backups
```sql
-- Backup lexicon_indexes structure and data
CREATE TABLE lexicon_indexes_backup_20250723 AS 
SELECT * FROM lexicon_indexes;

-- Backup dictionary_entries
CREATE TABLE dictionary_entries_backup_20250723 AS 
SELECT * FROM dictionary_entries;

-- Backup dictionary_senses  
CREATE TABLE dictionary_senses_backup_20250723 AS
SELECT * FROM dictionary_senses;

-- Backup word_dictionary_relations
CREATE TABLE word_dictionary_relations_backup_20250723 AS
SELECT * FROM word_dictionary_relations;
```

#### Index Documentation
```sql
-- Document all current indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('lexicon_indexes', 'dictionary_entries', 'dictionary_senses', 'word_dictionary_relations')
ORDER BY tablename, indexname;
```

### 2. Performance Baseline Documentation

#### Current Query Performance Metrics
```sql
-- Enable query timing
\timing on

-- Test current anagram search performance
EXPLAIN ANALYZE 
SELECT non_diac_word, norm_word 
FROM lexicon_indexes 
WHERE norm_length = 7 
AND norm_alph = 'AEILOR';

-- Test dictionary lookup performance
EXPLAIN ANALYZE
SELECT de.lemma, ds.definition 
FROM dictionary_entries de
JOIN dictionary_senses ds ON de.entry_id = ds.entry_id
WHERE de.lemma = 'casa';

-- Test word validation performance
EXPLAIN ANALYZE
SELECT COUNT(*) 
FROM lexicon_indexes 
WHERE norm_word = 'CASA';
```

#### Table Size Analysis
```sql
-- Document current table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Rollback Procedures

#### Complete Database Rollback
```bash
# Stop application access to database
# Restore from complete backup
npx supabase db reset --linked
cat backup_complete_YYYYMMDD_HHMMSS.sql | npx supabase db push
```

#### Selective Table Rollback
```sql
-- Rollback lexicon_indexes only
BEGIN;
DROP TABLE IF EXISTS lexicon_indexes CASCADE;
CREATE TABLE lexicon_indexes AS 
SELECT * FROM lexicon_indexes_backup_20250723;
-- Recreate indexes (see Index Recreation section)
COMMIT;
```

#### Index-Only Rollback
```sql
-- Remove new indexes and recreate originals
DROP INDEX IF EXISTS idx_new_optimization_index;
-- Recreate original indexes from documentation
```

### 4. Index Recreation Scripts

#### Core Indexes for lexicon_indexes
```sql
-- Original indexes
CREATE INDEX IF NOT EXISTS idx_lexicon_norm_word 
ON lexicon_indexes(norm_word);

CREATE INDEX IF NOT EXISTS idx_lexicon_norm_length 
ON lexicon_indexes(norm_length);

CREATE INDEX IF NOT EXISTS idx_lexicon_norm_alph 
ON lexicon_indexes(norm_alph);

CREATE INDEX IF NOT EXISTS idx_lexicon_length_alph 
ON lexicon_indexes(norm_length, norm_alph);
```

#### Core Indexes for dictionary_entries
```sql
CREATE INDEX IF NOT EXISTS idx_dictionary_entries_lemma 
ON dictionary_entries(lemma);

CREATE INDEX IF NOT EXISTS idx_dictionary_entries_key_value 
ON dictionary_entries(key_value);
```

#### Core Indexes for dictionary_senses
```sql
CREATE INDEX IF NOT EXISTS idx_dictionary_senses_entry_id 
ON dictionary_senses(entry_id);

CREATE INDEX IF NOT EXISTS idx_dictionary_senses_definition 
ON dictionary_senses USING gin(to_tsvector('spanish', definition));
```

## Safety Checklist

### Pre-Optimization Verification
- [ ] Full database backup completed and verified
- [ ] Schema documentation exported
- [ ] Performance baselines recorded
- [ ] All table row counts documented
- [ ] Index definitions saved
- [ ] Application downtime scheduled (if needed)
- [ ] Rollback scripts tested on development copy

### During Optimization
- [ ] Apply changes in transaction blocks where possible
- [ ] Test each optimization incrementally
- [ ] Monitor query performance after each change
- [ ] Verify data integrity after each change
- [ ] Document any unexpected behavior

### Post-Optimization Verification
- [ ] All original queries still function correctly
- [ ] Performance improvements measurable
- [ ] No data loss detected
- [ ] All applications connecting successfully
- [ ] User acceptance testing passed
- [ ] Cleanup backup tables (after confirmation)

## Risk Assessment

### High Risk Operations
1. **Column alterations on lexicon_indexes** - This is the largest table with most critical indexes
2. **Constraint modifications** - Could affect referential integrity
3. **Full table rebuilds** - Risk of data loss or corruption

### Medium Risk Operations
1. **New index creation** - May cause temporary performance degradation
2. **Function modifications** - Could break application queries
3. **Trigger modifications** - May affect data consistency

### Low Risk Operations
1. **Adding new columns with defaults**
2. **Creating new tables**
3. **Adding non-critical indexes**

## Emergency Procedures

### If Optimization Fails
1. **Immediate**: Stop all write operations to affected tables
2. **Assessment**: Identify scope of corruption/loss
3. **Rollback**: Execute appropriate rollback procedure
4. **Verification**: Confirm system restoration
5. **Communication**: Notify stakeholders of status

### If Performance Degrades
1. **Monitor**: Identify specific slow queries
2. **Index Analysis**: Check if indexes are being used
3. **Partial Rollback**: Remove only problematic optimizations
4. **Incremental Fix**: Apply smaller, targeted improvements

### Contact Information
- **Database Admin**: [Your contact info]
- **Application Owner**: [Owner contact info]
- **Emergency Escalation**: [Emergency contact]

## Implementation Timeline

1. **Phase 1** (Day 1): Create all backups and document baselines
2. **Phase 2** (Day 2): Test rollback procedures on development copy
3. **Phase 3** (Day 3): Begin incremental optimizations
4. **Phase 4** (Day 4+): Monitor and fine-tune optimizations

---

**CRITICAL**: Do not proceed with any database optimizations until all backup procedures in this document have been completed and verified.