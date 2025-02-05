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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un experto en SQL que convierte consultas en lenguaje natural a SQL. 
          La tabla 'words' tiene estas columnas: word (texto), length (número), alphagram (texto).
          SOLO debes devolver la consulta SQL, nada más.
          La consulta SIEMPRE debe empezar con "SELECT DISTINCT w.word FROM words w WHERE".
          SIEMPRE usa el alias "w" para la tabla words.
          SIEMPRE ordena por w.word y limita a 100 resultados.
          SIEMPRE usa ILIKE para comparaciones de texto.
          Ejemplos:
          "palabras que empiezan con a" -> "SELECT DISTINCT w.word FROM words w WHERE w.word ILIKE 'a%' ORDER BY w.word LIMIT 100"
          "palabras de 5 letras que terminan en cion" -> "SELECT DISTINCT w.word FROM words w WHERE w.length = 5 AND w.word ILIKE '%cion' ORDER BY w.word LIMIT 100"
          "palabras con q sin u" -> "SELECT DISTINCT w.word FROM words w WHERE w.word ILIKE '%q%' AND w.word NOT ILIKE '%u%' ORDER BY w.word LIMIT 100"`
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