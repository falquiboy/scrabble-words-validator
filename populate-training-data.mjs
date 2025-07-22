#!/usr/bin/env node
/**
 * Poblar datos iniciales en las tablas de entrenamiento
 * Usa API directa de Supabase (INSERT/UPSERT)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function populateTrainingData() {
  console.log('🌱 POBLANDO DATOS INICIALES DEL SISTEMA DE ENTRENAMIENTO');
  console.log('======================================================\n');

  // 1. Insertar patrón inicial (migrado desde JSON)
  console.log('📋 Insertando patrón inicial...');
  
  const initialPattern = {
    pattern_id: 'conjugacion_diacriticos_20250710_160038',
    pattern_type: 'conjugacion_diacriticos',
    pattern_rule: 'Cuando consulte lexicon_indexes.non_diac_word, recordar que faltan diacríticos',
    sql_template: 'SELECT non_diac_word FROM lexicon_indexes WHERE key_conj LIKE \'%{key_value}%\'',
    examples: ["mollizno -> molliznó", "cantara -> cantará"],
    confidence: 0.5,
    usage_count: 0,
    created_by: 'system_migration'
  };

  try {
    const { data, error } = await supabase
      .from('training_patterns')
      .upsert(initialPattern, { onConflict: 'pattern_id' })
      .select();
      
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   🔧 Código: ${error.code}`);
      console.log(`   📝 Detalles: ${JSON.stringify(error.details)}`);
    } else {
      console.log(`   ✅ Patrón insertado exitosamente`);
      console.log(`   📄 ID: ${initialPattern.pattern_id}`);
    }
  } catch (exception) {
    console.log(`   💥 Excepción: ${exception.message}`);
  }

  // 2. Insertar reglas iniciales
  console.log('\n⚙️ Insertando reglas iniciales...');
  
  const initialRules = [
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

  try {
    const { data, error } = await supabase
      .from('training_rules')
      .upsert(initialRules, { onConflict: 'rule_id' })
      .select();
      
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   🔧 Código: ${error.code}`);
      console.log(`   📝 Detalles: ${JSON.stringify(error.details)}`);
    } else {
      console.log(`   ✅ ${initialRules.length} reglas insertadas exitosamente`);
      initialRules.forEach(rule => {
        console.log(`   📄 ${rule.rule_id}: ${rule.rule_name}`);
      });
    }
  } catch (exception) {
    console.log(`   💥 Excepción: ${exception.message}`);
  }

  // 3. Verificar datos insertados
  console.log('\n🔍 VERIFICANDO DATOS INSERTADOS...');
  
  // Verificar patrones
  try {
    const { data, error, count } = await supabase
      .from('training_patterns')
      .select('*', { count: 'exact' });
      
    if (error) {
      console.log(`   ❌ Error verificando patrones: ${error.message}`);
    } else {
      console.log(`   ✅ training_patterns: ${count} registros`);
      if (data && data.length > 0) {
        console.log(`   📄 Muestra: ${data[0].pattern_id}`);
      }
    }
  } catch (exception) {
    console.log(`   💥 Excepción verificando patrones: ${exception.message}`);
  }

  // Verificar reglas
  try {
    const { data, error, count } = await supabase
      .from('training_rules')
      .select('*', { count: 'exact' });
      
    if (error) {
      console.log(`   ❌ Error verificando reglas: ${error.message}`);
    } else {
      console.log(`   ✅ training_rules: ${count} registros`);
      if (data && data.length > 0) {
        console.log(`   📄 Muestra: ${data[0].rule_id}`);
      }
    }
  } catch (exception) {
    console.log(`   💥 Excepción verificando reglas: ${exception.message}`);
  }

  // 4. Crear sesión de prueba
  console.log('\n🧪 CREANDO SESIÓN DE PRUEBA...');
  
  const testSession = {
    session_id: `test_session_${Date.now()}`,
    user_id: 'alfredo.falconer@gmail.com',
    mode: 'superuser',
    queries: [],
    corrections: [],
    rules_created: [],
    status: 'active'
  };

  try {
    const { data, error } = await supabase
      .from('training_sessions')
      .insert(testSession)
      .select();
      
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ Sesión de prueba creada: ${testSession.session_id}`);
    }
  } catch (exception) {
    console.log(`   💥 Excepción: ${exception.message}`);
  }

  console.log('\n🎯 RESUMEN FINAL');
  console.log('================');
  console.log('Si todos los pasos fueron exitosos, el sistema de entrenamiento está listo.');
  console.log('\n🚀 Próximos pasos:');
  console.log('1. Integrar TrainingSystemDemo en la aplicación React');
  console.log('2. Probar autenticación superuser');
  console.log('3. Verificar filtrado automático en modo producción');
  console.log('4. Comenzar entrenamiento con consultas reales');
}

populateTrainingData().catch(console.error);