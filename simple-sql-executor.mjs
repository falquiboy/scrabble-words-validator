#!/usr/bin/env node
/**
 * Ejecutor simple de SQL para Supabase
 * Usa fetch directo a la API REST
 */

import fs from 'fs';

const supabaseUrl = 'https://duxzmtvrcaphljakflod.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjUzNzgzOSwiZXhwIjoyMDUyMTEzODM5fQ.H4XC4Bf81SidVk8UhrzCYmRCqBQdNEeKaKNV8F-e47U';

async function executeSQL(sqlQuery) {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sqlQuery })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return { success: true, data: await response.text() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function setupTrainingSystem() {
  console.log('🚀 CONFIGURANDO SISTEMA DE ENTRENAMIENTO');
  console.log('==========================================\n');

  // SQL statements individuales para mayor control
  const sqlStatements = [
    {
      name: 'Crear tabla training_patterns',
      sql: `CREATE TABLE IF NOT EXISTS training_patterns (
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
      );`
    },
    {
      name: 'Crear tabla training_rules',
      sql: `CREATE TABLE IF NOT EXISTS training_rules (
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
      );`
    },
    {
      name: 'Crear tabla training_sessions',
      sql: `CREATE TABLE IF NOT EXISTS training_sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        mode TEXT NOT NULL CHECK (mode IN ('superuser', 'production')),
        queries JSONB DEFAULT '[]'::jsonb,
        corrections JSONB DEFAULT '[]'::jsonb,
        rules_created JSONB DEFAULT '[]'::jsonb,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        status TEXT DEFAULT 'active'
      );`
    },
    {
      name: 'Crear tabla training_logs',
      sql: `CREATE TABLE IF NOT EXISTS training_logs (
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
      );`
    },
    {
      name: 'Insertar patrón inicial',
      sql: `INSERT INTO training_patterns (
        pattern_id, 
        pattern_type, 
        pattern_rule, 
        sql_template,
        examples,
        confidence,
        usage_count,
        created_by
      ) VALUES (
        'conjugacion_diacriticos_20250710_160038',
        'conjugacion_diacriticos',
        'Cuando consulte lexicon_indexes.non_diac_word, recordar que faltan diacríticos',
        'SELECT non_diac_word FROM lexicon_indexes WHERE key_conj LIKE ''%{key_value}%''',
        '["mollizno -> molliznó", "cantara -> cantará"]'::jsonb,
        0.5,
        0,
        'system_migration'
      ) ON CONFLICT (pattern_id) DO NOTHING;`
    },
    {
      name: 'Insertar reglas iniciales',
      sql: `INSERT INTO training_rules (rule_id, rule_name, condition_pattern, action_type, parameters, creator) VALUES 
      ('limit_results_production', 'Limitar resultados en producción', 'mode=production AND result_count>100', 'transform', '{"max_results": 100, "add_message": "Mostrando primeros 100 resultados"}'::jsonb, 'system'),
      ('hide_sql_production', 'Ocultar SQL en modo producción', 'mode=production', 'filter', '{"remove_fields": ["sql_query", "debug_info"]}'::jsonb, 'system'),
      ('allow_all_superuser', 'Permitir todo en modo superuser', 'mode=superuser', 'allow', '{}'::jsonb, 'system') 
      ON CONFLICT (rule_id) DO NOTHING;`
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const statement of sqlStatements) {
    console.log(`⚡ ${statement.name}...`);
    
    const result = await executeSQL(statement.sql);
    
    if (result.success) {
      console.log(`✅ ${statement.name} - Exitoso`);
      successCount++;
    } else {
      console.log(`❌ ${statement.name} - Error: ${result.error}`);
      errorCount++;
    }
  }

  console.log('\n📊 RESUMEN');
  console.log('==========');
  console.log(`✅ Exitosos: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n🎉 ¡SISTEMA DE ENTRENAMIENTO CONFIGURADO!');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Verificar tablas en Supabase Dashboard');
    console.log('2. Integrar TrainingSystemDemo en la app');
    console.log('3. Probar autenticación superuser');
  }
}

// Ejecutar
setupTrainingSystem().catch(console.error);