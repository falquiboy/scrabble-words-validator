
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { words } = await req.json();
    
    if (!Array.isArray(words) || words.length === 0) {
      throw new Error('Invalid input: expected non-empty array of words');
    }

    if (words.length > 50) {
      throw new Error('Too many words: maximum 50 words per request');
    }

    // First, check cache for existing words
    const { data: cachedWords, error: cacheError } = await supabase
      .from('word_accents')
      .select('original_word, accented_word')
      .in('original_word', words);

    if (cacheError) {
      console.error('Cache lookup error:', cacheError);
    }

    // Create a map of cached words
    const cachedMap = new Map(
      (cachedWords || []).map(row => [row.original_word, row.accented_word])
    );

    // Filter out words that need to be processed
    const wordsToProcess = words.filter(word => !cachedMap.has(word));

    if (wordsToProcess.length > 0) {
      // Process uncached words with GPT-4
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a Spanish language expert. Add appropriate diacritical marks to words following Spanish rules. Only add necessary accents. Keep original if no accents needed. Respond in JSON format with confidence scores.',
            },
            {
              role: 'user',
              content: `Process these Spanish words: ${JSON.stringify(wordsToProcess)}`,
            },
          ],
          response_format: { type: "json_object" }
        }),
      });

      const data = await response.json();
      const suggestions = JSON.parse(data.choices[0].message.content);

      // Store new suggestions in cache
      if (Object.keys(suggestions).length > 0) {
        const { error: insertError } = await supabase
          .from('word_accents')
          .insert(
            Object.entries(suggestions).map(([original, data]: [string, any]) => ({
              original_word: original,
              accented_word: data.word,
              confidence_score: data.confidence || 1.0
            }))
          );

        if (insertError) {
          console.error('Cache insert error:', insertError);
        }

        // Add new suggestions to the cached map
        Object.entries(suggestions).forEach(([original, data]: [string, any]) => {
          cachedMap.set(original, data.word);
        });
      }
    }

    // Combine all results
    const results = Object.fromEntries(
      words.map(word => [word, cachedMap.get(word) || word])
    );

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-words-diacritics function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
