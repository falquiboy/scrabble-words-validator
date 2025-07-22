#!/usr/bin/env node
/**
 * 🧠 ENTRENADOR TERMINAL SIMPLIFICADO
 * Entrena patrones directamente desde terminal
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log('🧠 ENTRENADOR TERMINAL DEL AGENTE SCRABBLE');
  console.log('==========================================\n');
  console.log('Comandos disponibles:');
  console.log('📋 node train.mjs list          - Ver patrones existentes');
  console.log('➕ node train.mjs add           - Agregar nuevo patrón');
  console.log('⚙️ node train.mjs rules         - Ver reglas');
  console.log('🔧 node train.mjs rule          - Crear nueva regla');
  console.log('📊 node train.mjs stats         - Ver estadísticas');
  console.log('💾 node train.mjs export        - Exportar patrones');
  console.log('📥 node train.mjs import <file> - Importar desde JSON');
  console.log('\nMigración actual: 32K/91K entradas (35%)\n');
  process.exit(0);
}

async function listPatterns() {
  console.log('📋 PATRONES EXISTENTES');
  console.log('======================\n');
  
  try {
    const { data, error } = await supabase
      .from('training_patterns')
      .select('*')
      .eq('active', true);
      
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('🔍 No hay patrones registrados');
      return;
    }
    
    data.forEach((pattern, index) => {
      console.log(`${index + 1}. ${pattern.pattern_id}`);
      console.log(`   📂 Tipo: ${pattern.pattern_type}`);
      console.log(`   📝 Regla: ${pattern.pattern_rule}`);
      console.log(`   🎯 Confianza: ${pattern.confidence}`);
      console.log(`   📊 Usos: ${pattern.usage_count}`);
      if (pattern.examples) {
        console.log(`   💡 Ejemplos: ${JSON.stringify(pattern.examples)}`);
      }
      console.log('');
    });
  } catch (error) {
    console.log(`💥 Error de conexión: ${error.message}`);
  }
}

async function addPattern() {
  console.log('➕ AGREGAR NUEVO PATRÓN');
  console.log('========================\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const prompt = (question) => new Promise(resolve => rl.question(question, resolve));
  
  try {
    const patternType = await prompt('📂 Tipo de patrón (ej: busqueda_palabras): ');
    const patternRule = await prompt('📝 Regla en lenguaje natural: ');
    const sqlTemplate = await prompt('🔍 Template SQL (opcional): ');
    const examplesInput = await prompt('💡 Ejemplos JSON (opcional): ');
    const confidenceInput = await prompt('🎯 Confianza (0-1, default 0.7): ');
    
    const confidence = parseFloat(confidenceInput) || 0.7;
    let examples = [];
    
    if (examplesInput.trim()) {
      try {
        examples = JSON.parse(examplesInput);
      } catch (error) {
        console.log('⚠️ JSON inválido, usando array vacío');
      }
    }

    const newPattern = {
      pattern_id: `pattern_${Date.now()}`,
      pattern_type: patternType,
      pattern_rule: patternRule,
      sql_template: sqlTemplate || null,
      confidence: confidence,
      usage_count: 0,
      examples: examples,
      active: true,
      created_by: 'terminal_trainer'
    };

    const { error } = await supabase
      .from('training_patterns')
      .insert(newPattern);
      
    if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else {
      console.log(`✅ Patrón creado: ${newPattern.pattern_id}`);
    }
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  } finally {
    rl.close();
  }
}

async function listRules() {
  console.log('⚙️ REGLAS EXISTENTES');
  console.log('====================\n');
  
  try {
    const { data, error } = await supabase
      .from('training_rules')
      .select('*')
      .eq('active', true);
      
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('🔍 No hay reglas registradas');
      return;
    }
    
    data.forEach((rule, index) => {
      console.log(`${index + 1}. ${rule.rule_id}`);
      console.log(`   📝 Nombre: ${rule.rule_name}`);
      console.log(`   🔍 Condición: ${rule.condition_pattern}`);
      console.log(`   ⚡ Acción: ${rule.action_type}`);
      console.log(`   🎯 Confianza: ${rule.confidence}`);
      console.log(`   👤 Creador: ${rule.creator}`);
      if (rule.parameters && Object.keys(rule.parameters).length > 0) {
        console.log(`   ⚙️ Parámetros: ${JSON.stringify(rule.parameters)}`);
      }
      console.log('');
    });
  } catch (error) {
    console.log(`💥 Error de conexión: ${error.message}`);
  }
}

async function showStats() {
  console.log('📊 ESTADÍSTICAS DEL SISTEMA');
  console.log('============================\n');
  
  try {
    const { data: patterns } = await supabase
      .from('training_patterns')
      .select('*')
      .eq('active', true);
      
    const { data: rules } = await supabase
      .from('training_rules')
      .select('*')
      .eq('active', true);
      
    const { data: sessions } = await supabase
      .from('training_sessions')
      .select('*');

    console.log(`📋 Total patrones: ${patterns?.length || 0}`);
    console.log(`⚙️ Total reglas: ${rules?.length || 0}`);
    console.log(`👥 Total sesiones: ${sessions?.length || 0}`);
    
    if (patterns && patterns.length > 0) {
      const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
      console.log(`🎯 Confianza promedio: ${avgConfidence.toFixed(2)}`);
      
      const typeCount = patterns.reduce((acc, p) => {
        acc[p.pattern_type] = (acc[p.pattern_type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n📈 Patrones por tipo:');
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    }
    
    if (rules && rules.length > 0) {
      const rulesByType = rules.reduce((acc, rule) => {
        acc[rule.action_type] = (acc[rule.action_type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\n⚡ Reglas por tipo:');
      Object.entries(rulesByType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    }
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

async function exportPatterns() {
  console.log('💾 EXPORTANDO PATRONES...\n');
  
  try {
    const { data: patterns } = await supabase
      .from('training_patterns')
      .select('*');
      
    const { data: rules } = await supabase
      .from('training_rules')
      .select('*');

    const exportData = {
      version: "2.0",
      exported_at: new Date().toISOString(),
      patterns: patterns || [],
      rules: rules || [],
      total_patterns: patterns?.length || 0,
      total_rules: rules?.length || 0
    };
    
    const filename = `training_export_${Date.now()}.json`;
    const fs = await import('fs');
    fs.default.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Exportado a: ${filename}`);
    console.log(`📊 ${exportData.total_patterns} patrones, ${exportData.total_rules} reglas`);
    
  } catch (error) {
    console.log(`💥 Error: ${error.message}`);
  }
}

// Ejecutar comando
switch (command) {
  case 'list':
    await listPatterns();
    break;
  case 'add':
    await addPattern();
    break;
  case 'rules':
    await listRules();
    break;
  case 'stats':
    await showStats();
    break;
  case 'export':
    await exportPatterns();
    break;
  default:
    console.log(`❌ Comando desconocido: ${command}`);
    console.log('Usa: node train.mjs para ver comandos disponibles');
}