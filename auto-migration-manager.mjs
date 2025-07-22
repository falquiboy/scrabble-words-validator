#!/usr/bin/env node
/**
 * 🤖 GESTOR AUTOMÁTICO DE MIGRACIÓN
 * Detecta cuando termina la migración principal y ejecuta reintento automático
 * Perfecto para que puedas dormir tranquilo 😴
 */

import fs from 'fs';
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const TOTAL_EXPECTED_ENTRIES = 91700; // Aproximado total en SQLite
const CHECK_INTERVAL = 30000; // 30 segundos
const COMPLETION_THRESHOLD = 0.99; // 99% para considerar completo

class AutoMigrationManager {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.startTime = Date.now();
    this.lastProgressTime = Date.now();
    this.retryStarted = false;
    this.migrationCompleted = false;
  }

  async start() {
    console.log('🤖 GESTOR AUTOMÁTICO DE MIGRACIÓN INICIADO');
    console.log('=========================================');
    console.log('😴 Ahora puedes descansar - me encargo del resto');
    console.log(`🔄 Verificando progreso cada ${CHECK_INTERVAL/1000} segundos`);
    console.log(`🎯 Meta: ~${TOTAL_EXPECTED_ENTRIES} entradas totales`);
    console.log('');

    // Proteger Mac contra suspensión por 8 horas
    this.preventSleep();

    // Iniciar monitoreo
    this.monitorLoop();
  }

  preventSleep() {
    console.log('⚡ Protegiendo Mac contra suspensión por 8 horas...');
    spawn('caffeinate', ['-dim', '-t', '28800'], {
      detached: true,
      stdio: 'ignore'
    }).unref();
  }

  async monitorLoop() {
    setInterval(async () => {
      try {
        await this.checkProgress();
      } catch (error) {
        console.error(`❌ Error en monitoreo: ${error.message}`);
      }
    }, CHECK_INTERVAL);

    // Primera verificación inmediata
    setTimeout(() => this.checkProgress(), 5000);
  }

  async checkProgress() {
    const timestamp = new Date().toLocaleTimeString();
    
    // 1. Verificar si el proceso principal sigue ejecutándose
    const migrationActive = await this.isMigrationProcessActive();
    
    // 2. Leer progreso actual
    let progress = null;
    try {
      progress = JSON.parse(fs.readFileSync('./migration-progress.json', 'utf8'));
    } catch (error) {
      console.log(`[${timestamp}] ⚠️  No se pudo leer progreso: ${error.message}`);
      return;
    }

    // 3. Verificar conteo real en Supabase
    const { count: actualEntries } = await this.supabase
      .from('dictionary_entries')
      .select('*', { count: 'exact', head: true });

    const progressPercent = ((progress.entriesMigrated / TOTAL_EXPECTED_ENTRIES) * 100).toFixed(1);
    const actualPercent = ((actualEntries / TOTAL_EXPECTED_ENTRIES) * 100).toFixed(1);

    console.log(`[${timestamp}] 📊 Progreso: ${progress.entriesMigrated} reportadas (${progressPercent}%) | ${actualEntries} reales (${actualPercent}%) | Proceso: ${migrationActive ? '🟢' : '🔴'}`);

    // 4. Detectar si la migración principal terminó
    if (this.shouldStartRetry(progress, actualEntries, migrationActive)) {
      await this.startRetryProcess();
    }

    // 5. Detectar si todo está completo
    if (this.isFullyComplete(actualEntries) && this.retryStarted) {
      this.celebrateCompletion(actualEntries);
    }
  }

  async isMigrationProcessActive() {
    return new Promise((resolve) => {
      const ps = spawn('pgrep', ['-f', 'migrate-dictionary-resilient']);
      
      ps.on('close', (code) => {
        resolve(code === 0); // 0 = proceso encontrado
      });

      ps.on('error', () => {
        resolve(false);
      });
    });
  }

  shouldStartRetry(progress, actualEntries, migrationActive) {
    // Condiciones para iniciar retry:
    return !this.retryStarted && (
      // 1. Migración principal terminó
      !migrationActive ||
      // 2. Progreso se detuvo por más de 10 minutos
      (Date.now() - this.lastProgressTime > 600000) ||
      // 3. Llegamos cerca del final (95%+)
      (progress.entriesMigrated / TOTAL_EXPECTED_ENTRIES > 0.95)
    );
  }

  isFullyComplete(actualEntries) {
    return (actualEntries / TOTAL_EXPECTED_ENTRIES) >= COMPLETION_THRESHOLD;
  }

  async startRetryProcess() {
    if (this.retryStarted) return;
    
    this.retryStarted = true;
    console.log('\n🚀 INICIANDO PROCESO DE REINTENTO AUTOMÁTICO');
    console.log('=============================================');
    console.log('⏰ ' + new Date().toLocaleString());

    // Hacer verificación final rápida
    console.log('🔍 Ejecutando verificación final...');
    await this.runScript('quick-missing-check.mjs');

    // Esperar un momento para que termine la verificación
    setTimeout(async () => {
      console.log('🔄 Iniciando reintento paralelo...');
      await this.runScript('retry-migration.mjs');
    }, 5000);
  }

  async runScript(scriptName) {
    return new Promise((resolve, reject) => {
      console.log(`📄 Ejecutando: ${scriptName}`);
      
      const child = spawn('node', [scriptName], {
        stdio: 'inherit'
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${scriptName} completado exitosamente`);
          resolve();
        } else {
          console.error(`❌ ${scriptName} falló con código ${code}`);
          reject(new Error(`Script failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        console.error(`💥 Error ejecutando ${scriptName}:`, error.message);
        reject(error);
      });
    });
  }

  celebrateCompletion(finalCount) {
    if (this.migrationCompleted) return;
    
    this.migrationCompleted = true;
    const duration = ((Date.now() - this.startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n🎉 ¡MIGRACIÓN COMPLETAMENTE TERMINADA!');
    console.log('======================================');
    console.log(`✅ Total entradas migradas: ${finalCount}`);
    console.log(`⏱️  Tiempo total: ${duration} minutos`);
    console.log(`📊 Cobertura: ${((finalCount / TOTAL_EXPECTED_ENTRIES) * 100).toFixed(2)}%`);
    console.log('');
    console.log('💤 ¡Ya puedes despertar! Todo está listo.');
    console.log('🎯 La búsqueda semántica funcionará perfectamente con el diccionario completo.');
    
    // Opcional: enviar notificación (si hay sistema de notificaciones)
    this.sendCompletionNotification(finalCount);
    
    // Salir graciosamente
    setTimeout(() => {
      process.exit(0);
    }, 10000);
  }

  sendCompletionNotification(finalCount) {
    // Crear archivo de notificación
    const notification = {
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
      message: `Migración completada: ${finalCount} entradas`,
      duration: ((Date.now() - this.startTime) / 1000 / 60).toFixed(1) + ' minutos'
    };

    fs.writeFileSync('./migration-completion.json', JSON.stringify(notification, null, 2));
    
    // Reproducir sonido de notificación (macOS)
    try {
      spawn('afplay', ['/System/Library/Sounds/Glass.aiff'], {
        stdio: 'ignore'
      });
    } catch (error) {
      // Ignorar si no se puede reproducir sonido
    }
  }
}

// Ejecutar gestor automático
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new AutoMigrationManager();
  
  // Manejar señales para salida elegante
  process.on('SIGINT', () => {
    console.log('\n👋 Gestor automático pausado por usuario');
    process.exit(0);
  });

  manager.start().catch(console.error);
}