#!/usr/bin/env node
/**
 * 🔍 IDENTIFICAR ENTRADAS FALTANTES
 * Compara SQLite vs Supabase para encontrar entradas no migradas
 */

import sqlite3 from 'sqlite3';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SQLITE_DB_PATH = '/Users/isaacfalconer/DB_sources/diccionario.db';
const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🔍 IDENTIFICANDO ENTRADAS FALTANTES');
console.log('===================================');

try {
  // 1. Obtener todas las key_value de Supabase
  console.log('📊 Obteniendo entradas migradas de Supabase...');
  
  let migratedKeys = new Set();
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('dictionary_entries')
      .select('key_value')
      .range(from, from + batchSize - 1);
    
    if (error) {
      console.error('❌ Error obteniendo datos de Supabase:', error.message);
      process.exit(1);
    }
    
    if (!data || data.length === 0) break;
    
    data.forEach(entry => migratedKeys.add(entry.key_value));
    from += batchSize;
    
    process.stdout.write(`\r📈 Procesadas: ${migratedKeys.size} entradas migradas`);
  }
  
  console.log(`\n✅ Total entradas en Supabase: ${migratedKeys.size}`);
  
  // 2. Obtener todas las entries de SQLite
  console.log('\n📊 Obteniendo todas las entradas de SQLite...');
  
  const db = new sqlite3.Database(SQLITE_DB_PATH);
  
  const sqliteEntries = await new Promise((resolve, reject) => {
    db.all(
      'SELECT key, lemma FROM entries ORDER BY key',
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
  
  console.log(`✅ Total entradas en SQLite: ${sqliteEntries.length}`);
  
  // 3. Identificar faltantes
  console.log('\n🔍 Identificando entradas faltantes...');
  
  const missingEntries = [];
  const processedRanges = [];
  
  sqliteEntries.forEach((entry, index) => {
    if (!migratedKeys.has(entry.key)) {
      missingEntries.push({
        key: entry.key,
        lemma: entry.lemma,
        index: index
      });
    }
    
    // Identificar rangos procesados
    if (index % 1000 === 0) {
      processedRanges.push({
        start: index,
        end: Math.min(index + 999, sqliteEntries.length - 1),
        processed: true
      });
    }
  });
  
  console.log(`❌ Entradas faltantes: ${missingEntries.length}`);
  console.log(`✅ Entradas migradas: ${migratedKeys.size}`);
  console.log(`📊 Tasa de éxito: ${((migratedKeys.size / sqliteEntries.length) * 100).toFixed(2)}%`);
  
  // 4. Analizar patrones de errores
  console.log('\n📈 ANÁLISIS DE PATRONES DE ERROR:');
  
  // Agrupar por rangos
  const errorRanges = {};
  missingEntries.forEach(entry => {
    const range = Math.floor(entry.index / 1000) * 1000;
    if (!errorRanges[range]) {
      errorRanges[range] = [];
    }
    errorRanges[range].push(entry);
  });
  
  console.log('\n🗂️ DISTRIBUCIÓN DE ERRORES POR RANGO:');
  Object.keys(errorRanges)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .slice(0, 10) // Mostrar solo los primeros 10 rangos
    .forEach(range => {
      const count = errorRanges[range].length;
      const startRange = parseInt(range);
      const endRange = startRange + 999;
      console.log(`   📍 Rango ${startRange}-${endRange}: ${count} errores`);
    });
  
  // 5. Guardar entradas faltantes para reintento
  const retryData = {
    timestamp: new Date().toISOString(),
    totalSqliteEntries: sqliteEntries.length,
    totalMigratedEntries: migratedKeys.size,
    missingCount: missingEntries.length,
    successRate: ((migratedKeys.size / sqliteEntries.length) * 100).toFixed(2),
    missingEntries: missingEntries.slice(0, 5000), // Limitar para no crear archivo muy grande
    errorRanges: Object.keys(errorRanges).map(range => ({
      start: parseInt(range),
      end: parseInt(range) + 999,
      errorCount: errorRanges[range].length,
      sample: errorRanges[range].slice(0, 5)
    }))
  };
  
  fs.writeFileSync('./missing-entries.json', JSON.stringify(retryData, null, 2));
  console.log('\n💾 Entradas faltantes guardadas en: missing-entries.json');
  
  // 6. Mostrar ejemplos de entradas faltantes
  console.log('\n📋 EJEMPLOS DE ENTRADAS FALTANTES:');
  missingEntries.slice(0, 10).forEach((entry, i) => {
    console.log(`   ${i+1}. Key: ${entry.key} | Lemma: "${entry.lemma}" | Índice: ${entry.index}`);
  });
  
  if (missingEntries.length > 10) {
    console.log(`   ... y ${missingEntries.length - 10} más`);
  }
  
  db.close();
  
  console.log('\n🎯 PRÓXIMOS PASOS:');
  console.log('   1. Ejecutar retry-migration.mjs para reintentar entradas faltantes');
  console.log('   2. O esperar a que termine la migración principal y luego ejecutar retry');
  
} catch (error) {
  console.error('💥 Error:', error.message);
  process.exit(1);
}