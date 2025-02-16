
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.28.0"

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Independent digraph processing for natural language queries
const processNaturalLanguageQuery = (input: string): string => {
  if (!input) return '';
  
  let result = input.toUpperCase();
  console.log('Input original:', result);
  
  // 1. First handle explicit "C Y H" patterns
  const hasSeparateCH = /\bC\s*(?:Y|CON|,)\s*H\b/g.test(result);
  
  // 2. Handle L/LL explicit references
  result = result
    .replace(/\b(ELE|ELES)\b/g, 'L')
    .replace(/\b(ELLE|ELLES)\b/g, 'K')
    .replace(/\b([^A-Z]|^)L([^A-Z]|$)\b/g, '$1L$2')
    .replace(/\b([^A-Z]|^)LL([^A-Z]|$)\b/g, '$1K$2');
  
  console.log('Después de procesar L/LL:', result);
  
  // 3. Special handling for Ñ during accent removal
  result = result.replace(/Ñ/g, '#');
  result = result
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC');
  result = result.replace(/#/g, 'Ñ');
  
  console.log('Después de normalizar acentos:', result);
  
  // 4. Process digraphs
  if (!hasSeparateCH) {
    // Only process CH as digraph if there's no explicit "C Y H"
    result = result.replace(/CH/g, 'Ç');
  }
  result = result.replace(/RR/g, 'W');
  
  // 5. Process remaining LL (not from explicit "elle")
  result = result.replace(/LL/g, 'K');
  
  console.log('Resultado final:', result);
  
  return result;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    console.log('Query original:', query)
    
    // Process query with independent logic
    const processedQuery = processNaturalLanguageQuery(query)
    console.log('Query procesada:', processedQuery)

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Eres un experto en SQL que convierte consultas en lenguaje natural a SQL. 
          La tabla 'words' tiene estas columnas: word (texto), length (número), alphagram (texto).
          SOLO debes devolver la consulta SQL, nada más.
          La consulta SIEMPRE debe empezar con "SELECT DISTINCT w.word FROM words w WHERE".
          SIEMPRE usa el alias "w" para la tabla words.
          SIEMPRE ordena por w.word y limita a 100 resultados.
          SIEMPRE usa ILIKE para comparaciones de texto (case-insensitive).

          IMPORTANTE: Distinción entre L y LL:
          - Las referencias a "ele", "eles", "l" representan la letra L simple
          - Las referencias a "elle", "elles", "ll" representan el dígrafo LL (almacenado como K)

          IMPORTANTE: Los dígrafos están almacenados internamente así:
          - CH se almacena como Ç (CHICO → ÇICO)
          - LL se almacena como K (LLUVIA → KUVIA)
          - RR se almacena como W (PERRO → PEWO)

          IMPORTANTE: Manejo de negaciones:
          - "sin" y "ni" siempre indican NOT ILIKE
          - "no" siempre indica NOT ILIKE

          Ejemplos:
          "palabras con ele" -> "SELECT DISTINCT w.word FROM words w WHERE w.word ILIKE '%L%' ORDER BY w.word LIMIT 100"
          "palabras con elle" -> "SELECT DISTINCT w.word FROM words w WHERE w.word ILIKE '%K%' ORDER BY w.word LIMIT 100"
          "palabras que empiezan con l" -> "SELECT DISTINCT w.word FROM words w WHERE w.word ILIKE 'L%' ORDER BY w.word LIMIT 100"
          "palabras que terminan en ll" -> "SELECT DISTINCT w.word FROM words w WHERE w.word ILIKE '%K' ORDER BY w.word LIMIT 100"
          "palabras sin a" -> "SELECT DISTINCT w.word FROM words w WHERE w.word NOT ILIKE '%A%' ORDER BY w.word LIMIT 100"
          "palabras con q sin e ni i" -> "SELECT DISTINCT w.word FROM words w WHERE w.word ILIKE '%Q%' AND w.word NOT ILIKE '%E%' AND w.word NOT ILIKE '%I%' ORDER BY w.word LIMIT 100"
          "palabras que no tengan n" -> "SELECT DISTINCT w.word FROM words w WHERE w.word NOT ILIKE '%N%' ORDER BY w.word LIMIT 100"`
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

