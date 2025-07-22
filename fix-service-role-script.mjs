#!/usr/bin/env node
/**
 * Script corregido usando SERVICE_ROLE key para DDL operations
 * Esto debería funcionar después de crear las tablas
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjUzNzgzOSwiZXhwIjoyMDUyMTEzODM5fQ.H4XC4Bf81SidVk8UhrzCYmRCqBQdNEeKaKNV8F-e47U';

// Usar SERVICE ROLE key (no anon)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testServiceRoleAccess() {
  console.log('🔧 PROBANDO ACCESO CON SERVICE ROLE');
  console.log('==================================\n');

  // Test de acceso a tablas de entrenamiento
  try {
    const { data, error, count } = await supabase
      .from('training_patterns')
      .select('*', { count: 'exact' });
      
    if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else {
      console.log(`✅ training_patterns accesible: ${count} registros`);
      
      // Test de inserción con service role
      const testInsert = await supabase
        .from('training_patterns')
        .upsert({
          pattern_id: 'test_service_role',
          pattern_type: 'test',
          pattern_rule: 'Test de service role',
          created_by: 'service_role_test'
        }, { onConflict: 'pattern_id' });
        
      if (testInsert.error) {
        console.log(`❌ Error inserción: ${testInsert.error.message}`);
      } else {
        console.log(`✅ Inserción con service role exitosa`);
        
        // Limpiar test
        await supabase
          .from('training_patterns')
          .delete()
          .eq('pattern_id', 'test_service_role');
      }
    }
  } catch (exception) {
    console.log(`💥 Excepción: ${exception.message}`);
  }
  
  console.log('\n🎯 CONCLUSIÓN:');
  console.log('Si esto funciona, podemos usar el service role key para futuras operaciones DDL desde terminal.');
}

testServiceRoleAccess();