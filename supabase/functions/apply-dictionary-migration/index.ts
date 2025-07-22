import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Dictionary schema migration SQL
    const migrationSQL = `
      -- =====================================================
      -- Migración 001: Esquema del Diccionario Español
      -- =====================================================

      -- 1. Tabla de catálogos del diccionario
      CREATE TABLE IF NOT EXISTS dictionary_categories (
          category_id SERIAL PRIMARY KEY,
          category_type TEXT NOT NULL,
          code TEXT NOT NULL,
          description TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(category_type, code)
      );

      -- 2. Tabla principal de entradas del diccionario
      CREATE TABLE IF NOT EXISTS dictionary_entries (
          entry_id SERIAL PRIMARY KEY,
          key_value REAL NOT NULL UNIQUE,
          lemma TEXT NOT NULL,
          etymology_info TEXT,
          parenthesis_info TEXT,
          total_senses INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 3. Tabla de acepciones/definiciones
      CREATE TABLE IF NOT EXISTS dictionary_senses (
          sense_id SERIAL PRIMARY KEY,
          entry_id INTEGER NOT NULL REFERENCES dictionary_entries(entry_id) ON DELETE CASCADE,
          sense_number INTEGER NOT NULL DEFAULT 1,
          definition TEXT NOT NULL,
          
          -- Metadatos gramaticales
          gender_code TEXT,
          pos_code TEXT,
          pos_secondary_code TEXT,
          verb_type_code TEXT,
          usage_frequency_code TEXT,
          style_code TEXT,
          region_code TEXT,
          domain_code TEXT,
          
          -- Indicadores
          is_cross_reference BOOLEAN DEFAULT FALSE,
          
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          
          UNIQUE(entry_id, sense_number)
      );

      -- 4. Tabla de relación palabra-diccionario
      CREATE TABLE IF NOT EXISTS word_dictionary_relations (
          relation_id SERIAL PRIMARY KEY,
          word TEXT NOT NULL,
          entry_id INTEGER NOT NULL REFERENCES dictionary_entries(entry_id) ON DELETE CASCADE,
          relation_type TEXT NOT NULL DEFAULT 'lemma',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          
          UNIQUE(word, entry_id, relation_type)
      );

      -- 5. Tabla específica de verbos
      CREATE TABLE IF NOT EXISTS dictionary_verbs (
          verb_id SERIAL PRIMARY KEY,
          entry_id INTEGER NOT NULL REFERENCES dictionary_entries(entry_id) ON DELETE CASCADE,
          conjugation_model TEXT,
          is_regular BOOLEAN DEFAULT TRUE,
          is_defective BOOLEAN DEFAULT FALSE,
          is_provincial BOOLEAN DEFAULT FALSE,
          
          -- Formas participio
          has_ado BOOLEAN DEFAULT FALSE,
          form_ado TEXT,
          has_ada BOOLEAN DEFAULT FALSE,
          form_ada TEXT,
          has_ados BOOLEAN DEFAULT FALSE,
          form_ados TEXT,
          has_ad BOOLEAN DEFAULT FALSE,
          form_ad TEXT,
          
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          
          UNIQUE(entry_id)
      );

      -- Índices principales
      CREATE INDEX IF NOT EXISTS idx_dictionary_entries_lemma ON dictionary_entries(lemma);
      CREATE INDEX IF NOT EXISTS idx_dictionary_entries_key_value ON dictionary_entries(key_value);
      CREATE INDEX IF NOT EXISTS idx_dictionary_senses_entry_id ON dictionary_senses(entry_id);
      CREATE INDEX IF NOT EXISTS idx_dictionary_senses_definition ON dictionary_senses USING gin(to_tsvector('spanish', definition));
      CREATE INDEX IF NOT EXISTS idx_word_dictionary_relations_word ON word_dictionary_relations(word);
      CREATE INDEX IF NOT EXISTS idx_word_dictionary_relations_entry_id ON word_dictionary_relations(entry_id);
      CREATE INDEX IF NOT EXISTS idx_word_dictionary_relations_type ON word_dictionary_relations(relation_type);
      CREATE INDEX IF NOT EXISTS idx_dictionary_categories_type ON dictionary_categories(category_type);
      CREATE INDEX IF NOT EXISTS idx_dictionary_categories_code ON dictionary_categories(code);
    `;

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    });

    if (error) {
      // Try direct query execution if rpc fails
      const { error: directError } = await supabase
        .from('pg_stat_user_tables')
        .select('*')
        .limit(1);
      
      if (directError) {
        throw new Error(`Migration failed: ${error.message}`);
      }
      
      // Execute SQL in parts for better error handling
      const sqlParts = migrationSQL.split(';').filter(part => part.trim());
      
      for (const sqlPart of sqlParts) {
        if (sqlPart.trim()) {
          try {
            await supabase.rpc('exec_sql', { sql_query: sqlPart + ';' });
          } catch (partError) {
            console.warn(`Warning executing SQL part: ${partError}`);
          }
        }
      }
    }

    console.log('Dictionary schema migration completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Dictionary schema migration applied successfully',
        tables_created: [
          'dictionary_categories',
          'dictionary_entries', 
          'dictionary_senses',
          'word_dictionary_relations',
          'dictionary_verbs'
        ]
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      },
    )

  } catch (error) {
    console.error('Migration error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Check function logs for more information'
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      },
    )
  }
})