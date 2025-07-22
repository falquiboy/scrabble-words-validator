#!/usr/bin/env node
/**
 * Obtener información de conexión a la base de datos
 */

console.log('🔍 INFORMACIÓN DE CONEXIÓN SUPABASE');
console.log('===================================\n');

console.log('🌐 URL del proyecto:', 'https://duxzmtvrcaphljakflod.supabase.co');
console.log('📊 Dashboard:', 'https://supabase.com/dashboard/project/duxzmtvrcaphljakflod');

console.log('\n📋 Para obtener la connection string:');
console.log('1. Ve al dashboard: https://supabase.com/dashboard/project/duxzmtvrcaphljakflod');
console.log('2. Settings → Database (en el menú lateral)');
console.log('3. Busca "Connection string" o "URI"');
console.log('4. Copia la connection string que empiece con "postgresql://"');

console.log('\n🔧 Formato esperado:');
console.log('postgresql://postgres.duxzmtvrcaphljakflod:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres');

console.log('\n⚡ Una vez que tengas la connection string:');
console.log('export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"');
console.log('psql "postgresql://postgres.duxzmtvrcaphljakflod:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres" -f setup-training-system.sql');

console.log('\n🚨 ALTERNATIVA MÁS FÁCIL:');
console.log('Si no encuentras la contraseña, puedes:');
console.log('1. Copy/paste el SQL en el dashboard (2 minutos)');
console.log('2. O usar supabase CLI con: npx supabase link --project-ref duxzmtvrcaphljakflod');

console.log('\n¿Qué prefieres?');
console.log('A) 🔍 Buscar la contraseña en dashboard y usar psql');
console.log('B) 📋 Copy/paste SQL en dashboard (más rápido)');
console.log('C) 🔧 Configurar supabase CLI correctamente');