
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.28.0"

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process explicit L/LL references before handling digraphs
const preprocessLReferences = (input: string): string => {
  if (!input) return '';
  
  let processed = input.toUpperCase();
  
  // Replace explicit mentions of "ele(s)" and "elle(s)"
  processed = processed
    .replace(/\b(ELE|ELES)\b/g, '__L__')
    .replace(/\b(ELLE|ELLES)\b/g, '__LL__')
    .replace(/\b([^A-Z]|^)L([^A-Z]|$)\b/g, '$1__L__$2')
    .replace(/\b([^A-Z]|^)LL([^A-Z]|$)\b/g, '$1__LL__$2');
  
  return processed;
};

// Process CH references before handling digraphs
const preprocessChReferences = (input: string): string => {
  if (!input) return '';
  
  let processed = input.toUpperCase();
  
  // First handle explicit separate C and H mentions
  // Patterns like "C Y H", "C CON H", "C, H"
  const separateLettersPattern = /\bC\s*(?:Y|CON|,)\s*H\b/g;
  processed = processed.replace(separateLettersPattern, 'C H');
  
  // Then handle remaining CH occurrences as digraphs
  processed = processed.replace(/\bCH\b/g, '__CH__');
  processed = processed.replace(/CH/g, '__CH__');
  
  return processed;
};

// Process digraphs in query before SQL generation
const processDigraphs = (input: string): string => {
  if (!input) return '';
  
  let result = input;
  
  // Special handling for Ñ
  result = result.replace(/Ñ/g, '#');
  
  // Remove accents
  result = result
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC');
  
  // Restore Ñ
  result = result.replace(/#/g, 'Ñ');
  
  // Process RR digraph
  result = result.replace(/RR/g, 'W');
  
  // Process CH digraph only when marked
  result = result.replace(/__CH__/g, 'Ç');
  
  // Process remaining LL occurrences (those not marked as explicit)
  result = result.replace(/LL/g, 'K');
  
  // Finally, restore our special L/LL markers
  result = result
    .replace(/__L__/g, 'L')
    .replace(/__LL__/g, 'K');
  
  return result;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    console.log('Query original:', query)
    
    // First process L/LL references
    const preProcessedL = preprocessLReferences(query)
    console.log('Query con referencias L/LL procesadas:', preProcessedL)
    
    // Then process CH references
    const preProcessedCH = preprocessChReferences(preProcessedL)
    console.log('Query con referencias CH procesadas:', preProcessedCH)
    
    // Finally process remaining digraphs
    const processedQuery = processDigraphs(preProcessedCH)
    console.log('Query procesada final:', processedQuery)

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

