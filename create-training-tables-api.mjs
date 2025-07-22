#!/usr/bin/env node
/**
 * Creador de Tablas de Entrenamiento via API
 * Método robusto usando Supabase client
 */

import { createClient } from '@supabase/supabase-js';

// Configuración (misma que el migrator exitoso)
const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SQL statements para crear las tablas
const CREATE_TABLE_STATEMENTS = {
  training_patterns: `
    CREATE TABLE IF NOT EXISTS training_patterns (
      pattern_id TEXT PRIMARY KEY,
      pattern_type TEXT NOT NULL,
      pattern_rule TEXT NOT NULL,
      sql_template TEXT,
      confidence REAL DEFAULT 0.5,
      usage_count INTEGER DEFAULT 0,
      examples JSONB DEFAULT '[]'::jsonb,
      active BOOLEAN DEFAULT true,
      created_by TEXT DEFAULT 'system',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
  
  training_rules: `
    CREATE TABLE IF NOT EXISTS training_rules (
      rule_id TEXT PRIMARY KEY,
      rule_name TEXT NOT NULL,
      condition_pattern TEXT NOT NULL,
      action_type TEXT NOT NULL CHECK (action_type IN ('allow', 'filter', 'transform', 'deny')),
      parameters JSONB DEFAULT '{}'::jsonb,
      active BOOLEAN DEFAULT true,
      creator TEXT NOT NULL,
      confidence REAL DEFAULT 0.8,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `,
  
  training_sessions: `
    CREATE TABLE IF NOT EXISTS training_sessions (
      session_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('superuser', 'production')),
      queries JSONB DEFAULT '[]'::jsonb,
      corrections JSONB DEFAULT '[]'::jsonb,
      rules_created JSONB DEFAULT '[]'::jsonb,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      ended_at TIMESTAMPTZ,
      status TEXT DEFAULT 'active'
    );
  `,
  
  training_logs: `
    CREATE TABLE IF NOT EXISTS training_logs (
      log_id SERIAL PRIMARY KEY,
      session_id TEXT REFERENCES training_sessions(session_id),
      query_text TEXT NOT NULL,
      response_original JSONB,
      response_corrected JSONB,
      rule_applied TEXT,
      feedback TEXT,
      confidence_before REAL,
      confidence_after REAL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `
};

async function executeSQL(sql, description) {
  console.log(`⚡ ${description}...`);
  
  try {
    // Usar el endpoint RPC directo de Supabase para ejecutar SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ sql: sql.trim() })
    });

    if (response.ok) {
      console.log(`   ✅ ${description} - Exitoso`);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.log(`   ❌ ${description} - Error HTTP ${response.status}: ${errorText}`);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.log(`   💥 ${description} - Excepción: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function insertInitialData() {
  console.log('\n📝 INSERTANDO DATOS INICIALES...');
  
  // Patrón inicial migrado desde JSON
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
      .upsert(initialPattern, { onConflict: 'pattern_id' });
      
    if (error) {
      console.log(`   ❌ Error insertando patrón: ${error.message}`);
    } else {
      console.log(`   ✅ Patrón inicial insertado`);
    }
  } catch (error) {
    console.log(`   💥 Excepción insertando patrón: ${error.message}`);
  }

  // Reglas iniciales
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
      .upsert(initialRules, { onConflict: 'rule_id' });
      
    if (error) {
      console.log(`   ❌ Error insertando reglas: ${error.message}`);
    } else {
      console.log(`   ✅ ${initialRules.length} reglas iniciales insertadas`);
    }
  } catch (error) {
    console.log(`   💥 Excepción insertando reglas: ${error.message}`);
  }
}

async function verifyTables() {
  console.log('\n🔍 VERIFICANDO TABLAS CREADAS...');
  
  const tables = Object.keys(CREATE_TABLE_STATEMENTS);
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count || 0} registros`);
      }
    } catch (error) {
      console.log(`   💥 ${table}: Excepción - ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 CREANDO SISTEMA DE ENTRENAMIENTO VIA API');
  console.log('===========================================\n');

  // Verificar conexión primero
  try {
    const { data, error } = await supabase
      .from('dictionary_entries')
      .select('entry_id')
      .limit(1);
      
    if (error) {
      console.log('❌ Error de conexión a Supabase:', error.message);
      return;
    }
    
    console.log('✅ Conexión a Supabase verificada\n');
  } catch (error) {
    console.log('💥 Excepción de conexión:', error.message);
    return;
  }

  // Crear tablas una por una
  console.log('🏗️ CREANDO TABLAS...');
  let successCount = 0;
  let errorCount = 0;

  for (const [tableName, sql] of Object.entries(CREATE_TABLE_STATEMENTS)) {
    const result = await executeSQL(sql, `Crear tabla ${tableName}`);
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  // Crear índices
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_training_patterns_type ON training_patterns(pattern_type);',
    'CREATE INDEX IF NOT EXISTS idx_training_patterns_active ON training_patterns(active);',
    'CREATE INDEX IF NOT EXISTS idx_training_rules_active ON training_rules(active);',
    'CREATE INDEX IF NOT EXISTS idx_training_sessions_user ON training_sessions(user_id);',
    'CREATE INDEX IF NOT EXISTS idx_training_sessions_mode ON training_sessions(mode);',
    'CREATE INDEX IF NOT EXISTS idx_training_logs_session ON training_logs(session_id);'
  ];

  console.log('\n🔗 CREANDO ÍNDICES...');
  for (const indexSql of indexes) {
    await executeSQL(indexSql, 'Crear índice');
  }

  // Crear triggers
  const triggerSQL = `
    CREATE OR REPLACE FUNCTION update_training_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS training_patterns_updated_at ON training_patterns;
    CREATE TRIGGER training_patterns_updated_at
        BEFORE UPDATE ON training_patterns
        FOR EACH ROW
        EXECUTE FUNCTION update_training_timestamp();

    DROP TRIGGER IF EXISTS training_rules_updated_at ON training_rules;
    CREATE TRIGGER training_rules_updated_at
        BEFORE UPDATE ON training_rules
        FOR EACH ROW
        EXECUTE FUNCTION update_training_timestamp();
  `;

  console.log('\n⚙️ CREANDO TRIGGERS...');
  await executeSQL(triggerSQL, 'Crear triggers de timestamp');

  // Insertar datos iniciales
  await insertInitialData();

  // Verificar resultado final
  await verifyTables();

  console.log('\n📊 RESUMEN FINAL');
  console.log('================');
  console.log(`✅ Tablas creadas exitosamente: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 ¡SISTEMA DE ENTRENAMIENTO CONFIGURADO EXITOSAMENTE!');
    console.log('\n🚀 Próximos pasos:');
    console.log('1. Probar TrainingSystemDemo en la aplicación');
    console.log('2. Verificar autenticación superuser');
    console.log('3. Entrenar el agente con consultas reales');
  } else {
    console.log('\n⚠️ Algunos componentes fallaron - revisar errores arriba');
  }
}

main().catch(console.error);