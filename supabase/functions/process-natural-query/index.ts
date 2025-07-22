
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Cambiado de OpenAI a Anthropic Claude
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 🎯 BÚSQUEDA HÍBRIDA SEMÁNTICA - USAR DEFINICIONES Y DOMINIOS
async function searchMigratedDatabase(query: string, supabaseClient: any): Promise<{
  results: any[],
  source: string,
  sql_query: string,
  message: string
}> {
  console.log('🔍 Búsqueda semántica en BD migrada:', query);
  
  const normalizedQuery = query.toLowerCase();
  
  // 1. BÚSQUEDA SEMÁNTICA POR DEFINICIONES
  let semanticResults = [];
  let category = 'general';
  let searchStrategy = '';
  
  try {
    if (normalizedQuery.includes('pájaro') || normalizedQuery.includes('pajaro') || 
        normalizedQuery.includes('ave') || normalizedQuery.includes('aves')) {
      category = 'aves';
      searchStrategy = 'Definiciones que empiecen con "Ave" o "Pájaro"';
      
      const { data: birdResults } = await supabaseClient
        .from('dictionary_senses')
        .select(`
          definition,
          dictionary_entries!inner(lemma, key_value, etymology_info),
          domain_code
        `)
        .or('definition.ilike.Ave %,definition.ilike.Pájaro %')
        .limit(30);
      
      semanticResults = birdResults?.map(r => ({
        lemma: r.dictionary_entries?.lemma,
        key_value: r.dictionary_entries?.key_value,
        etymology_info: r.dictionary_entries?.etymology_info,
        definition: r.definition,
        domain: r.domain_code
      })) || [];
      
    } else if (normalizedQuery.includes('mamífero') || normalizedQuery.includes('mamifero') ||
               normalizedQuery.includes('animal') || normalizedQuery.includes('animales')) {
      category = 'mamíferos/animales';
      searchStrategy = 'Definiciones que empiecen con "Mamífero" o "Animal"';
      
      const { data: animalResults } = await supabaseClient
        .from('dictionary_senses')
        .select(`
          definition,
          dictionary_entries!inner(lemma, key_value, etymology_info),
          domain_code
        `)
        .or('definition.ilike.Mamífero %,definition.ilike.Animal %')
        .limit(30);
      
      semanticResults = animalResults?.map(r => ({
        lemma: r.dictionary_entries?.lemma,
        key_value: r.dictionary_entries?.key_value,
        etymology_info: r.dictionary_entries?.etymology_info,
        definition: r.definition,
        domain: r.domain_code
      })) || [];
      
    } else if (normalizedQuery.includes('pez') || normalizedQuery.includes('peces') ||
               normalizedQuery.includes('pescado')) {
      category = 'peces';
      searchStrategy = 'Definiciones que empiecen con "Pez"';
      
      const { data: fishResults } = await supabaseClient
        .from('dictionary_senses')
        .select(`
          definition,
          dictionary_entries!inner(lemma, key_value, etymology_info),
          domain_code
        `)
        .ilike('definition', 'Pez %')
        .limit(30);
      
      semanticResults = fishResults?.map(r => ({
        lemma: r.dictionary_entries?.lemma,
        key_value: r.dictionary_entries?.key_value,
        etymology_info: r.dictionary_entries?.etymology_info,
        definition: r.definition,
        domain: r.domain_code
      })) || [];
      
    } else if (normalizedQuery.includes('planta') || normalizedQuery.includes('plantas') ||
               normalizedQuery.includes('flor') || normalizedQuery.includes('flores') ||
               normalizedQuery.includes('árbol') || normalizedQuery.includes('arbol')) {
      category = 'plantas';
      searchStrategy = 'Definiciones que empiecen con "Planta", "Árbol" o "Hierba"';
      
      const { data: plantResults } = await supabaseClient
        .from('dictionary_senses')
        .select(`
          definition,
          dictionary_entries!inner(lemma, key_value, etymology_info),
          domain_code
        `)
        .or('definition.ilike.Planta %,definition.ilike.Árbol %,definition.ilike.Hierba %')
        .limit(30);
      
      semanticResults = plantResults?.map(r => ({
        lemma: r.dictionary_entries?.lemma,
        key_value: r.dictionary_entries?.key_value,
        etymology_info: r.dictionary_entries?.etymology_info,
        definition: r.definition,
        domain: r.domain_code
      })) || [];
      
    } else if (normalizedQuery.includes('insecto') || normalizedQuery.includes('insectos')) {
      category = 'insectos';
      searchStrategy = 'Definiciones que empiecen con "Insecto"';
      
      const { data: insectResults } = await supabaseClient
        .from('dictionary_senses')
        .select(`
          definition,
          dictionary_entries!inner(lemma, key_value, etymology_info),
          domain_code
        `)
        .ilike('definition', 'Insecto %')
        .limit(30);
      
      semanticResults = insectResults?.map(r => ({
        lemma: r.dictionary_entries?.lemma,
        key_value: r.dictionary_entries?.key_value,
        etymology_info: r.dictionary_entries?.etymology_info,
        definition: r.definition,
        domain: r.domain_code
      })) || [];
      
    } else if (normalizedQuery.includes('gentilicio') || normalizedQuery.includes('gentilicios') ||
               normalizedQuery.includes('nacionalidad') || normalizedQuery.includes('nacionalidades') ||
               normalizedQuery.includes('natural de') || normalizedQuery.includes('oriundo') ||
               normalizedQuery.includes('habitante')) {
      category = 'gentilicios';
      searchStrategy = 'Definiciones "Natural de" y "Dicho de una persona" + "pueblo"';
      
      // Buscar ambos patrones: "Natural de" y "Dicho de una persona" + "pueblo"
      const [{ data: naturalDeResults }, { data: puebloResults }] = await Promise.all([
        // Patrón 1: "Natural de"
        supabaseClient
          .from('dictionary_senses')
          .select(`
            definition,
            dictionary_entries!inner(lemma, key_value, etymology_info),
            domain_code,
            pos_code
          `)
          .ilike('definition', 'Natural de %')
          .limit(40),
        
        // Patrón 2: "Dicho de una persona" + "pueblo"
        supabaseClient
          .from('dictionary_senses')
          .select(`
            definition,
            dictionary_entries!inner(lemma, key_value, etymology_info),
            domain_code,
            pos_code
          `)
          .ilike('definition', 'Dicho de una persona%')
          .or('definition.ilike.%pueblo%,definition.ilike.%pueblos%')
          .limit(20)
      ]);
      
      // Combinar ambos resultados
      const combinedResults = [
        ...(naturalDeResults?.map(r => ({
          lemma: r.dictionary_entries?.lemma,
          key_value: r.dictionary_entries?.key_value,
          etymology_info: r.dictionary_entries?.etymology_info,
          definition: r.definition,
          domain: r.domain_code,
          pos: r.pos_code,
          type: 'natural_de'
        })) || []),
        ...(puebloResults?.map(r => ({
          lemma: r.dictionary_entries?.lemma,
          key_value: r.dictionary_entries?.key_value,
          etymology_info: r.dictionary_entries?.etymology_info,
          definition: r.definition,
          domain: r.domain_code,
          pos: r.pos_code,
          type: 'pueblo_amerindio'
        })) || [])
      ];
      
      semanticResults = combinedResults;
    }
    
    // 2. SI ENCONTRAMOS RESULTADOS SEMÁNTICOS, DEVOLVERLOS
    if (semanticResults.length > 0) {
      const sqlQuery = `Búsqueda semántica: ${searchStrategy}`;
      console.log(`✅ Encontrados ${semanticResults.length} resultados semánticos`);
      
      return {
        results: semanticResults,
        source: 'database',
        sql_query: sqlQuery,
        message: `🎯 Encontrados ${semanticResults.length} ${category} usando búsqueda semántica en diccionario migrado (52K entradas)`
      };
    }
    
    // 3. FALLBACK: BÚSQUEDA TRADICIONAL POR LEMMA
    console.log('📝 Sin resultados semánticos, usando búsqueda tradicional...');
    
    const words = normalizedQuery
      .replace(/[^\w\sáéíóúñ]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['que', 'con', 'los', 'las', 'del', 'una', 'para', 'contengan', 'empiecen', 'terminen'].includes(w));
    
    if (words.length === 0) {
      return {
        results: [],
        source: 'database',
        sql_query: 'No se pudieron extraer términos de búsqueda',
        message: 'No se pudieron identificar términos válidos para buscar'
      };
    }
    
    const orConditions = words.map(term => `lemma.ilike.%${term}%`).join(',');
    
    const { data, error } = await supabaseClient
      .from('dictionary_entries')
      .select('lemma, key_value, etymology_info, total_senses')
      .or(orConditions)
      .limit(20);
    
    const sqlQuery = `SELECT lemma FROM dictionary_entries WHERE ${words.map(t => `lemma ILIKE '%${t}%'`).join(' OR ')}`;
    
    if (error) {
      console.error('Error en búsqueda tradicional:', error);
      return {
        results: [],
        source: 'database',
        sql_query: sqlQuery,
        message: `Error en base de datos: ${error.message}`
      };
    }
    
    const results = data || [];
    console.log(`📋 Encontrados ${results.length} resultados tradicionales`);
    
    return {
      results: results,
      source: 'database',
      sql_query: sqlQuery,
      message: results.length > 0 
        ? `Encontrados ${results.length} resultados por palabras clave en diccionario migrado (52K entradas)`
        : `No se encontraron resultados en las 52K entradas migradas. Migración al 56% - más resultados disponibles pronto.`
    };
    
  } catch (error) {
    console.error('Excepción en búsqueda semántica:', error);
    return {
      results: [],
      source: 'database',
      sql_query: 'Error de conexión',
      message: `Error de conexión: ${error.message}`
    };
  }
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
    sql += ' LIMIT 5000';
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
    - Ordenar por w.word y limitar a 5000 resultados
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

    // 🎯 NUEVA ESTRATEGIA: Buscar primero en la base de datos migrada
    console.log('🔄 Intentando búsqueda directa en base migrada...');
    
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Buscar en la base de datos migrada primero
    const dbSearch = await searchMigratedDatabase(query, supabase);
    
    if (dbSearch.results.length > 0) {
      console.log(`✅ Encontrados ${dbSearch.results.length} resultados en BD migrada, evitando Claude`);
      
      return new Response(
        JSON.stringify({
          results: dbSearch.results,
          sql: dbSearch.sql_query,
          message: dbSearch.message,
          source: 'migrated_database',
          total_count: dbSearch.results.length,
          query_processed: processedQuery,
          api_calls_saved: 1 // Llamada a Claude evitada
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    console.log('📝 No se encontraron resultados en BD migrada, usando Claude como fallback...');
    
    // Solo usar Claude si no hay resultados en la BD migrada
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\nConsulta: ${processedQuery}\n\nNOTA: No se encontraron resultados en el diccionario migrado (49K entradas). Genera SQL para tabla 'words' como fallback.`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const completion = await response.json();
    const rawSql = completion.content[0].text;
    console.log('SQL raw (fallback Claude):', rawSql);
    
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
