#!/usr/bin/env node
/**
 * 🔬 AUDITORÍA PRECISA DE MIGRACIÓN
 * Identifica entradas faltantes Y parcialmente migradas
 */

import sqlite3 from 'sqlite3';
import { createClient } from '@supabase/supabase-js';

const SQLITE_DB_PATH = '/Users/isaacfalconer/DB_sources/diccionario.db';
const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = new sqlite3.Database(SQLITE_DB_PATH);

console.log('🔬 AUDITORÍA PRECISA DE MIGRACIÓN');
console.log('=================================');

async function getSQLiteData() {
  console.log('📊 Analizando SQLite...');
  
  const entries = await new Promise((resolve, reject) => {
    db.all(`
      SELECT e.key, e.lemma, COUNT(s.id) as sense_count
      FROM entries e
      LEFT JOIN senses s ON e.key = s.entry_key
      GROUP BY e.key
      ORDER BY e.key
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log(`✅ SQLite: ${entries.length} entradas totales`);
  return entries;
}

async function getSupabaseData() {
  console.log('📊 Analizando Supabase...');
  
  // Obtener todas las entradas con su conteo de senses
  const { data: entries } = await supabase
    .from('dictionary_entries')
    .select(`
      key_value,
      lemma,
      total_senses,
      dictionary_senses(count)
    `);
  
  console.log(`✅ Supabase: ${entries?.length || 0} entradas totales`);
  return entries || [];
}

async function performPreciseAudit() {
  const [sqliteEntries, supabaseEntries] = await Promise.all([
    getSQLiteData(),
    getSupabaseData()
  ]);
  
  // Crear mapas para comparación eficiente
  const sqliteMap = new Map(sqliteEntries.map(e => [e.key, e]));
  const supabaseMap = new Map(supabaseEntries.map(e => [e.key_value, e]));
  
  console.log('\n🔍 ANÁLISIS DETALLADO:');
  console.log('=====================');
  
  // 1. Entradas completamente faltantes
  const completelyMissing = [];
  for (const [key, sqliteEntry] of sqliteMap) {
    if (!supabaseMap.has(key)) {
      completelyMissing.push(sqliteEntry);
    }
  }
  
  console.log(`❌ Entradas completamente faltantes: ${completelyMissing.length}`);
  if (completelyMissing.length > 0) {
    console.log('   📋 Ejemplos:', completelyMissing.slice(0, 5).map(e => `${e.key}:${e.lemma}`).join(', '));
  }
  
  // 2. Entradas con senses faltantes
  const partiallyMigrated = [];
  for (const [key, sqliteEntry] of sqliteMap) {
    const supabaseEntry = supabaseMap.get(key);
    if (supabaseEntry) {
      const actualSenses = supabaseEntry.dictionary_senses?.[0]?.count || 0;
      const expectedSenses = sqliteEntry.sense_count;
      
      if (actualSenses !== expectedSenses) {
        partiallyMigrated.push({
          key,
          lemma: sqliteEntry.lemma,
          expected: expectedSenses,
          actual: actualSenses,
          missing: expectedSenses - actualSenses
        });
      }
    }
  }
  
  console.log(`⚠️  Entradas con senses faltantes: ${partiallyMigrated.length}`);
  if (partiallyMigrated.length > 0) {
    console.log('   📋 Ejemplos:');
    partiallyMigrated.slice(0, 5).forEach(e => {
      console.log(`      ${e.key}:${e.lemma} - Esperado:${e.expected}, Actual:${e.actual}, Falta:${e.missing}`);
    });
  }
  
  // 3. Entradas huérfanas en Supabase
  const orphanedEntries = [];
  for (const [key, supabaseEntry] of supabaseMap) {
    if (!sqliteMap.has(key)) {
      orphanedEntries.push(supabaseEntry);
    }
  }
  
  console.log(`🤔 Entradas solo en Supabase (huérfanas): ${orphanedEntries.length}`);
  if (orphanedEntries.length > 0) {
    console.log('   📋 Ejemplos:', orphanedEntries.slice(0, 5).map(e => `${e.key_value}:${e.lemma}`).join(', '));
  }
  
  // 4. Resumen y estadísticas
  console.log('\n📊 RESUMEN FINAL:');
  console.log('=================');
  console.log(`📈 SQLite total: ${sqliteEntries.length}`);
  console.log(`📈 Supabase total: ${supabaseEntries.length}`);
  console.log(`❌ Completamente faltantes: ${completelyMissing.length}`);
  console.log(`⚠️  Parcialmente migradas: ${partiallyMigrated.length}`);
  console.log(`🤔 Huérfanas: ${orphanedEntries.length}`);
  
  const totalProblems = completelyMissing.length + partiallyMigrated.length;
  const successRate = ((sqliteEntries.length - totalProblems) / sqliteEntries.length * 100).toFixed(2);
  console.log(`📊 Tasa de migración correcta: ${successRate}%`);
  
  // 5. Generar reporte detallado
  const report = {
    timestamp: new Date().toISOString(),
    sqlite_total: sqliteEntries.length,
    supabase_total: supabaseEntries.length,
    completely_missing: completelyMissing.length,
    partially_migrated: partiallyMigrated.length,
    orphaned: orphanedEntries.length,
    success_rate: parseFloat(successRate),
    completely_missing_keys: completelyMissing.slice(0, 100).map(e => e.key),
    partially_migrated_details: partiallyMigrated.slice(0, 50),
    orphaned_keys: orphanedEntries.slice(0, 50).map(e => e.key_value)
  };
  
  console.log('\n💾 Guardando reporte detallado...');
  require('fs').writeFileSync('./migration-audit-report.json', JSON.stringify(report, null, 2));
  console.log('✅ Reporte guardado en: migration-audit-report.json');
  
  return report;
}

async function main() {
  try {
    await performPreciseAudit();
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    db.close();
  }
}

main();