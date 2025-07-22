import { supabase } from "@/integrations/supabase/client";

// Debug function to check what's happening with anagram data
export async function debugAnagramData() {
  console.log('🔍 Debugging anagram data queries...');

  // 1. Check scrabble_words structure
  console.log('\n📊 Checking scrabble_words structure:');
  try {
    const { data: sample, error } = await supabase
      .from('scrabble_words')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log('❌ scrabble_words error:', error);
    } else {
      console.log('✅ scrabble_words sample:', sample);
      if (sample && sample.length > 0) {
        console.log('✅ Columns:', Object.keys(sample[0]));
      }
    }
  } catch (e) {
    console.log('❌ scrabble_words exception:', e);
  }

  // 2. Check words table
  console.log('\n📊 Checking words table:');
  try {
    const { data: wordsData, error: wordsError } = await supabase
      .from('words')
      .select('*')
      .limit(3);
    
    if (wordsError) {
      console.log('❌ words error:', wordsError);
    } else {
      console.log('✅ words sample:', wordsData);
    }
  } catch (e) {
    console.log('❌ words exception:', e);
  }

  // 3. Test specific word
  console.log('\n🎯 Testing specific word (CASA):');
  
  // Try words table first
  try {
    const { data: wordData, error } = await supabase
      .from('words')
      .select('*')
      .eq('word', 'CASA')
      .limit(1);
    
    if (error) {
      console.log('❌ CASA lookup error:', error);
    } else {
      console.log('✅ CASA in words table:', wordData);
    }
  } catch (e) {
    console.log('❌ CASA lookup exception:', e);
  }

  // 4. Test dictionary entries
  console.log('\n📚 Testing dictionary entries:');
  try {
    const { data: dictData, error: dictError } = await supabase
      .from('dictionary_entries')
      .select('key, lemma, etymology_info')
      .ilike('lemma', 'casa')
      .limit(3);
    
    if (dictError) {
      console.log('❌ dictionary error:', dictError);
    } else {
      console.log('✅ dictionary entries for casa:', dictData);
    }
  } catch (e) {
    console.log('❌ dictionary exception:', e);
  }

  // 5. Test dictionary senses
  console.log('\n📖 Testing dictionary senses:');
  try {
    const { data: sensesData, error: sensesError } = await supabase
      .from('dictionary_senses')
      .select('entry_key, definition, part_of_speech_1')
      .limit(3);
    
    if (sensesError) {
      console.log('❌ senses error:', sensesError);
    } else {
      console.log('✅ dictionary senses sample:', sensesData);
    }
  } catch (e) {
    console.log('❌ senses exception:', e);
  }
}

// Call this in browser console: debugAnagramData()
(window as any).debugAnagramData = debugAnagramData;