#!/usr/bin/env node
/**
 * Ejecutor de SQL para sistema de entrenamiento
 * Aplica setup-training-system.sql a Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://duxzmtvrcaphljakflod.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjUzNzgzOSwiZXhwIjoyMDUyMTEzODM5fQ.H4XC4Bf81SidVk8UhrzCYmRCqBQdNEeKaKNV8F-e47U';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath) {
  console.log('🚀 EJECUTANDO SETUP DEL SISTEMA DE ENTRENAMIENTO');
  console.log('=================================================\n');
  
  try {
    // Leer el archivo SQL
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Dividir en statements individuales (por seguridad)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    console.log(`📄 Encontrados ${statements.length} statements SQL`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      try {
        console.log(`⚡ Ejecutando statement ${i + 1}/${statements.length}...`);
        
        // Ejecutar usando rpc o query directo
        const { data, error } = await supabase.rpc('sql', { 
          query: statement + ';' 
        }).catch(async () => {
          // Si rpc no funciona, intentar con query directo
          return await supabase
            .from('_sql_exec')
            .select('*')
            .eq('query', statement + ';')
            .single()
            .catch(() => {
              // Último recurso: POST directo a la API REST
              return fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${supabaseServiceKey}`,
                  'Content-Type': 'application/json',
                  'apikey': supabaseServiceKey
                },
                body: JSON.stringify({ query: statement + ';' })
              }).then(res => res.json());
            });
        });
        
        if (error) {
          console.log(`❌ Error en statement ${i + 1}: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} ejecutado exitosamente`);
          successCount++;
        }
        
      } catch (err) {
        console.log(`❌ Excepción en statement ${i + 1}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 RESUMEN DE EJECUCIÓN');
    console.log('========================');
    console.log(`✅ Exitosos: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📄 Total statements: ${statements.length}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 ¡SISTEMA DE ENTRENAMIENTO CONFIGURADO EXITOSAMENTE!');
      
      // Verificar las tablas creadas
      console.log('\n🔍 Verificando tablas creadas...');
      await verifyTables();
    } else {
      console.log('\n⚠️  Algunos statements fallaron. Revisa los errores arriba.');
    }
    
  } catch (error) {
    console.error('💥 Error crítico:', error.message);
    process.exit(1);
  }
}

async function verifyTables() {
  const tables = ['training_patterns', 'training_rules', 'training_sessions', 'training_logs'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`❌ Tabla ${table}: No existe o error - ${error.message}`);
      } else {
        console.log(`✅ Tabla ${table}: ${count || 0} registros`);
      }
    } catch (err) {
      console.log(`❌ Tabla ${table}: Error de verificación - ${err.message}`);
    }
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const sqlFile = process.argv[2] || 'setup-training-system.sql';
  executeSQLFile(sqlFile);
}

export { executeSQLFile };