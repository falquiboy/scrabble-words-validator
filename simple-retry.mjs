#!/usr/bin/env node
/**
 * 🔄 REINTENTO SIMPLE DE ENTRADAS FALTANTES
 * Versión simplificada sin workers paralelos
 */

import sqlite3 from 'sqlite3';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SQLITE_DB_PATH = '/Users/isaacfalconer/DB_sources/diccionario.db';
const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = new sqlite3.Database(SQLITE_DB_PATH);

console.log('🔄 REINTENTO SIMPLE DE ENTRADAS FALTANTES');
console.log('========================================');

let successCount = 0;
let errorCount = 0;
let processedCount = 0;

async function findMissingEntries() {
  console.log('🔍 Identificando entradas faltantes...');
  
  // Obtener todas las key_value migradas
  const { data: migratedEntries } = await supabase
    .from('dictionary_entries')
    .select('key_value');
  
  const migratedKeys = new Set(migratedEntries.map(e => e.key_value));
  console.log(`✅ ${migratedKeys.size} entradas ya migradas`);
  
  // Obtener todas las entries de SQLite
  const sqliteEntries = await new Promise((resolve, reject) => {
    db.all('SELECT key, lemma FROM entries ORDER BY key', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  const missingEntries = sqliteEntries.filter(entry => !migratedKeys.has(entry.key));
  console.log(`❌ ${missingEntries.length} entradas faltantes de ${sqliteEntries.length} total`);
  
  return missingEntries;
}

async function getEntryData(key) {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT e.key, e.lemma, e.etymology_info, e.parenthesis_info,
             COUNT(s.id) as total_senses
      FROM entries e
      LEFT JOIN senses s ON e.key = s.entry_key
      WHERE e.key = ?
      GROUP BY e.key
    `, [key], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function getSenses(entryKey) {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM senses WHERE entry_key = ? ORDER BY sense_number
    `, [entryKey], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function retryEntry(entryKey) {
  try {
    // 1. Obtener datos de la entrada
    const entryData = await getEntryData(entryKey);
    if (!entryData) {
      throw new Error(`Entry ${entryKey} not found in SQLite`);
    }
    
    // 2. Insertar entrada
    const { error: entryError } = await supabase
      .from('dictionary_entries')
      .insert({
        key_value: entryData.key,
        lemma: entryData.lemma,
        etymology_info: entryData.etymology_info,
        parenthesis_info: entryData.parenthesis_info,
        total_senses: entryData.total_senses
      });
    
    if (entryError && entryError.code !== '23505') {
      throw entryError;
    }
    
    // 3. Migrar senses
    const senses = await getSenses(entryKey);
    if (senses.length > 0) {
      const sensesToInsert = senses.map(sense => ({
        entry_id: entryKey,
        sense_number: sense.sense_number,
        definition: sense.definition,
        gender_code: sense.gender_code ? JSON.parse(sense.gender_code) : null,
        pos_code: sense.pos_code,
        pos_secondary_code: sense.pos_secondary_code ? JSON.parse(sense.pos_secondary_code) : null,
        verb_type_code: sense.verb_type_code,
        usage_frequency_code: sense.usage_frequency_code ? JSON.parse(sense.usage_frequency_code) : null,
        style_code: sense.style_code ? JSON.parse(sense.style_code) : null,
        region_code: sense.region_code ? JSON.parse(sense.region_code) : null,
        domain_code: sense.domain_code ? JSON.parse(sense.domain_code) : null,
        is_cross_reference: sense.is_cross_reference === 1
      }));
      
      const { error: sensesError } = await supabase
        .from('dictionary_senses')
        .insert(sensesToInsert);
      
      if (sensesError && sensesError.code !== '23505') {
        throw sensesError;
      }
    }
    
    successCount++;
    return true;
    
  } catch (error) {
    errorCount++;
    console.error(`❌ Error en entrada ${entryKey}: ${error.message}`);
    return false;
  }
}

async function main() {
  const startTime = Date.now();
  
  try {
    const missingEntries = await findMissingEntries();
    
    if (missingEntries.length === 0) {
      console.log('✅ No hay entradas faltantes');
      return;
    }
    
    console.log(`🚀 Iniciando reintento de ${missingEntries.length} entradas...`);
    
    for (let i = 0; i < missingEntries.length; i++) {
      const entry = missingEntries[i];
      processedCount++;
      
      await retryEntry(entry.key);
      
      if (processedCount % 100 === 0) {
        const progress = ((processedCount / missingEntries.length) * 100).toFixed(1);
        console.log(`📊 Progreso: ${processedCount}/${missingEntries.length} (${progress}%) | ✅ ${successCount} | ❌ ${errorCount}`);
      }
      
      // Pequeña pausa para no sobrecargar
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('\n🎉 REINTENTO COMPLETADO');
    console.log('======================');
    console.log(`⏱️  Duración: ${duration}s`);
    console.log(`✅ Exitosos: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📊 Tasa de éxito: ${((successCount / (successCount + errorCount)) * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('💥 Error general:', error.message);
  } finally {
    db.close();
  }
}

main();