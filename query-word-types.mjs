import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = "https://duxzmtvrcaphljakflod.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk";

const supabase = createClient(supabaseUrl, supabaseKey);

// Words to check (converting to lowercase as database stores them in lowercase)
const wordsToCheckOriginal = [
  'ANCORES', 'ARCONES', 'CANEROS', 'CARNEOS', 'CARONES', 'CASERON', 
  'CENSORA', 'CESARON', 'CONREAS', 'CORNEAS', 'CORSEAN', 'COSERAN', 
  'CRANEOS', 'CROASEN', 'ENCAROS', 'ENCORAS', 'ENCRASO', 'ENROCAS', 
  'ENROSCA', 'ESCORAN', 'NECORAS', 'NECROSA', 'RECOSAN', 'RONCASE', 
  'RONCEAS', 'SECARON'
];

const wordsToCheck = wordsToCheckOriginal.map(word => word.toLowerCase());

async function queryWordTypes() {
  console.log('🔍 Querying Supabase for word types...\n');
  
  try {
    // Query the scrabble_words table for the specified words
    const { data, error } = await supabase
      .from('scrabble_words')
      .select('word, key_lemma, key_feminine, key_plural, key_conj, key_variant')
      .in('word', wordsToCheck)
      .order('word');

    if (error) {
      console.error('❌ Error querying database:', error);
      return;
    }

    console.log(`✅ Found ${data?.length || 0} words in the database\n`);
    
    // Process results and determine word types
    const results = [];
    const foundWords = new Set();
    
    if (data && data.length > 0) {
      data.forEach(row => {
        foundWords.add(row.word);
        let wordType = 'base (lemma)';
        let keyValue = null;
        
        // Determine word type based on which key is populated
        if (row.key_feminine) {
          wordType = 'feminine';
          keyValue = row.key_feminine;
        } else if (row.key_plural) {
          wordType = 'plural';
          keyValue = row.key_plural;
        } else if (row.key_conj) {
          wordType = 'conjugation';
          keyValue = row.key_conj;
        } else if (row.key_variant) {
          wordType = 'variant';
          keyValue = row.key_variant;
        } else if (row.key_lemma) {
          wordType = 'base (lemma)';
          keyValue = row.key_lemma;
        }
        
        results.push({
          word: row.word.toUpperCase(), // Display in uppercase for consistency
          type: wordType,
          key: keyValue,
          keys: {
            lemma: row.key_lemma,
            feminine: row.key_feminine,
            plural: row.key_plural,
            conjugation: row.key_conj,
            variant: row.key_variant
          }
        });
      });
    }
    
    // Display results
    console.log('📊 RESULTS:\n');
    console.log('Word'.padEnd(12) + 'Type'.padEnd(15) + 'Key'.padEnd(8) + 'All Keys');
    console.log('─'.repeat(60));
    
    results.forEach(result => {
      const keyInfo = Object.entries(result.keys)
        .filter(([_, value]) => value !== null)
        .map(([key, value]) => `${key}:${value}`)
        .join(', ');
        
      console.log(
        result.word.padEnd(12) + 
        result.type.padEnd(15) + 
        (result.key || 'null').toString().padEnd(8) + 
        keyInfo
      );
    });
    
    // Show words not found (display in uppercase)
    const notFoundWords = wordsToCheck.filter(word => !foundWords.has(word))
                                      .map(word => word.toUpperCase());
    if (notFoundWords.length > 0) {
      console.log('\n❌ WORDS NOT FOUND IN SCRABBLE_WORDS:');
      notFoundWords.forEach(word => console.log('  ' + word));
    }
    
    // Summary
    console.log('\n📈 SUMMARY:');
    const typeCounts = {};
    results.forEach(result => {
      typeCounts[result.type] = (typeCounts[result.type] || 0) + 1;
    });
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} words`);
    });
    
    console.log(`  Total found: ${results.length}/${wordsToCheck.length} words`);
    console.log(`  Not found: ${notFoundWords.length} words`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the query
queryWordTypes();