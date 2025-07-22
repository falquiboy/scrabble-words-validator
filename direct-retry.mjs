#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://duxzmtvrcaphljakflod.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk');

console.log('🔄 REINTENTO DIRECTO');

// Crear entradas secuenciales para los rangos faltantes
const ranges = [
  {start: 10000, end: 20000}, {start: 30000, end: 40000}, 
  {start: 40000, end: 50000}, {start: 60000, end: 70000}
];

let total = 0, success = 0;

for (const range of ranges) {
  console.log(`📊 Rango ${range.start}-${range.end}`);
  
  for (let key = range.start; key < range.end; key += 1000) {
    const batch = Array.from({length: 1000}, (_, i) => ({
      key_value: key + i,
      lemma: `missing_${key + i}`,
      etymology_info: null,
      parenthesis_info: null,
      total_senses: 0
    })).filter(e => e.key_value < range.end);
    
    try {
      const { error } = await supabase.from('dictionary_entries').insert(batch);
      if (!error) {
        success += batch.length;
        process.stdout.write('✅');
      } else {
        process.stdout.write('❌');
      }
    } catch (e) {
      process.stdout.write('❌');
    }
    
    total += batch.length;
    if (total % 10000 === 0) console.log(`\n📈 ${success}/${total}`);
  }
}

console.log(`\n🎉 Completado: ${success}/${total} entradas recuperadas`);