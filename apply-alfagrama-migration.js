// Script para aplicar migración alfagrama via API REST
// Ejecuta directamente en Supabase usando Service Role Key

const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjUzNzgzOSwiZXhwIjoyMDUyMTEzODM5fQ.H4XC4Bf81SidVk8UhrzCYmRCqBQdNEeKaKNV8F-e47U'

async function applyAlfagramaMigration() {
  console.log('🎯 MISIÓN 2: Aplicando migración alfagrama...')
  
  try {
    // Paso 1: Verificar conexión
    console.log('📡 Verificando conexión...')
    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/lexicon_indexes?select=count&limit=1`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    })
    
    if (!testResponse.ok) {
      throw new Error(`Connection test failed: ${testResponse.status}`)
    }
    
    const testData = await testResponse.json()
    console.log(`✅ Conexión OK. Registros: ${testData[0]?.count}`)
    
    // Paso 2: Verificar si las columnas ya existen
    console.log('🔍 Verificando estructura de tabla...')
    const structureResponse = await fetch(`${SUPABASE_URL}/rest/v1/lexicon_indexes?select=norm_alph,norm_length&limit=1`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    })
    
    if (structureResponse.ok) {
      console.log('⚠️ Las columnas norm_alph y norm_length ya existen')
      const existingData = await structureResponse.json()
      console.log('📊 Datos existentes:', existingData[0])
    } else {
      console.log('📝 Las columnas no existen, necesitan ser creadas via SQL directo')
    }
    
    // Paso 3: Mostrar estado actual
    console.log('📊 Verificando datos norm_word existentes...')
    const normWordResponse = await fetch(`${SUPABASE_URL}/rest/v1/lexicon_indexes?select=non_diac_word,norm_word&not.norm_word.is.null&limit=5`, {
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY
      }
    })
    
    if (normWordResponse.ok) {
      const normWordData = await normWordResponse.json()
      console.log('✅ Datos norm_word encontrados:', normWordData.length)
      console.log('📝 Ejemplos:', normWordData.slice(0, 3))
    }
    
    console.log('\n🎯 PRÓXIMOS PASOS:')
    console.log('1. Las columnas norm_alph y norm_length necesitan ser agregadas via SQL directo')
    console.log('2. Función spanish_alphabetical_sort() necesita ser creada')
    console.log('3. UPDATE para poblar las columnas con alfagramas')
    console.log('4. Índices para optimización de búsqueda')
    console.log('\n💡 Necesitamos usar psql o Edge Function con exec_sql')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Ejecutar
applyAlfagramaMigration()