-- TRAINING SYSTEM SETUP SQL
-- Execute this in Supabase SQL Editor
-- Creates all training tables and initial data

-- Tabla de patrones de entrenamiento
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

-- Tabla de reglas de entrenamiento
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

-- Tabla de sesiones de entrenamiento
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

-- Tabla de logs de entrenamiento
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_training_patterns_type ON training_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_training_patterns_active ON training_patterns(active);
CREATE INDEX IF NOT EXISTS idx_training_rules_active ON training_rules(active);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_mode ON training_sessions(mode);
CREATE INDEX IF NOT EXISTS idx_training_logs_session ON training_logs(session_id);

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_training_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para timestamps
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

-- Insertar patrón inicial migrado desde scrabble_agent_patterns.json
INSERT INTO training_patterns (
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
) ON CONFLICT (pattern_id) DO NOTHING;

-- Insertar reglas iniciales de producción
INSERT INTO training_rules (
  rule_id,
  rule_name,
  condition_pattern,
  action_type,
  parameters,
  creator
) VALUES 
(
  'limit_results_production',
  'Limitar resultados en producción',
  'mode=production AND result_count>100',
  'transform',
  '{"max_results": 100, "add_message": "Mostrando primeros 100 resultados"}'::jsonb,
  'system'
),
(
  'hide_sql_production',
  'Ocultar SQL en modo producción',
  'mode=production',
  'filter',
  '{"remove_fields": ["sql_query", "debug_info"]}'::jsonb,
  'system'
),
(
  'allow_all_superuser',
  'Permitir todo en modo superuser',
  'mode=superuser',
  'allow',
  '{}'::jsonb,
  'system'
) ON CONFLICT (rule_id) DO NOTHING;

-- Verificar creación de tablas
SELECT 
  'training_patterns' as table_name,
  COUNT(*) as records
FROM training_patterns
UNION ALL
SELECT 
  'training_rules' as table_name,
  COUNT(*) as records  
FROM training_rules
UNION ALL
SELECT 
  'training_sessions' as table_name,
  COUNT(*) as records
FROM training_sessions
UNION ALL
SELECT 
  'training_logs' as table_name,
  COUNT(*) as records
FROM training_logs;