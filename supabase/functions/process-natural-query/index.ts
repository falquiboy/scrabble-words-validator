import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateSQLQuery(query: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log('Processing natural language query:', query);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a SQL query generator for a Spanish word search application.
              The database has a 'words' table with columns:
              - word (text): The actual word
              - lenght (integer): Length of the word
              - alphagram (text): Sorted letters of the word

              Rules:
              - Generate only the SQL SELECT query, no explanation
              - Always select from the words table
              - Use UPPER() for case-insensitive comparison
              - For "contains" queries, use LIKE with wildcards
              - Return results ordered by word length and then alphabetically
              
              Examples:
              "palabras de 5 letras que contienen z" ->
              SELECT word FROM words WHERE lenght = 5 AND UPPER(word) LIKE '%Z%' ORDER BY word;

              "palabras que empiezan con a y terminan en z" ->
              SELECT word FROM words WHERE UPPER(word) LIKE 'A%Z' ORDER BY lenght, word;

              "palabras de 4 letras que empiezan con b" ->
              SELECT word FROM words WHERE lenght = 4 AND UPPER(word) LIKE 'B%' ORDER BY word;

              "palabras que contengan la letra ñ" ->
              SELECT word FROM words WHERE UPPER(word) LIKE '%Ñ%' ORDER BY lenght, word;

              "palabras de 6 letras que contengan ch" ->
              SELECT word FROM words WHERE lenght = 6 AND UPPER(word) LIKE '%CH%' ORDER BY word;`
            },
            { role: 'user', content: query }
          ],
          temperature: 0.1,
        }),
      });

      if (response.status === 429) {
        console.log(`Rate limited, attempt ${i + 1} of ${retries}, waiting before retry...`);
        await sleep(Math.pow(2, i) * 1000);
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('OpenAI response:', JSON.stringify(data, null, 2));

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI');
      }

      const sqlQuery = data.choices[0].message.content.trim();
      console.log('Generated SQL query:', sqlQuery);
      return sqlQuery;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.error(`Attempt ${i + 1} failed:`, error);
      await sleep(Math.pow(2, i) * 1000);
    }
  }
  throw new Error('Max retries reached');
}

async function executeQuery(sqlQuery: string) {
  try {
    console.log('Executing SQL query:', sqlQuery);
    const { data, error } = await supabase.from('words')
      .select('word')
      .order('lenght')
      .order('word');

    if (error) throw error;
    console.log(`Query returned ${data.length} results`);
    return data.map(row => row.word);
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      throw new Error('Query is required');
    }

    console.log('Processing natural language query:', query);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const sqlQuery = await generateSQLQuery(query);
    const results = await executeQuery(sqlQuery);
    
    return new Response(JSON.stringify({ 
      results,
      sql: sqlQuery // Include the SQL query for debugging
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing natural language query:', error);
    const errorMessage = error.message === 'Max retries reached' 
      ? 'El servicio está temporalmente sobrecargado. Por favor, inténtalo de nuevo en unos momentos.'
      : error.message || 'An error occurred while processing the query';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.toString()
      }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});