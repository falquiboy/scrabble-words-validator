#!/usr/bin/env node
/**
 * Ejecutor SQL via Supabase API - Método correcto
 * Usa el client oficial de Supabase con service role key
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Usar las mismas credenciales que el migrator exitoso
const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

// Crear cliente
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function executeCreateTable(tableName, createTableSQL) {
  console.log(`🏗️  Creando tabla: ${tableName}`);
  
  try {
    // Método 1: Intentar crear directamente insertando un registro dummy para forzar la creación
    // Esto es un hack, pero es lo que funciona con las restricciones de Supabase
    
    // Para tables pattern, podemos crear el patrón directamente 
    if (tableName === 'training_patterns') {
      const { data, error } = await supabase
        .from('training_patterns')
        .select('pattern_id')
        .limit(1);
        
      if (error && error.message.includes('relation "training_patterns" does not exist')) {
        console.log(`❌ Tabla ${tableName} no existe - necesita ser creada manualmente`);
        return false;
      } else if (error) {
        console.log(`❌ Error verificando ${tableName}: ${error.message}`);
        return false;
      } else {
        console.log(`✅ Tabla ${tableName} ya existe`);
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    console.log(`❌ Excepción en ${tableName}: ${error.message}`);
    return false;
  }
}

async function insertInitialData() {
  console.log('\n📝 Insertando datos iniciales...');
  
  // Insertar patrón inicial
  try {
    const { data, error } = await supabase
      .from('training_patterns')
      .upsert({
        pattern_id: 'conjugacion_diacriticos_20250710_160038',
        pattern_type: 'conjugacion_diacriticos', 
        pattern_rule: 'Cuando consulte lexicon_indexes.non_diac_word, recordar que faltan diacríticos',
        sql_template: 'SELECT non_diac_word FROM lexicon_indexes WHERE key_conj LIKE \'%{key_value}%\'',
        examples: ["mollizno -> molliznó", "cantara -> cantará"],
        confidence: 0.5,
        usage_count: 0,
        created_by: 'system_migration'
      }, { onConflict: 'pattern_id' });
      
    if (error) {
      console.log(`❌ Error insertando patrón: ${error.message}`);
    } else {
      console.log(`✅ Patrón inicial insertado`);
    }
  } catch (error) {
    console.log(`❌ Excepción insertando patrón: ${error.message}`);
  }
  
  // Insertar reglas iniciales  
  try {
    const rules = [
      {
        rule_id: 'limit_results_production',
        rule_name: 'Limitar resultados en producción',
        condition_pattern: 'mode=production AND result_count>100',
        action_type: 'transform',
        parameters: { max_results: 100, add_message: "Mostrando primeros 100 resultados" },
        creator: 'system'
      },
      {
        rule_id: 'hide_sql_production', 
        rule_name: 'Ocultar SQL en modo producción',
        condition_pattern: 'mode=production',
        action_type: 'filter',
        parameters: { remove_fields: ["sql_query", "debug_info"] },
        creator: 'system'
      },
      {
        rule_id: 'allow_all_superuser',
        rule_name: 'Permitir todo en modo superuser', 
        condition_pattern: 'mode=superuser',
        action_type: 'allow',
        parameters: {},
        creator: 'system'
      }
    ];
    
    const { data, error } = await supabase
      .from('training_rules')
      .upsert(rules, { onConflict: 'rule_id' });
      
    if (error) {
      console.log(`❌ Error insertando reglas: ${error.message}`);
    } else {
      console.log(`✅ ${rules.length} reglas iniciales insertadas`);
    }
  } catch (error) {
    console.log(`❌ Excepción insertando reglas: ${error.message}`);
  }
}

async function verifySetup() {
  console.log('\n🔍 Verificando configuración...');
  
  const tables = [
    'training_patterns',
    'training_rules', 
    'training_sessions',
    'training_logs'
  ];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} registros`);
      }
    } catch (error) {
      console.log(`❌ ${table}: Excepción - ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 CONFIGURANDO SISTEMA DE ENTRENAMIENTO VIA API');
  console.log('=================================================\n');
  
  // Verificar conexión
  try {
    const { data, error } = await supabase
      .from('dictionary_entries')
      .select('entry_id')
      .limit(1);
      
    if (error) {
      console.log('❌ Error de conexión:', error.message);
      return;
    }
    
    console.log('✅ Conexión a Supabase exitosa\n');
  } catch (error) {
    console.log('❌ Excepción de conexión:', error.message);
    return;
  }
  
  // Intentar operaciones
  await insertInitialData();
  await verifySetup();
  
  console.log('\n🎯 RESULTADO:');
  console.log('Si las tablas NO existen, necesitas:');
  console.log('1. Crear las tablas manualmente en Supabase Dashboard');
  console.log('2. Luego ejecutar este script para los datos iniciales');
  console.log('\n📋 Te daré el SQL exacto para copy/paste...');
}

main().catch(console.error);