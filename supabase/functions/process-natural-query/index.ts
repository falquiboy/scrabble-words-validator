import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    console.log('Procesando consulta:', query)

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Eres un experto en SQL que convierte consultas en lenguaje natural a SQL.
          La base de datos tiene una tabla llamada 'words' con estas columnas:
          - word (text): la palabra
          - length (bigint): longitud de la palabra
          - alphagram (text): letras ordenadas alfabéticamente

          Reglas:
          1. SIEMPRE usa el nombre de columna "length" (no "lenght")
          2. SIEMPRE retorna SQL válido para PostgreSQL
          3. SIEMPRE incluye ORDER BY word
          4. SIEMPRE incluye LIMIT 100
          5. SOLO retorna la consulta SQL, nada más
          6. La consulta SOLO debe retornar la columna 'word'`
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0,
    })

    const sql = completion.choices[0].message.content
    console.log('SQL generado:', sql)

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