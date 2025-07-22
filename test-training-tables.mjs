#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testTrainingTables() {
  console.log('🔍 VERIFICANDO ESTADO DE TABLAS DE ENTRENAMIENTO');
  console.log('================================================\n');
  
  const tables = ['training_patterns', 'training_rules', 'training_sessions', 'training_logs'];
  
  for (const table of tables) {
    try {
      console.log(`📋 Tabla: ${table}`);
      
      // Intentar select básico
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' });
        
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        console.log(`   🔧 Código: ${error.code}`);
        console.log(`   📝 Detalles: ${error.details}\n`);
      } else {
        console.log(`   ✅ Conexión exitosa`);
        console.log(`   📊 Registros: ${count}`);
        if (data && data.length > 0) {
          console.log(`   📄 Muestra:`, data[0]);
        }
        console.log('');
      }
    } catch (exception) {
      console.log(`   💥 Excepción: ${exception.message}\n`);
    }
  }
  
  // Test de inserción simple
  console.log('🧪 PROBANDO INSERCIÓN...');
  try {
    const { data, error } = await supabase
      .from('training_patterns')
      .insert({
        pattern_id: 'test_pattern',
        pattern_type: 'test',
        pattern_rule: 'test rule',
        created_by: 'test'
      });
      
    if (error) {
      console.log(`❌ Error inserción: ${error.message}`);
      console.log(`🔧 Código: ${error.code}`);
    } else {
      console.log(`✅ Inserción exitosa`);
      
      // Limpiar test
      await supabase
        .from('training_patterns')
        .delete()
        .eq('pattern_id', 'test_pattern');
    }
  } catch (error) {
    console.log(`💥 Excepción inserción: ${error.message}`);
  }
}

testTrainingTables();