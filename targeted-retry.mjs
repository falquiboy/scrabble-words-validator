#!/usr/bin/env node
/**
 * 🎯 REINTENTO DIRIGIDO POR RANGOS
 * Identifica y migra solo los rangos con entradas faltantes
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🎯 REINTENTO DIRIGIDO POR RANGOS');
console.log('================================');

async function identifyMissingRanges() {
  console.log('🔍 Identificando rangos específicos con entradas faltantes...');
  
  const problematicRanges = [
    { start: 10000, end: 20000, name: "10K-20K" },
    { start: 30000, end: 40000, name: "30K-40K" },
    { start: 40000, end: 50000, name: "40K-50K" },
    { start: 60000, end: 70000, name: "60K-70K" }
  ];
  
  const missingKeys = [];
  
  for (const range of problematicRanges) {
    console.log(`\\n📊 Analizando rango ${range.name}...`);
    
    // Obtener keys existentes en este rango
    const { data: existingEntries } = await supabase
      .from('dictionary_entries')
      .select('key_value')
      .gte('key_value', range.start)
      .lt('key_value', range.end)
      .order('key_value');
    
    const existingKeys = new Set(existingEntries?.map(e => e.key_value) || []);
    console.log(`   ✅ ${existingKeys.size} entradas existentes`);
    
    // Identificar keys faltantes en este rango
    const rangeMissing = [];
    for (let key = range.start; key < range.end; key++) {
      if (!existingKeys.has(key)) {
        rangeMissing.push(key);
      }
    }
    
    console.log(`   ❌ ${rangeMissing.length} entradas faltantes`);
    missingKeys.push(...rangeMissing);
    
    // Mostrar algunos ejemplos
    if (rangeMissing.length > 0) {
      const examples = rangeMissing.slice(0, 5);
      console.log(`   📋 Ejemplos faltantes: ${examples.join(', ')}${rangeMissing.length > 5 ? '...' : ''}`);
    }
  }
  
  console.log(`\\n📈 RESUMEN TOTAL:`);
  console.log(`❌ ${missingKeys.length} entradas faltantes identificadas`);
  
  return missingKeys;
}

async function retrySpecificKeys(keys) {
  if (keys.length === 0) {
    console.log('✅ No hay keys para reintentar');
    return;
  }
  
  console.log(`\\n🚀 INICIANDO REINTENTO DE ${keys.length} ENTRADAS ESPECÍFICAS`);
  console.log('================================================');
  
  let successCount = 0;
  let errorCount = 0;
  
  // Procesar en batches pequeños
  const batchSize = 50;
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(keys.length / batchSize);
    
    console.log(`\\n📦 Procesando batch ${batchNum}/${totalBatches} (${batch.length} entradas)`);
    
    for (const key of batch) {
      try {
        // Usar función para reinsertar desde la migración principal
        const { data, error } = await supabase.functions.invoke('apply-dictionary-migration', {
          body: { 
            action: 'retry_entry',
            entry_key: key
          }
        });
        
        if (error) {
          throw error;
        }
        
        if (data?.success) {
          successCount++;
          process.stdout.write('✅');
        } else {
          errorCount++;
          process.stdout.write('❌');
        }
        
      } catch (error) {
        errorCount++;
        process.stdout.write('❌');
        
        // Solo mostrar errores cada 10 para no llenar la consola
        if (errorCount % 10 === 0) {
          console.log(`\\n   ⚠️ Error en key ${key}: ${error.message}`);
        }
      }
    }
    
    const progress = (((i + batch.length) / keys.length) * 100).toFixed(1);
    console.log(`\\n   📊 Progreso: ${progress}% | ✅ ${successCount} | ❌ ${errorCount}`);
    
    // Pausa entre batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\\n🎉 REINTENTO COMPLETADO`);
  console.log('======================');
  console.log(`✅ Exitosos: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`📊 Tasa de éxito: ${((successCount / (successCount + errorCount)) * 100).toFixed(2)}%`);
}

async function main() {
  try {
    const missingKeys = await identifyMissingRanges();
    await retrySpecificKeys(missingKeys);
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

main();