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
    console.log('🏗️ MISIÓN 1: Agregando columna norm_word con Service Role...')

    // Verificar que tenemos las variables de entorno
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }
    
    console.log('✅ Environment variables found')

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Usar PostgreSQL REST API directamente para ejecutar DDL
    const executeSQL = async (sql: string, description: string) => {
      console.log(`📝 ${description}`)
      
      try {
        // Método directo con Postgres
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          },
          body: JSON.stringify({ sql })
        })
        
        if (!response.ok) {
          // Intentar método alternativo con query directo
          console.log(`⚠️ RPC failed, trying direct query...`)
          
          // Para DDL usamos una consulta que siempre funciona
          const { data, error } = await supabaseAdmin
            .from('lexicon_indexes')
            .select('non_diac_word')
            .limit(1)
          
          if (error) {
            throw new Error(`Connection test failed: ${error.message}`)
          }
          
          console.log(`✅ Connection verified, executing SQL manually...`)
          
          // Ejecutar SQL via raw query
          const result = await supabaseAdmin.query(sql)
          return result
        }
        
        const result = await response.json()
        return result
        
      } catch (error) {
        console.error(`❌ Error in ${description}:`, error)
        throw error
      }
    }

    // Paso 1: Agregar columna
    await executeSQL(
      'ALTER TABLE public.lexicon_indexes ADD COLUMN IF NOT EXISTS norm_word TEXT;',
      'Agregando columna norm_word'
    )

    // Paso 2: Actualizar con normalizaciones
    await executeSQL(`
      UPDATE public.lexicon_indexes 
      SET norm_word = REPLACE(REPLACE(REPLACE(
        UPPER(non_diac_word), 
        'CH', 'Ç'), 
        'LL', 'K'), 
        'RR', 'W')
      WHERE norm_word IS NULL OR norm_word = '';
    `, 'Aplicando normalizaciones Scrabble (CH→Ç, LL→K, RR→W)')

    // Paso 3: Crear índice
    await executeSQL(
      'CREATE INDEX IF NOT EXISTS idx_lexicon_norm_word ON public.lexicon_indexes(norm_word);',
      'Creando índice en norm_word'
    )

    // Verificar resultados
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('lexicon_indexes')
      .select('non_diac_word, norm_word')
      .not('norm_word', 'is', null)
      .limit(10)

    if (sampleError) {
      throw new Error(`Error verificando resultados: ${sampleError.message}`)
    }

    console.log('✅ Misión 1 completada exitosamente')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Columna norm_word agregada y poblada exitosamente',
        normalization_rules: {
          'CH': 'Ç',
          'LL': 'K', 
          'RR': 'W'
        },
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