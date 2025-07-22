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
    console.log('🎯 MISIÓN 2: Ejecutando migración alfagrama directamente en Supabase...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Ejecutar migración completa directamente usando SQL
    const migrationSQL = `
      -- MISION 2: Agregar columnas de alfagrama
      ALTER TABLE public.lexicon_indexes 
      ADD COLUMN IF NOT EXISTS norm_alph TEXT,
      ADD COLUMN IF NOT EXISTS norm_length INTEGER;

      -- Función para ordenar caracteres según alfabeto español: AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ
      CREATE OR REPLACE FUNCTION spanish_alphabetical_sort(input_word TEXT)
      RETURNS TEXT AS $$
      DECLARE
          char_order TEXT := 'AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ';
          result TEXT := '';
          char_array TEXT[];
          i INTEGER;
          j INTEGER;
          temp_char TEXT;
      BEGIN
          -- Convertir palabra a array de caracteres
          char_array := string_to_array(UPPER(input_word), NULL);
          
          -- Ordenamiento burbuja basado en posición en char_order
          FOR i IN 1..array_length(char_array, 1) LOOP
              FOR j IN 1..array_length(char_array, 1) - 1 LOOP
                  -- Obtener posiciones en el alfabeto español
                  IF COALESCE(POSITION(char_array[j] IN char_order), 999) > 
                     COALESCE(POSITION(char_array[j + 1] IN char_order), 999) THEN
                      -- Intercambiar caracteres
                      temp_char := char_array[j];
                      char_array[j] := char_array[j + 1];
                      char_array[j + 1] := temp_char;
                  END IF;
              END LOOP;
          END LOOP;
          
          -- Convertir array de vuelta a string
          result := array_to_string(char_array, '');
          
          RETURN result;
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;

      -- Poblar columnas con alfagramas y longitudes
      UPDATE public.lexicon_indexes 
      SET 
          norm_alph = spanish_alphabetical_sort(norm_word),
          norm_length = LENGTH(norm_word)
      WHERE norm_word IS NOT NULL;

      -- Crear índices para optimización
      CREATE INDEX IF NOT EXISTS idx_lexicon_norm_length ON public.lexicon_indexes(norm_length);
      CREATE INDEX IF NOT EXISTS idx_lexicon_norm_alph ON public.lexicon_indexes(norm_alph);
      CREATE INDEX IF NOT EXISTS idx_lexicon_length_alph ON public.lexicon_indexes(norm_length, norm_alph);
    `

    console.log('📝 Ejecutando migración SQL completa...')
    
    const { data: migrationResult, error: migrationError } = await supabaseAdmin.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (migrationError) {
      throw new Error(`Migration failed: ${migrationError.message}`)
    }

    console.log('✅ Migración ejecutada exitosamente')

    // Verificar resultados
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('lexicon_indexes')
      .select('non_diac_word, norm_word, norm_alph, norm_length')
      .not('norm_alph', 'is', null)
      .limit(10)

    if (sampleError) {
      throw new Error(`Error verificando resultados: ${sampleError.message}`)
    }

    // Contar registros procesados
    const { data: countData, error: countError } = await supabaseAdmin
      .from('lexicon_indexes')
      .select('count', { count: 'exact' })
      .not('norm_alph', 'is', null)

    console.log('🎉 Misión 2 completada exitosamente')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Columnas alfagrama agregadas y pobladas exitosamente',
        alphabet_order: 'AEIOUBCÇDFGHJLKMNÑPQRWSTVXYZ',
        records_processed: countData?.[0]?.count || 'Unknown',
        sample_results: sampleData?.slice(0, 5)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})