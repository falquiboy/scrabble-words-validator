#!/usr/bin/env node
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SQLITE_DB_PATH = '/Users/isaacfalconer/DB_sources/diccionario.db';
const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = new sqlite3.Database(SQLITE_DB_PATH);

console.log('🔬 AUDITORÍA PRECISA DE MIGRACIÓN');

async function getSQLiteData() {
  console.log('📊 SQLite: leyendo entradas...');
  return new Promise((resolve, reject) => {
    db.all(`SELECT seg.key_value, sen.lemma, COUNT(sen.sense_id) as sense_count
            FROM segments seg 
            LEFT JOIN senses sen ON seg.key_value = sen.key_value
            GROUP BY seg.key_value, sen.lemma 
            ORDER BY seg.key_value LIMIT 5000`, (err, rows) => {
      if (err) reject(err);
      else {
        console.log(`✅ SQLite muestra: ${rows.length} entradas`);
        resolve(rows);
      }
    });
  });
}

async function getSupabaseData() {
  console.log('📊 Supabase: consultando entradas...');
  let allEntries = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('dictionary_entries')
      .select('key_value, lemma, total_senses')
      .range(from, from + batchSize - 1)
      .order('key_value');
    
    if (error || !data || data.length === 0) break;
    allEntries.push(...data);
    from += batchSize;
    
    if (from > 10000) break; // Limitar para prueba
  }
  
  console.log(`✅ Supabase muestra: ${allEntries.length} entradas`);
  return allEntries;
}

async function main() {
  try {
    const [sqliteEntries, supabaseEntries] = await Promise.all([
      getSQLiteData(),
      getSupabaseData()
    ]);
    
    const sqliteMap = new Map(sqliteEntries.map(e => [e.key_value, e]));
    const supabaseMap = new Map(supabaseEntries.map(e => [e.key_value, e]));
    
    // Entradas completamente faltantes
    const missing = [];
    for (const [key] of sqliteMap) {
      if (!supabaseMap.has(key)) missing.push(key);
    }
    
    // Entradas solo en Supabase
    const orphaned = [];
    for (const [key] of supabaseMap) {
      if (!sqliteMap.has(key)) orphaned.push(key);
    }
    
    console.log('\n📊 RESULTADOS:');
    console.log(`❌ Faltantes: ${missing.length}`);
    console.log(`🤔 Huérfanas: ${orphaned.length}`);
    
    if (missing.length > 0) {
      console.log(`📋 Faltantes ejemplo: ${missing.slice(0,10).join(', ')}`);
    }
    
    if (orphaned.length > 0) {
      console.log(`📋 Huérfanas ejemplo: ${orphaned.slice(0,10).join(', ')}`);
    }
    
    console.log(`📊 Precisión: ${((sqliteEntries.length - missing.length) / sqliteEntries.length * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    db.close();
  }
}

main();