#!/usr/bin/env node
/**
 * 🔍 TEST LEMMA RETRIEVAL
 * Comprehensive test script to verify lemma retrieval process step by step
 * 
 * Process:
 * 1. Query scrabble_words table with lowercase versions to get key assignments
 * 2. Collect all the keys (key_lemma, key_feminine, key_plural, key_conj, key_variant)
 * 3. Query dictionary_entries table using those keys to get the actual lemmas
 * 4. Show results: Word -> Key Type -> Actual Lemma
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = "https://duxzmtvrcaphljakflod.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk";

const supabase = createClient(supabaseUrl, supabaseKey);

// Test words
const testWordsOriginal = [
  'ANCORES', 'ARCONES', 'CANEROS', 'CARNEOS', 'CARONES', 'CASERON', 
  'CENSORA', 'CESARON', 'CONREAS', 'CORNEAS', 'CORSEAN', 'COSERAN', 
  'CRANEOS', 'CROASEN', 'ENCAROS', 'ENCORAS', 'ENCRASO', 'ENROCAS', 
  'ENROSCA', 'ESCORAN', 'NECORAS', 'NECROSA', 'RECOSAN', 'RONCASE', 
  'RONCEAS', 'SECARON'
];

const testWords = testWordsOriginal.map(word => word.toLowerCase());

// Helper function to determine word type and key
function determineWordType(row) {
  // Helper to get first key from comma-separated values
  const getFirstKey = (keyValue) => {
    if (!keyValue) return null;
    const firstKey = String(keyValue).split(',')[0].trim();
    return parseFloat(firstKey);
  };

  if (row.key_feminine) {
    return { type: 'feminine', key: getFirstKey(row.key_feminine) };
  } else if (row.key_plural) {
    return { type: 'plural', key: getFirstKey(row.key_plural) };
  } else if (row.key_conj) {
    return { type: 'conjugation', key: getFirstKey(row.key_conj) };
  } else if (row.key_variant) {
    return { type: 'variant', key: getFirstKey(row.key_variant) };
  } else if (row.key_lemma) {
    return { type: 'base (lemma)', key: getFirstKey(row.key_lemma) };
  }
  return { type: 'unknown', key: null };
}

// Helper function to format output
function formatResult(word, type, key, lemma, status) {
  return {
    original: word.toUpperCase(),
    lowercase: word,
    type: type,
    key: key,
    lemma: lemma,
    status: status
  };
}

async function testLemmaRetrieval() {
  console.log('🚀 STARTING COMPREHENSIVE LEMMA RETRIEVAL TEST');
  console.log('='.repeat(60));
  console.log(`📝 Testing ${testWords.length} words\n`);

  try {
    // STEP 1: Query scrabble_words table
    console.log('📍 STEP 1: Querying scrabble_words table...');
    console.log('-'.repeat(50));

    const { data: scrabbleData, error: scrabbleError } = await supabase
      .from('scrabble_words')
      .select('word, key_lemma, key_feminine, key_plural, key_conj, key_variant')
      .in('word', testWords)
      .order('word');

    if (scrabbleError) {
      console.error('❌ Error querying scrabble_words:', scrabbleError);
      return;
    }

    console.log(`✅ Found ${scrabbleData?.length || 0} words in scrabble_words table\n`);

    // Process scrabble_words results
    const scrabbleResults = [];
    const allKeys = new Set();
    const wordToKeyMap = new Map();

    if (scrabbleData && scrabbleData.length > 0) {
      scrabbleData.forEach(row => {
        const wordInfo = determineWordType(row);
        
        scrabbleResults.push({
          word: row.word,
          type: wordInfo.type,
          key: wordInfo.key,
          allKeys: {
            lemma: row.key_lemma,
            feminine: row.key_feminine,
            plural: row.key_plural,
            conjugation: row.key_conj,
            variant: row.key_variant
          }
        });

        // Collect all non-null keys (handling comma-separated values)
        if (row.key_lemma) {
          String(row.key_lemma).split(',').forEach(k => allKeys.add(parseFloat(k.trim())));
        }
        if (row.key_feminine) {
          String(row.key_feminine).split(',').forEach(k => allKeys.add(parseFloat(k.trim())));
        }
        if (row.key_plural) {
          String(row.key_plural).split(',').forEach(k => allKeys.add(parseFloat(k.trim())));
        }
        if (row.key_conj) {
          String(row.key_conj).split(',').forEach(k => allKeys.add(parseFloat(k.trim())));
        }
        if (row.key_variant) {
          String(row.key_variant).split(',').forEach(k => allKeys.add(parseFloat(k.trim())));
        }

        // Map word to its primary key
        wordToKeyMap.set(row.word, wordInfo.key);
      });
    }

    // Display STEP 1 results
    console.log('📊 STEP 1 RESULTS - Words and their keys:');
    console.log('Word'.padEnd(12) + 'Type'.padEnd(15) + 'Key'.padEnd(10) + 'All Keys');
    console.log('-'.repeat(80));
    
    scrabbleResults.forEach(result => {
      const keyInfo = Object.entries(result.allKeys)
        .filter(([_, value]) => value !== null)
        .map(([key, value]) => `${key.substring(0,3)}:${value}`)
        .join(', ');
        
      console.log(
        result.word.toUpperCase().padEnd(12) + 
        result.type.padEnd(15) + 
        (result.key || 'null').toString().padEnd(10) + 
        keyInfo
      );
    });

    // Show words not found in scrabble_words
    const foundInScrabble = new Set(scrabbleData?.map(row => row.word) || []);
    const notFoundInScrabble = testWords.filter(word => !foundInScrabble.has(word));
    
    if (notFoundInScrabble.length > 0) {
      console.log('\n❌ WORDS NOT FOUND IN scrabble_words:');
      notFoundInScrabble.forEach(word => console.log(`  ${word.toUpperCase()}`));
    }

    console.log(`\n📈 Collected ${allKeys.size} unique keys from scrabble_words table\n`);

    // STEP 2: Query dictionary_entries table
    console.log('📍 STEP 2: Querying dictionary_entries table...');
    console.log('-'.repeat(50));

    if (allKeys.size === 0) {
      console.log('⚠️  No keys found, skipping dictionary_entries query\n');
      return;
    }

    // First, let's check what columns are available in dictionary_entries
    const { data: sampleEntry, error: sampleError } = await supabase
      .from('dictionary_entries')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error querying dictionary_entries structure:', sampleError);
      return;
    }

    if (sampleEntry && sampleEntry.length > 0) {
      console.log('📋 Available columns in dictionary_entries:');
      console.log('  ' + Object.keys(sampleEntry[0]).join(', '));
      console.log();
    }

    // Query dictionary_entries for our keys
    const keysArray = Array.from(allKeys);
    const { data: dictData, error: dictError } = await supabase
      .from('dictionary_entries')
      .select('key, lemma')
      .in('key', keysArray)
      .order('key');

    if (dictError) {
      console.error('❌ Error querying dictionary_entries:', dictError);
      return;
    }

    console.log(`✅ Found ${dictData?.length || 0} entries in dictionary_entries table\n`);

    // Create key-to-lemma mapping
    const keyToLemmaMap = new Map();
    if (dictData && dictData.length > 0) {
      dictData.forEach(entry => {
        keyToLemmaMap.set(entry.key, entry.lemma);
      });
    }

    // Display STEP 2 results
    console.log('📊 STEP 2 RESULTS - Keys and their lemmas:');
    console.log('Key'.padEnd(10) + 'Lemma');
    console.log('-'.repeat(40));
    
    if (dictData && dictData.length > 0) {
      dictData.slice(0, 20).forEach(entry => { // Show first 20 for readability
        console.log(entry.key.toString().padEnd(10) + entry.lemma);
      });
      
      if (dictData.length > 20) {
        console.log(`... and ${dictData.length - 20} more entries`);
      }
    }

    // Show keys not found in dictionary_entries
    const foundKeys = new Set(dictData?.map(entry => entry.key) || []);
    const missingKeys = keysArray.filter(key => !foundKeys.has(key));
    
    if (missingKeys.length > 0) {
      console.log('\n❌ KEYS NOT FOUND IN dictionary_entries:');
      missingKeys.slice(0, 10).forEach(key => console.log(`  ${key}`));
      if (missingKeys.length > 10) {
        console.log(`  ... and ${missingKeys.length - 10} more`);
      }
    }

    console.log(`\n📈 Found ${foundKeys.size}/${allKeys.size} keys in dictionary_entries\n`);

    // STEP 3: Combine results - Final mapping
    console.log('📍 STEP 3: Combining results - Word to Lemma mapping...');
    console.log('-'.repeat(50));

    const finalResults = [];
    
    // Process each test word
    testWords.forEach(word => {
      const wordUpper = word.toUpperCase();
      
      if (!foundInScrabble.has(word)) {
        finalResults.push(formatResult(word, 'NOT_FOUND', null, null, 'Not in scrabble_words'));
        return;
      }

      const scrabbleResult = scrabbleResults.find(r => r.word === word);
      if (!scrabbleResult || !scrabbleResult.key) {
        finalResults.push(formatResult(word, scrabbleResult?.type || 'UNKNOWN', null, null, 'No key found'));
        return;
      }

      const lemma = keyToLemmaMap.get(scrabbleResult.key);
      if (!lemma) {
        finalResults.push(formatResult(word, scrabbleResult.type, scrabbleResult.key, null, 'Key not in dictionary_entries'));
        return;
      }

      finalResults.push(formatResult(word, scrabbleResult.type, scrabbleResult.key, lemma, 'SUCCESS'));
    });

    // STEP 4: Display final results
    console.log('📊 FINAL RESULTS - Complete Word to Lemma mapping:');
    console.log('='.repeat(80));
    console.log('Word'.padEnd(12) + 'Type'.padEnd(15) + 'Key'.padEnd(8) + 'Lemma'.padEnd(20) + 'Status');
    console.log('-'.repeat(80));

    finalResults.forEach(result => {
      console.log(
        result.original.padEnd(12) + 
        result.type.padEnd(15) + 
        (result.key || 'null').toString().padEnd(8) + 
        (result.lemma || 'null').padEnd(20) + 
        result.status
      );
    });

    // STEP 5: Summary and Analysis
    console.log('\n📊 SUMMARY AND ANALYSIS:');
    console.log('='.repeat(50));

    const statusCounts = {};
    const typeCounts = {};
    
    finalResults.forEach(result => {
      statusCounts[result.status] = (statusCounts[result.status] || 0) + 1;
      if (result.type !== 'NOT_FOUND' && result.type !== 'UNKNOWN') {
        typeCounts[result.type] = (typeCounts[result.type] || 0) + 1;
      }
    });

    console.log('\n📈 STATUS BREAKDOWN:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = ((count / finalResults.length) * 100).toFixed(1);
      console.log(`  ${status}: ${count} words (${percentage}%)`);
    });

    console.log('\n📈 WORD TYPE BREAKDOWN:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      const percentage = ((count / finalResults.length) * 100).toFixed(1);
      console.log(`  ${type}: ${count} words (${percentage}%)`);
    });

    const successCount = finalResults.filter(r => r.status === 'SUCCESS').length;
    console.log(`\n🎯 OVERALL SUCCESS RATE: ${successCount}/${finalResults.length} (${((successCount/finalResults.length)*100).toFixed(1)}%)`);

    // Show successful lemma retrievals
    const successful = finalResults.filter(r => r.status === 'SUCCESS');
    if (successful.length > 0) {
      console.log('\n✅ SUCCESSFUL LEMMA RETRIEVALS:');
      successful.forEach(result => {
        console.log(`  ${result.original} (${result.type}) → "${result.lemma}"`);
      });
    }

    // Show problematic cases for debugging
    const problematic = finalResults.filter(r => r.status !== 'SUCCESS');
    if (problematic.length > 0) {
      console.log('\n🐛 PROBLEMATIC CASES FOR DEBUGGING:');
      problematic.forEach(result => {
        console.log(`  ${result.original}: ${result.status} (${result.type})`);
      });
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the comprehensive test
testLemmaRetrieval();