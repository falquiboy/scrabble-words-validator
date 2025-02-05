import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });
    const openai = new OpenAIApi(configuration);

    const systemPrompt = `You are a SQL expert that converts natural language queries about words into SQL queries.
    The database has a table called 'words' with columns: word (text), length (integer), alphagram (text).
    Always return valid PostgreSQL that works with these exact column names.
    Only return the SQL query, nothing else.
    IMPORTANT: The column name is 'length' not 'lenght'.`;

    const response = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Convert this query: " + query }
      ],
    });

    const sql = response.data.choices[0].message?.content?.trim();
    
    if (!sql) {
      throw new Error('No SQL generated');
    }

    console.log('Generated SQL:', sql);

    return new Response(
      JSON.stringify({ sql }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});