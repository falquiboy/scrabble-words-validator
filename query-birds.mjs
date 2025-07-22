#!/usr/bin/env node
/**
 * 🐦 CONSULTA DIRECTA - NOMBRES DE PÁJAROS
 * Busca en la base de datos migrada (33K entradas)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function searchBirds() {
  console.log('🐦 BÚSQUEDA DE NOMBRES DE PÁJAROS');
  console.log('=================================');
  console.log('📊 Consultando base de datos migrada (33K entradas)...\n');

  // Términos relacionados con pájaros
  const birdTerms = [
    'pajaro', 'pájaro', 'ave', 'aves',
    'gallo', 'gallina', 'pollo', 'pato', 'pata',
    'aguila', 'águila', 'halcon', 'halcón',
    'loro', 'canario', 'jilguero', 'ruiseñor',
    'cuervo', 'paloma', 'gaviota', 'petrel',
    'cisne', 'grulla', 'flamenco', 'ñandú',
    'condor', 'cóndor', 'buho', 'búho',
    'lechuza', 'martin', 'martín', 'golondrina',
    'colibrí', 'colibri', 'picaflor', 'hornero',
    'benteveo', 'calandria', 'zorzal', 'turpial'
  ];

  let totalFound = 0;
  let allBirds = [];

  console.log('🔍 Buscando por términos específicos...\n');

  for (const term of birdTerms) {
    try {
      // Buscar en dictionary_entries
      const { data: entries, error } = await supabase
        .from('dictionary_entries')
        .select('key_value, lemma, etymology_info')
        .or(`lemma.ilike.%${term}%,etymology_info.ilike.%${term}%`)
        .limit(10);

      if (error) {
        console.log(`   ❌ Error buscando "${term}": ${error.message}`);
        continue;
      }

      if (entries && entries.length > 0) {
        console.log(`🐦 "${term.toUpperCase()}" - ${entries.length} resultado(s):`);
        entries.forEach(entry => {
          console.log(`   ✅ ${entry.lemma} (key: ${entry.key_value})`);
          if (entry.etymology_info) {
            console.log(`      📖 ${entry.etymology_info.substring(0, 80)}...`);
          }
          allBirds.push(entry);
        });
        totalFound += entries.length;
        console.log('');
      }
    } catch (error) {
      console.log(`   💥 Excepción buscando "${term}": ${error.message}`);
    }
  }

  // Búsqueda más amplia por categorías/definiciones
  console.log('🔍 Buscando en acepciones/definiciones...\n');

  try {
    const { data: senses, error: sensesError } = await supabase
      .from('dictionary_senses')
      .select(`
        key_value,
        definition,
        dictionary_entries!inner(lemma)
      `)
      .or('definition.ilike.%ave%,definition.ilike.%pájaro%,definition.ilike.%pajaro%')
      .limit(20);

    if (sensesError) {
      console.log(`❌ Error en acepciones: ${sensesError.message}`);
    } else if (senses && senses.length > 0) {
      console.log(`📖 DEFINICIONES que mencionan aves - ${senses.length} resultado(s):`);
      senses.forEach(sense => {
        console.log(`   ✅ ${sense.dictionary_entries?.lemma || 'N/A'}`);
        console.log(`      📝 ${sense.definition.substring(0, 100)}...`);
        console.log('');
      });
      totalFound += senses.length;
    }
  } catch (error) {
    console.log(`💥 Error en acepciones: ${error.message}`);
  }

  // Estadísticas finales
  console.log('📊 RESUMEN DE BÚSQUEDA');
  console.log('======================');
  console.log(`🐦 Total pájaros encontrados: ${totalFound}`);
  console.log(`📋 Base de datos actual: 33,000 entradas migradas`);
  console.log(`⏳ Progreso migración: 36% completo`);
  
  if (totalFound === 0) {
    console.log('\n💡 POSIBLES RAZONES:');
    console.log('   • Los nombres de pájaros están en entradas no migradas aún');
    console.log('   • Los términos están en formas conjugadas/plurales');
    console.log('   • Necesitamos buscar términos más específicos');
    console.log('\n🔄 Cuando la migración esté completa (640K palabras) tendremos:');
    console.log('   • Todos los nombres de aves del diccionario español');
    console.log('   • Formas conjugadas y plurales');
    console.log('   • Sinónimos y variantes regionales');
  }

  console.log('\n✨ Esta consulta es un ejemplo de lo que el agente entrenado podrá hacer!');
}

// Ejecutar búsqueda
searchBirds().catch(console.error);