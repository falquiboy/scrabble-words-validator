
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
  hasSeparateLetters: { ch?: boolean, separateL?: boolean }
} => {
  if (!input) return { processedQuery: '', hasSeparateLetters: {} };
  
  let result = input.toUpperCase();
  console.log('Input original:', result);
  
  // 1. Detect explicit references to separate letters vs digraphs
  const hasSeparateCH = /\bC\s*(?:Y|CON|,)\s*H\b/g.test(result);
  
  // Detect when user refers to separate L letters vs the LL digraph
  // "2 eles", "dos eles", "dos letras l" should be treated as separate L's
  // "elle", "doble ele", "LL" should be treated as the digraph
  const hasSeparateL = /\b(?:2|DOS)\s+(?:ELES|LETRAS?\s+L)\b/g.test(result) ||
                      /\bDOS\s+L\b/g.test(result) ||
                      /\bL\s+Y\s+(?:OTRA\s+)?L\b/g.test(result);
  
  // 2. Handle L/LL references carefully
  if (!hasSeparateL) {
    // Only convert "ele/eles" to "L" if we're NOT dealing with separate L's
    result = result
      .replace(/\b(ELE|ELES)\b/g, 'L')
      .replace(/\b(ELLE|ELLES|DOBLE\s+ELE)\b/g, 'K'); // LL digraph
  } else {
    // When dealing with separate L's, don't process "eles" as single L
    result = result
      .replace(/\b(ELLE|ELLES|DOBLE\s+ELE)\b/g, 'K') // Still handle LL digraph
      .replace(/\b(?:2|DOS)\s+(?:ELES|LETRAS?\s+L)\b/g, '2 L') // Normalize to "2 L"
      .replace(/\bDOS\s+L\b/g, '2 L');
  }
  
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
  if (!hasSeparateL) {
    result = result.replace(/LL/g, 'K');
  }
  result = result.replace(/RR/g, 'W');
  
  console.log('Resultado final:', result);
  
  return {
    processedQuery: result,
    hasSeparateLetters: { 
      ch: hasSeparateCH,
      separateL: hasSeparateL
    }
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

    Casos especiales para contar letras:
    - "2 L" o "dos L" significa exactamente 2 ocurrencias de la letra L
      Usar: LENGTH(w.word) - LENGTH(REPLACE(w.word, 'L', '')) = 2
    - "3 A" significa exactamente 3 ocurrencias de la letra A
      Usar: LENGTH(w.word) - LENGTH(REPLACE(w.word, 'A', '')) = 3

    Ejemplos de interpretación:
    - "palabras con q sin e ni i" → 
      w.word ILIKE '%Q%' AND w.word NOT ILIKE '%E%' AND w.word NOT ILIKE '%I%'
    - "palabras con 2 L" →
      w.word ILIKE '%L%' AND LENGTH(w.word) - LENGTH(REPLACE(w.word, 'L', '')) = 2
    - "palabras con elle pero sin ll" →
      w.word ILIKE '%K%' AND w.word NOT ILIKE '%K%' (esto es contradictorio, maneja con cuidado)

    IMPORTANTE: Los dígrafos están almacenados internamente así:
    - CH se almacena como Ç (CHICO → ÇICO)
    - LL (elle/doble ele) se almacena como K (LLUVIA → KUVIA)
    - RR se almacena como W (PERRO → PEWO)

    La consulta SIEMPRE debe:
    - Empezar con "SELECT DISTINCT w.word FROM words w WHERE"
    - Usar el alias "w" para la tabla words
    - Ordenar por w.word y limitar a 100 resultados
    - Usar ILIKE para comparaciones de texto (case-insensitive)`;

    // Añadir instrucciones específicas para letras separadas
    if (hasSeparateLetters.ch) {
      systemPrompt += `\n\nIMPORTANTE: En esta consulta, C y H deben buscarse como letras separadas:
      - Usar: w.word ILIKE '%C%' AND w.word ILIKE '%H%'
      - NO usar: w.word ILIKE '%Ç%'`;
    }

    if (hasSeparateLetters.separateL) {
      systemPrompt += `\n\nIMPORTANTE: En esta consulta, se refiere a letras L separadas (no al dígrafo LL):
      - Para "2 L" usar: LENGTH(w.word) - LENGTH(REPLACE(w.word, 'L', '')) = 2
      - Para "L y otra L" usar: w.word ILIKE '%L%' AND LENGTH(w.word) - LENGTH(REPLACE(w.word, 'L', '')) >= 2
      - NO confundir con el dígrafo LL (que se almacena como K)`;
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
