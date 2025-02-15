
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.28.0"

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process digraphs in query before SQL generation
const processDigraphs = (input: string): string => {
  if (!input) return '';
  
  let result = input.toUpperCase();
  
  // Special handling for Ñ
  result = result.replace(/Ñ/g, '#');
  
  // Remove accents
  result = result
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC');
  
  // Restore Ñ
  result = result.replace(/#/g, 'Ñ');
  
  // Process digraphs in specific order
  const DIGRAPHS = {
    CH: 'Ç',
    LL: 'K',
    RR: 'W'
  };
  
  Object.entries(DIGRAPHS).forEach(([digraph, replacement]) => {
    result = result.replace(new RegExp(digraph, 'g'), replacement);
  });
  
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    console.log('Query original:', query)
    
    // Process digraphs in the query
    const processedQuery = processDigraphs(query)
    console.log('Query procesada:', processedQuery)

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
          IMPORTANTE: Los dígrafos CH, LL y RR están almacenados internamente como Ç, K y W respectivamente.
          Por ejemplo:
          - CH se almacena como Ç (CHICO → ÇICO)
          - LL se almacena como K (LLUVIA → KUVIA)
          - RR se almacena como W (PERRO → PEWO)
          Ejemplos:
          "palabras que empiezan con ch" -> "SELECT DISTINCT w.word FROM words w WHERE w.word ILIKE 'Ç%' ORDER BY w.word LIMIT 100"
          "palabras de 5 letras que terminan con lla" -> "SELECT DISTINCT w.word FROM words w WHERE w.length = 5 AND w.word ILIKE '%KA' ORDER BY w.word LIMIT 100"
          "palabras con rr" -> "SELECT DISTINCT w.word FROM words w WHERE w.word ILIKE '%W%' ORDER BY w.word LIMIT 100"`
        },
        {
          role: "user",
          content: processedQuery
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
