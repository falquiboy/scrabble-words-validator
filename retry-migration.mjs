#!/usr/bin/env node
/**
 * 🔄 SISTEMA DE REINTENTO PARALELO
 * Reintenta migración de entradas fallidas usando múltiples workers
 */

import sqlite3 from 'sqlite3';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SQLITE_DB_PATH = '/Users/isaacfalconer/DB_sources/diccionario.db';
const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const WORKER_COUNT = 4; // Número de workers paralelos
const BATCH_SIZE = 50;   // Entradas por batch
const DELAY_BETWEEN_BATCHES = 2000; // ms

class ParallelRetryMigrator {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.workers = [];
    this.completedBatches = 0;
    this.totalBatches = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
  }

  async loadMissingEntries() {
    if (!fs.existsSync('./missing-entries.json')) {
      console.log('📋 No se encontró missing-entries.json');
      console.log('🔄 Ejecutando identificación de entradas faltantes...');
      
      // Ejecutar identify-missing-entries.mjs
      const { spawn } = await import('child_process');
      
      return new Promise((resolve, reject) => {
        const child = spawn('node', ['identify-missing-entries.mjs'], {
          stdio: 'inherit'
        });
        
        child.on('close', (code) => {
          if (code === 0) {
            resolve(this.loadMissingEntries());
          } else {
            reject(new Error('Failed to identify missing entries'));
          }
        });
      });
    }

    const data = JSON.parse(fs.readFileSync('./missing-entries.json', 'utf8'));
    console.log(`📊 Cargadas ${data.missingEntries.length} entradas faltantes`);
    return data.missingEntries;
  }

  createWorkerScript() {
    const workerScript = `
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');

const SQLITE_DB_PATH = '${SQLITE_DB_PATH}';
const SUPABASE_URL = '${SUPABASE_URL}';
const SUPABASE_KEY = '${SUPABASE_KEY}';

class WorkerMigrator {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.db = new sqlite3.Database(SQLITE_DB_PATH);
  }

  async processBatch(entries) {
    const results = {
      success: 0,
      errors: 0,
      details: []
    };

    for (const entry of entries) {
      try {
        await this.migrateEntry(entry);
        results.success++;
        results.details.push({ key: entry.key, status: 'success' });
      } catch (error) {
        results.errors++;
        results.details.push({ 
          key: entry.key, 
          status: 'error', 
          message: error.message 
        });
      }
    }

    return results;
  }

  async migrateEntry(entry) {
    // 1. Obtener datos completos de SQLite
    const entryData = await this.getEntryFromSQLite(entry.key);
    
    // 2. Insertar en Supabase
    const { error: entryError } = await this.supabase
      .from('dictionary_entries')
      .insert({
        key_value: entryData.key,
        lemma: entryData.lemma,
        etymology_info: entryData.etymology_info,
        parenthesis_info: entryData.parenthesis_info,
        total_senses: entryData.total_senses
      });

    if (entryError) {
      if (entryError.code === '23505') {
        // Entrada ya existe, migrar solo senses faltantes
        await this.migrateMissingSenses(entryData.key);
      } else {
        throw entryError;
      }
    }

    // 3. Migrar senses
    await this.migrateSenses(entryData.key);
  }

  async getEntryFromSQLite(key) {
    return new Promise((resolve, reject) => {
      this.db.get(
        \`SELECT e.key, e.lemma, e.etymology_info, e.parenthesis_info,
                COUNT(s.id) as total_senses
         FROM entries e
         LEFT JOIN senses s ON e.key = s.entry_key
         WHERE e.key = ?
         GROUP BY e.key\`,
        [key],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async migrateSenses(entryKey) {
    const senses = await new Promise((resolve, reject) => {
      this.db.all(
        \`SELECT * FROM senses WHERE entry_key = ? ORDER BY sense_number\`,
        [entryKey],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    if (senses.length === 0) return;

    const sensesToInsert = senses.map(sense => ({
      entry_id: entryKey,
      sense_number: sense.sense_number,
      definition: sense.definition,
      gender_code: sense.gender_code ? JSON.parse(sense.gender_code) : null,
      pos_code: sense.pos_code,
      pos_secondary_code: sense.pos_secondary_code ? JSON.parse(sense.pos_secondary_code) : null,
      verb_type_code: sense.verb_type_code,
      usage_frequency_code: sense.usage_frequency_code ? JSON.parse(sense.usage_frequency_code) : null,
      style_code: sense.style_code ? JSON.parse(sense.style_code) : null,
      region_code: sense.region_code ? JSON.parse(sense.region_code) : null,
      domain_code: sense.domain_code ? JSON.parse(sense.domain_code) : null,
      is_cross_reference: sense.is_cross_reference === 1
    }));

    const { error } = await this.supabase
      .from('dictionary_senses')
      .insert(sensesToInsert);

    if (error && error.code !== '23505') {
      throw error;
    }
  }

  async migrateMissingSenses(entryKey) {
    // Verificar qué senses faltan y migrarlos
    const { data: existingSenses } = await this.supabase
      .from('dictionary_senses')
      .select('sense_number')
      .eq('entry_id', entryKey);

    const existingNumbers = new Set(existingSenses?.map(s => s.sense_number) || []);

    const allSenses = await new Promise((resolve, reject) => {
      this.db.all(
        \`SELECT * FROM senses WHERE entry_key = ? ORDER BY sense_number\`,
        [entryKey],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const missingSenses = allSenses.filter(s => !existingNumbers.has(s.sense_number));

    if (missingSenses.length > 0) {
      await this.migrateSenses(entryKey);
    }
  }
}

// Worker main logic
if (!isMainThread) {
  const migrator = new WorkerMigrator();
  
  parentPort.on('message', async (batch) => {
    try {
      const result = await migrator.processBatch(batch);
      parentPort.postMessage({ success: true, result });
    } catch (error) {
      parentPort.postMessage({ success: false, error: error.message });
    }
  });
}
`;

    fs.writeFileSync('./retry-worker.js', workerScript);
    return './retry-worker.js';
  }

  async startParallelRetry() {
    console.log('🚀 INICIANDO REINTENTO PARALELO');
    console.log('===============================');
    
    // 1. Cargar entradas faltantes
    const missingEntries = await this.loadMissingEntries();
    
    if (missingEntries.length === 0) {
      console.log('✅ No hay entradas faltantes para reintentar');
      return;
    }

    // 2. Crear script del worker
    const workerScript = this.createWorkerScript();

    // 3. Dividir en batches
    const batches = [];
    for (let i = 0; i < missingEntries.length; i += BATCH_SIZE) {
      batches.push(missingEntries.slice(i, i + BATCH_SIZE));
    }

    this.totalBatches = batches.length;
    console.log(`📦 ${this.totalBatches} batches creados (${BATCH_SIZE} entradas por batch)`);
    console.log(`👥 Usando ${WORKER_COUNT} workers paralelos`);

    // 4. Crear workers
    for (let i = 0; i < WORKER_COUNT; i++) {
      const worker = new Worker(workerScript);
      
      worker.on('message', (message) => {
        if (message.success) {
          this.handleWorkerSuccess(message.result);
        } else {
          this.handleWorkerError(message.error);
        }
      });

      worker.on('error', (error) => {
        console.error(`💥 Worker ${i} error:`, error.message);
      });

      this.workers.push({ worker, busy: false, id: i });
    }

    // 5. Procesar batches
    let batchIndex = 0;
    const processingInterval = setInterval(() => {
      // Encontrar worker libre
      const freeWorker = this.workers.find(w => !w.busy);
      
      if (freeWorker && batchIndex < batches.length) {
        freeWorker.busy = true;
        freeWorker.worker.postMessage(batches[batchIndex]);
        console.log(`📤 Batch ${batchIndex + 1}/${this.totalBatches} enviado a worker ${freeWorker.id}`);
        batchIndex++;
      }

      // Verificar si terminamos
      if (this.completedBatches >= this.totalBatches) {
        clearInterval(processingInterval);
        this.finishRetry();
      }
    }, 100);
  }

  handleWorkerSuccess(result) {
    this.completedBatches++;
    this.successCount += result.success;
    this.errorCount += result.errors;

    // Liberar worker
    const worker = this.workers.find(w => w.busy);
    if (worker) worker.busy = false;

    const progress = ((this.completedBatches / this.totalBatches) * 100).toFixed(1);
    console.log(\`✅ Batch completado (\${progress}%) | ✅ \${result.success} | ❌ \${result.errors}\`);
  }

  handleWorkerError(error) {
    this.completedBatches++;
    this.errorCount += BATCH_SIZE; // Asumir que todo el batch falló

    // Liberar worker
    const worker = this.workers.find(w => w.busy);
    if (worker) worker.busy = false;

    console.error(\`❌ Batch falló: \${error}\`);
  }

  finishRetry() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log('\\n🎉 REINTENTO PARALELO COMPLETADO');
    console.log('================================');
    console.log(\`⏱️  Duración: \${duration}s\`);
    console.log(\`✅ Exitosos: \${this.successCount}\`);
    console.log(\`❌ Errores: \${this.errorCount}\`);
    console.log(\`📊 Tasa de éxito: \${((this.successCount / (this.successCount + this.errorCount)) * 100).toFixed(2)}%\`);

    // Limpiar workers
    this.workers.forEach(w => w.worker.terminate());
    
    // Limpiar archivo temporal
    if (fs.existsSync('./retry-worker.js')) {
      fs.unlinkSync('./retry-worker.js');
    }

    process.exit(0);
  }
}

// Ejecutar si es el archivo principal
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  const migrator = new ParallelRetryMigrator();
  migrator.startParallelRetry().catch(console.error);
}