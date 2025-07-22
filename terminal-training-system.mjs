#!/usr/bin/env node
/**
 * 🧠 SISTEMA DE ENTRENAMIENTO TERMINAL
 * Entrena el agente de IA directamente desde terminal
 * Almacena patrones y reglas en Supabase
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';
import fs from 'fs';

// Configuración de Supabase
const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Interface readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class TerminalTrainingSystem {
  constructor() {
    this.currentSession = null;
    this.patterns = [];
    this.rules = [];
  }

  async start() {
    console.log('🧠 SISTEMA DE ENTRENAMIENTO TERMINAL');
    console.log('====================================\n');
    
    await this.loadExistingData();
    await this.createSession();
    await this.mainMenu();
  }

  async loadExistingData() {
    console.log('📂 Cargando datos existentes...');
    
    try {
      // Cargar patrones
      const { data: patterns, error: patternsError } = await supabase
        .from('training_patterns')
        .select('*')
        .eq('active', true);
        
      if (patternsError) {
        console.log(`   ⚠️ Error cargando patrones: ${patternsError.message}`);
      } else {
        this.patterns = patterns || [];
        console.log(`   ✅ ${this.patterns.length} patrones cargados`);
      }

      // Cargar reglas
      const { data: rules, error: rulesError } = await supabase
        .from('training_rules')
        .select('*')
        .eq('active', true);
        
      if (rulesError) {
        console.log(`   ⚠️ Error cargando reglas: ${rulesError.message}`);
      } else {
        this.rules = rules || [];
        console.log(`   ✅ ${this.rules.length} reglas cargadas`);
      }
    } catch (error) {
      console.log(`   💥 Error de conexión: ${error.message}`);
    }
  }

  async createSession() {
    const sessionId = `terminal_session_${Date.now()}`;
    const session = {
      session_id: sessionId,
      user_id: 'terminal_trainer',
      mode: 'superuser',
      queries: [],
      corrections: [],
      rules_created: [],
      status: 'active'
    };

    try {
      const { error } = await supabase
        .from('training_sessions')
        .insert(session);
        
      if (error) {
        console.log(`   ⚠️ Error creando sesión: ${error.message}`);
      } else {
        this.currentSession = session;
        console.log(`   ✅ Sesión creada: ${sessionId}`);
      }
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  }

  async mainMenu() {
    console.log('\n🎛️ MENÚ PRINCIPAL');
    console.log('==================');
    console.log('1. 📋 Ver patrones existentes');
    console.log('2. ➕ Crear nuevo patrón');
    console.log('3. ⚙️ Ver reglas existentes');
    console.log('4. 🔧 Crear nueva regla');
    console.log('5. 🧪 Simular consulta');
    console.log('6. 📊 Ver estadísticas');
    console.log('7. 💾 Exportar patrones');
    console.log('8. 📥 Importar desde JSON');
    console.log('9. 🚪 Salir\n');

    const choice = await this.prompt('Selecciona una opción (1-9): ');
    
    switch (choice.trim()) {
      case '1': await this.viewPatterns(); break;
      case '2': await this.createPattern(); break;
      case '3': await this.viewRules(); break;
      case '4': await this.createRule(); break;
      case '5': await this.simulateQuery(); break;
      case '6': await this.showStats(); break;
      case '7': await this.exportPatterns(); break;
      case '8': await this.importFromJSON(); break;
      case '9': await this.exit(); return;
      default: 
        console.log('❌ Opción inválida');
        await this.mainMenu();
    }
  }

  async viewPatterns() {
    console.log('\n📋 PATRONES EXISTENTES');
    console.log('======================');
    
    if (this.patterns.length === 0) {
      console.log('🔍 No hay patrones registrados');
    } else {
      this.patterns.forEach((pattern, index) => {
        console.log(`\n${index + 1}. ${pattern.pattern_id}`);
        console.log(`   Tipo: ${pattern.pattern_type}`);
        console.log(`   Regla: ${pattern.pattern_rule}`);
        console.log(`   Confianza: ${pattern.confidence}`);
        console.log(`   Usos: ${pattern.usage_count}`);
        if (pattern.examples) {
          console.log(`   Ejemplos: ${JSON.stringify(pattern.examples)}`);
        }
      });
    }
    
    await this.prompt('\nPresiona Enter para continuar...');
    await this.mainMenu();
  }

  async createPattern() {
    console.log('\n➕ CREAR NUEVO PATRÓN');
    console.log('======================');
    
    const patternId = `pattern_${Date.now()}`;
    const patternType = await this.prompt('Tipo de patrón (ej: conjugacion_diacriticos): ');
    const patternRule = await this.prompt('Regla en lenguaje natural: ');
    const sqlTemplate = await this.prompt('Template SQL (opcional): ');
    const examplesInput = await this.prompt('Ejemplos JSON (opcional): ');
    const confidenceInput = await this.prompt('Confianza (0-1, default 0.7): ');
    
    const confidence = parseFloat(confidenceInput) || 0.7;
    let examples = [];
    
    if (examplesInput.trim()) {
      try {
        examples = JSON.parse(examplesInput);
      } catch (error) {
        console.log('⚠️ JSON de ejemplos inválido, usando array vacío');
      }
    }

    const newPattern = {
      pattern_id: patternId,
      pattern_type: patternType,
      pattern_rule: patternRule,
      sql_template: sqlTemplate || null,
      confidence: confidence,
      usage_count: 0,
      examples: examples,
      active: true,
      created_by: 'terminal_trainer'
    };

    try {
      const { error } = await supabase
        .from('training_patterns')
        .insert(newPattern);
        
      if (error) {
        console.log(`❌ Error guardando patrón: ${error.message}`);
      } else {
        console.log(`✅ Patrón creado exitosamente: ${patternId}`);
        this.patterns.push(newPattern);
      }
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
    }

    await this.prompt('\nPresiona Enter para continuar...');
    await this.mainMenu();
  }

  async createRule() {
    console.log('\n🔧 CREAR NUEVA REGLA');
    console.log('=====================');
    
    const ruleId = `rule_${Date.now()}`;
    const ruleName = await this.prompt('Nombre de la regla: ');
    const conditionPattern = await this.prompt('Patrón de condición (ej: mode=production AND result_count>100): ');
    
    console.log('\nTipos de acción:');
    console.log('1. allow - Permitir todo');
    console.log('2. filter - Filtrar campos');
    console.log('3. transform - Transformar respuesta');
    console.log('4. deny - Denegar completamente');
    
    const actionChoice = await this.prompt('Selecciona tipo de acción (1-4): ');
    const actionTypes = { '1': 'allow', '2': 'filter', '3': 'transform', '4': 'deny' };
    const actionType = actionTypes[actionChoice] || 'filter';
    
    let parameters = {};
    
    if (actionType === 'filter') {
      const fieldsToRemove = await this.prompt('Campos a remover (separados por coma): ');
      parameters = { remove_fields: fieldsToRemove.split(',').map(f => f.trim()) };
    } else if (actionType === 'transform') {
      const maxResults = await this.prompt('Máximo de resultados (opcional): ');
      const message = await this.prompt('Mensaje adicional (opcional): ');
      parameters = {};
      if (maxResults) parameters.max_results = parseInt(maxResults);
      if (message) parameters.add_message = message;
    } else if (actionType === 'deny') {
      const denyMessage = await this.prompt('Mensaje de denegación: ');
      parameters = { deny_message: denyMessage };
    }

    const confidenceInput = await this.prompt('Confianza (0-1, default 0.8): ');
    const confidence = parseFloat(confidenceInput) || 0.8;

    const newRule = {
      rule_id: ruleId,
      rule_name: ruleName,
      condition_pattern: conditionPattern,
      action_type: actionType,
      parameters: parameters,
      active: true,
      creator: 'terminal_trainer',
      confidence: confidence
    };

    try {
      const { error } = await supabase
        .from('training_rules')
        .insert(newRule);
        
      if (error) {
        console.log(`❌ Error guardando regla: ${error.message}`);
      } else {
        console.log(`✅ Regla creada exitosamente: ${ruleId}`);
        this.rules.push(newRule);
      }
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
    }

    await this.prompt('\nPresiona Enter para continuar...');
    await this.mainMenu();
  }

  async simulateQuery() {
    console.log('\n🧪 SIMULADOR DE CONSULTAS');
    console.log('==========================');
    
    const query = await this.prompt('Ingresa una consulta para simular: ');
    const mode = await this.prompt('Modo (superuser/production, default: production): ') || 'production';
    
    console.log(`\n🔍 Simulando consulta: "${query}"`);
    console.log(`📊 Modo: ${mode}`);
    console.log(`⚙️ Reglas aplicables:`);
    
    // Simular aplicación de reglas
    const applicableRules = this.rules.filter(rule => 
      this.evaluateCondition(rule.condition_pattern, { mode, result_count: 75 })
    );
    
    if (applicableRules.length === 0) {
      console.log('   🔍 No hay reglas aplicables');
    } else {
      applicableRules.forEach(rule => {
        console.log(`   ✅ ${rule.rule_name} (${rule.action_type})`);
      });
    }
    
    await this.prompt('\nPresiona Enter para continuar...');
    await this.mainMenu();
  }

  evaluateCondition(condition, context) {
    // Evaluación simple de condiciones
    try {
      const conditions = condition.split(/\s+AND\s+/i);
      return conditions.every(cond => {
        const trimmed = cond.trim();
        if (trimmed.includes('=')) {
          const [key, value] = trimmed.split('=').map(s => s.trim());
          return context[key] === value;
        }
        return false;
      });
    } catch (error) {
      return false;
    }
  }

  async showStats() {
    console.log('\n📊 ESTADÍSTICAS DEL SISTEMA');
    console.log('============================');
    console.log(`📋 Total patrones: ${this.patterns.length}`);
    console.log(`⚙️ Total reglas: ${this.rules.length}`);
    
    if (this.patterns.length > 0) {
      const avgConfidence = this.patterns.reduce((sum, p) => sum + p.confidence, 0) / this.patterns.length;
      console.log(`🎯 Confianza promedio patrones: ${avgConfidence.toFixed(2)}`);
    }
    
    if (this.rules.length > 0) {
      const rulesByType = this.rules.reduce((acc, rule) => {
        acc[rule.action_type] = (acc[rule.action_type] || 0) + 1;
        return acc;
      }, {});
      console.log('📈 Reglas por tipo:');
      Object.entries(rulesByType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    }
    
    await this.prompt('\nPresiona Enter para continuar...');
    await this.mainMenu();
  }

  async exportPatterns() {
    console.log('\n💾 EXPORTAR PATRONES');
    console.log('====================');
    
    const exportData = {
      version: "2.0",
      exported_at: new Date().toISOString(),
      patterns: this.patterns,
      rules: this.rules,
      total_patterns: this.patterns.length,
      total_rules: this.rules.length
    };
    
    const filename = `scrabble_training_export_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Exportado a: ${filename}`);
    
    await this.prompt('\nPresiona Enter para continuar...');
    await this.mainMenu();
  }

  async importFromJSON() {
    console.log('\n📥 IMPORTAR DESDE JSON');
    console.log('======================');
    
    const filename = await this.prompt('Nombre del archivo JSON: ');
    
    try {
      if (!fs.existsSync(filename)) {
        console.log(`❌ Archivo ${filename} no encontrado`);
        await this.prompt('\nPresiona Enter para continuar...');
        await this.mainMenu();
        return;
      }
      
      const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
      
      if (data.patterns) {
        for (const pattern of data.patterns) {
          try {
            const { error } = await supabase
              .from('training_patterns')
              .upsert(pattern, { onConflict: 'pattern_id' });
              
            if (error) {
              console.log(`⚠️ Error importando patrón ${pattern.pattern_id}: ${error.message}`);
            } else {
              console.log(`✅ Patrón importado: ${pattern.pattern_id}`);
            }
          } catch (error) {
            console.log(`💥 Error: ${error.message}`);
          }
        }
      }
      
      console.log(`🎉 Importación completa`);
      await this.loadExistingData(); // Recargar datos
      
    } catch (error) {
      console.log(`❌ Error leyendo archivo: ${error.message}`);
    }
    
    await this.prompt('\nPresiona Enter para continuar...');
    await this.mainMenu();
  }

  async exit() {
    console.log('\n👋 Cerrando sistema de entrenamiento...');
    
    if (this.currentSession) {
      try {
        await supabase
          .from('training_sessions')
          .update({ 
            ended_at: new Date().toISOString(),
            status: 'completed'
          })
          .eq('session_id', this.currentSession.session_id);
      } catch (error) {
        console.log(`⚠️ Error cerrando sesión: ${error.message}`);
      }
    }
    
    console.log('✅ ¡Hasta la próxima!');
    rl.close();
  }

  prompt(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const trainer = new TerminalTrainingSystem();
  trainer.start().catch(console.error);
}

export { TerminalTrainingSystem };