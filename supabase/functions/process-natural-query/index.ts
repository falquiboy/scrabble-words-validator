import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from "https://esm.sh/openai@4.28.0"

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    console.log('Received query:', query)

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a SQL expert that converts natural language queries into SQL queries for a word search application.
          The database has a table called 'words' with these columns:
          - word (text): the actual word
          - length (bigint): length of the word
          - alphagram (text): letters sorted alphabetically

          Rules:
          1. ALWAYS use the column name "length" (not "lenght")
          2. ALWAYS return valid PostgreSQL
          3. ALWAYS include ORDER BY word
          4. ALWAYS include LIMIT 100
          5. ONLY return the SQL query, nothing else
          6. The query should ONLY return the 'word' column`
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0,
    })

    const sql = completion.choices[0].message.content
    console.log('Generated SQL:', sql)

    return new Response(
      JSON.stringify({ sql }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      },
    )
  }
})