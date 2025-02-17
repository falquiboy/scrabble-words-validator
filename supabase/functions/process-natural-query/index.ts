
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.28.0"

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Natural language query processing
const processNaturalLanguageQuery = (input: string): { 
  processedQuery: string,
  hasSeparateLetters: { ch?: boolean }
} => {
  if (!input) return { processedQuery: '', hasSeparateLetters: {} };
  
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
  
  // 4. Process digraphs ONLY if not explicitly separated
  if (!hasSeparateCH) {
    result = result.replace(/CH/g, 'Ç');
  }
  result = result.replace(/RR/g, 'W');
  result = result.replace(/LL/g, 'K');
  
  console.log('Resultado final:', result);
  
  return {
    processedQuery: result,
    hasSeparateLetters: { ch: hasSeparateCH }
  };
};

// Clean SQL response from any markdown or extra formatting
const cleanSQLResponse = (sql: string): string => {
  // Remove markdown code blocks
  sql = sql.replace(/```sql\n?/g, '').replace(/```\n?/g, '');
  
  // Remove any leading/trailing whitespace
  sql = sql.trim();
  
  // Ensure the SQL ends with proper clauses if they're missing
  if (!sql.toLowerCase().includes('order by')) {
    sql += ' ORDER BY w.word';
  }
  if (!sql.toLowerCase().includes('limit')) {
    sql += ' LIMIT 100';
  }
  
  return sql;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    console.log('Query original:', query)
    
    // Process query with independent logic
    const { processedQuery, hasSeparateLetters } = processNaturalLanguageQuery(query)
    console.log('Query procesada:', processedQuery)
    console.log('Letras separadas detectadas:', hasSeparateLetters)

    let systemPrompt = `Eres un experto en SQL que convierte consultas en lenguaje natural a SQL. 
    La tabla 'words' tiene estas columnas: word (texto), length (número), alphagram (texto).

    IMPORTANTE: SOLO debes devolver la consulta SQL, sin ningún formato adicional ni explicaciones.

    Guía para interpretar el lenguaje natural:
    - "con" generalmente indica inclusión (ILIKE)
      Ejemplo: "palabras con A" → w.word ILIKE '%A%'
    - "sin" o "ni" generalmente indican exclusión (NOT ILIKE)
      Ejemplo: "palabras sin A" → w.word NOT ILIKE '%A%'

    Ejemplos de interpretación:
    - "palabras con q sin e ni i" → 
      w.word ILIKE '%Q%' AND w.word NOT ILIKE '%E%' AND w.word NOT ILIKE '%I%'
    - "palabras que no tengan vocales" →
      w.word NOT ILIKE '%A%' AND w.word NOT ILIKE '%E%' AND w.word NOT ILIKE '%I%' AND w.word NOT ILIKE '%O%' AND w.word NOT ILIKE '%U%'
    - "palabras con ch pero sin ll" →
      w.word ILIKE '%Ç%' AND w.word NOT ILIKE '%K%'

    Casos especiales:
    - Cuando hay combinaciones ("con X sin Y"), prioriza la interpretación natural de la frase
    - Considera el contexto completo de la consulta

    La consulta SIEMPRE debe:
    - Empezar con "SELECT DISTINCT w.word FROM words w WHERE"
    - Usar el alias "w" para la tabla words
    - Ordenar por w.word y limitar a 100 resultados
    - Usar ILIKE para comparaciones de texto (case-insensitive)

    IMPORTANTE: Los dígrafos están almacenados internamente así:
    - CH se almacena como Ç (CHICO → ÇICO)
    - LL se almacena como K (LLUVIA → KUVIA)
    - RR se almacena como W (PERRO → PEWO)`;

    // Añadir instrucciones específicas para C y H separadas
    if (hasSeparateLetters.ch) {
      systemPrompt += `\n\nIMPORTANTE: En esta consulta, C y H deben buscarse como letras separadas:
      - Usar: w.word ILIKE '%C%' AND w.word ILIKE '%H%'
      - NO usar: w.word ILIKE '%Ç%'`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: processedQuery
        }
      ],
      temperature: 0.3,
    })

    const rawSql = completion.choices[0].message.content;
    console.log('SQL raw:', rawSql);
    
    const sql = cleanSQLResponse(rawSql);
    console.log('SQL limpio:', sql);

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
