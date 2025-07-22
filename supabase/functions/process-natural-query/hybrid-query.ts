/**
 * 🎯 CONSULTA HÍBRIDA - BASE DE DATOS + IA
 * Prioriza base de datos migrada, usa Claude como fallback
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

export async function processHybridQuery(
  query: string, 
  supabaseClient: any
): Promise<{ 
  results: any[], 
  source: 'database' | 'ai' | 'hybrid',
  sql_query?: string,
  message?: string 
}> {
  
  console.log('🔄 Procesando consulta híbrida:', query);
  
  // 1. Detectar tipo de consulta
  const queryType = detectQueryType(query);
  console.log('📂 Tipo detectado:', queryType);
  
  // 2. Intentar resolución con base de datos PRIMERO
  const dbResults = await searchInDatabase(query, queryType, supabaseClient);
  
  if (dbResults.results.length > 0) {
    console.log(`✅ Encontrados ${dbResults.results.length} resultados en BD`);
    return {
      ...dbResults,
      source: 'database',
      message: `Encontrados ${dbResults.results.length} resultados en diccionario (base migrada)`
    };
  }
  
  // 3. Si no encuentra nada, usar patrón simple sin IA (por ahora)
  console.log('🔍 No se encontraron resultados en BD, usando búsqueda amplia...');
  
  const expandedResults = await expandedSearch(query, supabaseClient);
  
  if (expandedResults.results.length > 0) {
    return {
      ...expandedResults,
      source: 'database',
      message: `Búsqueda amplia: ${expandedResults.results.length} resultados relacionados`
    };
  }
  
  // 4. Fallback: mensaje educativo (sin usar Claude por costos)
  return {
    results: [],
    source: 'database',
    message: `No se encontraron resultados para "${query}" en las 34,000 entradas migradas. La migración está al 37% - más resultados disponibles pronto.`,
    sql_query: 'SELECT COUNT(*) FROM dictionary_entries -- Base parcial consultada'
  };
}

function detectQueryType(query: string): string {
  const normalizedQuery = query.toLowerCase();
  
  // Detectar categorías específicas
  if (normalizedQuery.includes('pájaro') || normalizedQuery.includes('pajaro') || 
      normalizedQuery.includes('ave') || normalizedQuery.includes('aves')) {
    return 'animals_birds';
  }
  
  if (normalizedQuery.includes('pez') || normalizedQuery.includes('peces') ||
      normalizedQuery.includes('pescado')) {
    return 'animals_fish';
  }
  
  if (normalizedQuery.includes('flor') || normalizedQuery.includes('flores') ||
      normalizedQuery.includes('planta') || normalizedQuery.includes('plantas')) {
    return 'plants';
  }
  
  if (normalizedQuery.includes('color') || normalizedQuery.includes('colores')) {
    return 'colors';
  }
  
  if (normalizedQuery.includes('comida') || normalizedQuery.includes('alimento') ||
      normalizedQuery.includes('fruta') || normalizedQuery.includes('verdura')) {
    return 'food';
  }
  
  // Detectar patrones de búsqueda
  if (normalizedQuery.includes('que contengan') || normalizedQuery.includes('con la letra')) {
    return 'contains_letters';
  }
  
  if (normalizedQuery.includes('que empiecen') || normalizedQuery.includes('que comienzan')) {
    return 'starts_with';
  }
  
  if (normalizedQuery.includes('que terminen') || normalizedQuery.includes('que acaben')) {
    return 'ends_with';
  }
  
  return 'general';
}

async function searchInDatabase(
  query: string, 
  queryType: string, 
  supabaseClient: any
): Promise<{ results: any[], sql_query: string }> {
  
  let searchTerms: string[] = [];
  let sqlQuery = '';
  
  try {
    switch (queryType) {
      case 'animals_birds':
        searchTerms = [
          'pajaro', 'pájaro', 'ave', 'aves', 'gallo', 'gallina', 'pollo',
          'aguila', 'águila', 'halcon', 'halcón', 'loro', 'canario',
          'cuervo', 'paloma', 'gaviota', 'cisne', 'condor', 'cóndor',
          'buho', 'búho', 'lechuza', 'golondrina', 'colibrí', 'colibri',
          'benteveo', 'calandria', 'zorzal', 'avestruz'
        ];
        break;
        
      case 'animals_fish':
        searchTerms = [
          'pez', 'peces', 'pescado', 'trucha', 'salmon', 'salmón',
          'atún', 'atun', 'sardina', 'anchoa', 'merluza', 'lenguado',
          'tiburón', 'tiburon', 'raya', 'manta'
        ];
        break;
        
      case 'plants':
        searchTerms = [
          'flor', 'flores', 'planta', 'plantas', 'rosa', 'clavel',
          'tulipán', 'tulipan', 'margarita', 'girasol', 'orquídea',
          'orquidea', 'violeta', 'jazmín', 'jazmin', 'geranio'
        ];
        break;
        
      case 'colors':
        searchTerms = [
          'rojo', 'azul', 'verde', 'amarillo', 'negro', 'blanco',
          'gris', 'rosa', 'morado', 'violeta', 'naranja', 'marrón',
          'marron', 'celeste', 'turquesa', 'dorado', 'plateado'
        ];
        break;
        
      case 'contains_letters':
        // Extraer letras de la consulta
        const letterMatch = query.match(/con(?:tengan?)?\s+(?:la\s+letra\s+)?([a-záéíóúñ]+)/i);
        if (letterMatch) {
          const letters = letterMatch[1].toLowerCase();
          sqlQuery = `SELECT lemma, key_value FROM dictionary_entries WHERE lemma ILIKE '%${letters}%' LIMIT 20`;
        }
        break;
        
      case 'starts_with':
        const startMatch = query.match(/(?:empiecen|comienzan?)\s+(?:con\s+|por\s+)?([a-záéíóúñ]+)/i);
        if (startMatch) {
          const prefix = startMatch[1].toLowerCase();
          sqlQuery = `SELECT lemma, key_value FROM dictionary_entries WHERE lemma ILIKE '${prefix}%' LIMIT 20`;
        }
        break;
        
      default:
        // Búsqueda general por palabras clave
        const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        if (words.length > 0) {
          searchTerms = words;
        }
    }
    
    // Ejecutar búsqueda por términos específicos
    if (searchTerms.length > 0 && !sqlQuery) {
      const orConditions = searchTerms.map(term => `lemma.ilike.%${term}%`).join(',');
      const { data, error } = await supabaseClient
        .from('dictionary_entries')
        .select('lemma, key_value, etymology_info')
        .or(orConditions)
        .limit(30);
        
      sqlQuery = `SELECT lemma, key_value, etymology_info FROM dictionary_entries WHERE ${searchTerms.map(t => `lemma ILIKE '%${t}%'`).join(' OR ')} LIMIT 30`;
      
      if (error) {
        console.error('Error en búsqueda por términos:', error);
        return { results: [], sql_query: sqlQuery };
      }
      
      return { results: data || [], sql_query: sqlQuery };
    }
    
    // Ejecutar SQL directo si se generó
    if (sqlQuery) {
      const { data, error } = await supabaseClient.rpc('execute_sql', { query: sqlQuery });
      
      if (error) {
        console.error('Error ejecutando SQL:', error);
        return { results: [], sql_query: sqlQuery };
      }
      
      return { results: data || [], sql_query: sqlQuery };
    }
    
    return { results: [], sql_query: 'No se generó consulta específica' };
    
  } catch (error) {
    console.error('Error en searchInDatabase:', error);
    return { results: [], sql_query: `Error: ${error.message}` };
  }
}

async function expandedSearch(
  query: string, 
  supabaseClient: any
): Promise<{ results: any[], sql_query: string }> {
  
  // Búsqueda más amplia: tomar palabras de la consulta
  const words = query.toLowerCase()
    .replace(/[^\w\sáéíóúñ]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['que', 'con', 'los', 'las', 'del', 'una', 'para'].includes(w));
  
  if (words.length === 0) {
    return { results: [], sql_query: 'No se pudieron extraer palabras válidas' };
  }
  
  try {
    // Buscar cualquier palabra de la consulta en el lemma
    const orConditions = words.map(word => `lemma.ilike.%${word}%`).join(',');
    
    const { data, error } = await supabaseClient
      .from('dictionary_entries')
      .select('lemma, key_value, etymology_info')
      .or(orConditions)
      .limit(20);
    
    const sqlQuery = `SELECT lemma, key_value, etymology_info FROM dictionary_entries WHERE ${words.map(w => `lemma ILIKE '%${w}%'`).join(' OR ')} LIMIT 20`;
    
    if (error) {
      console.error('Error en búsqueda expandida:', error);
      return { results: [], sql_query: sqlQuery };
    }
    
    return { results: data || [], sql_query: sqlQuery };
    
  } catch (error) {
    console.error('Error en expandedSearch:', error);
    return { results: [], sql_query: `Error: ${error.message}` };
  }
}