import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function callOpenAIWithRetry(query: string, retries = 3): Promise<string> {
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
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a Spanish language query parser that converts natural language queries into pattern search syntax.
              Rules:
              - Use ? for any single letter position
              - Use - for zero or more letters
              - For "contains" queries, generate a pattern that allows the letter to be in any position
              - For specific position queries (starts with, ends with), use exact positions
              - Return ONLY the pattern, no explanation
              Examples:
              "palabras de 5 letras que contienen z" -> "?????" (followed by a comma and the required letter) -> "?????,Z"
              "palabras que empiezan con a y terminan en z" -> "A-Z"
              "palabras de 4 letras que empiezan con b" -> "B???"
              "palabras que contengan la letra ñ" -> "-,-,Ñ"
              "palabras de 6 letras que contengan ch" -> "??????,CH"
              `
            },
            { role: 'user', content: query }
          ],
          temperature: 0.1,
        }),
      });

      if (response.status === 429) {
        console.log(`Rate limited, attempt ${i + 1} of ${retries}, waiting before retry...`);
        await sleep(Math.pow(2, i) * 1000); // Exponential backoff
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

      const pattern = data.choices[0].message.content.trim();
      console.log('Generated pattern:', pattern);
      return pattern;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.error(`Attempt ${i + 1} failed:`, error);
      await sleep(Math.pow(2, i) * 1000);
    }
  }
  throw new Error('Max retries reached');
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

    const pattern = await callOpenAIWithRetry(query);
    console.log('Final pattern generated:', pattern);
    
    return new Response(JSON.stringify({ pattern }), {
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