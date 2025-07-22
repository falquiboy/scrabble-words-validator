#!/usr/bin/env node
/**
 * 🔍 VERIFICACIÓN RÁPIDA DE ENTRADAS FALTANTES
 * Identifica rápidamente qué entradas necesitan reintento
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function quickMissingCheck() {
  console.log('⚡ VERIFICACIÓN RÁPIDA DE PROGRESO');
  console.log('=================================');

  try {
    // 1. Leer progreso actual
    const progress = JSON.parse(fs.readFileSync('./migration-progress.json', 'utf8'));
    console.log(`📊 Progreso reportado: ${progress.entriesMigrated} entradas`);
    console.log(`❌ Errores reportados: ${progress.errors}`);

    // 2. Verificar conteo real en Supabase
    const { count: actualEntries, error: entriesError } = await supabase
      .from('dictionary_entries')
      .select('*', { count: 'exact', head: true });

    if (entriesError) {
      throw new Error(`Error contando entradas: ${entriesError.message}`);
    }

    const { count: actualSenses, error: sensesError } = await supabase
      .from('dictionary_senses')
      .select('*', { count: 'exact', head: true });

    if (sensesError) {
      throw new Error(`Error contando sentidos: ${sensesError.message}`);
    }

    console.log(`✅ Entradas reales en Supabase: ${actualEntries}`);
    console.log(`✅ Sentidos reales en Supabase: ${actualSenses}`);

    // 3. Calcular diferencias
    const missingEntries = progress.entriesMigrated - actualEntries;
    const missingSenses = progress.sensesMigrated - actualSenses;

    console.log(`\\n🔍 ANÁLISIS DE DIFERENCIAS:`);
    console.log(`📉 Entradas faltantes: ${missingEntries}`);
    console.log(`📉 Sentidos faltantes: ${missingSenses}`);

    // 4. Verificar rangos específicos con problemas
    console.log(`\\n🔍 VERIFICANDO RANGOS ESPECÍFICOS:`);
    
    const ranges = [
      { start: 0, end: 10000 },
      { start: 10000, end: 20000 },
      { start: 20000, end: 30000 },
      { start: 30000, end: 40000 },
      { start: 40000, end: 50000 },
      { start: 50000, end: 60000 },
      { start: 60000, end: 70000 },
      { start: 70000, end: 80000 }
    ];

    for (const range of ranges) {
      const { count, error } = await supabase
        .from('dictionary_entries')
        .select('*', { count: 'exact', head: true })
        .gte('key_value', range.start)
        .lt('key_value', range.end);

      if (!error) {
        const expected = Math.min(10000, progress.entriesMigrated - range.start);
        const actual = count || 0;
        const missing = Math.max(0, expected - actual);
        
        if (missing > 0) {
          console.log(`   📍 Rango ${range.start}-${range.end}: ${missing} faltantes (${actual}/${expected})`);
        } else {
          console.log(`   ✅ Rango ${range.start}-${range.end}: completo (${actual})`);
        }
      }
    }

    // 5. Recomendar acción
    console.log(`\\n🎯 RECOMENDACIÓN:`);
    if (missingEntries > 1000) {
      console.log(`   🔄 Ejecutar retry-migration.mjs para recuperar ${missingEntries} entradas`);
      console.log(`   💡 O esperar a que termine la migración principal y luego hacer retry completo`);
    } else if (missingEntries > 0) {
      console.log(`   ⚡ Solo ${missingEntries} entradas faltantes - retry rápido recomendado`);
    } else {
      console.log(`   ✅ No se detectaron entradas faltantes significativas`);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  }
}

quickMissingCheck();