#!/usr/bin/env node
/**
 * 🎯 MIGRADOR COMPLETO DE SENSES POR sense_id
 * Compara cada registro individual y migra solo los faltantes
 * Con pausa/reanudación y log detallado
 */

const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');

const SQLITE_DB_PATH = '/Users/isaacfalconer/DB_sources/diccionario.db';
const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const BATCH_SIZE = 100;
const PROGRESS_FILE = './sense-migration-progress.json';
const LOG_FILE = './sense-migration.log';

class CompleteSenseMigrator {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.db = new sqlite3.Database(SQLITE_DB_PATH);
    this.progress = this.loadProgress();
    this.isPaused = false;
    this.stats = {
      total: 0,
      processed: 0,
      migrated: 0,
      skipped: 0,
      errors: 0,
      startTime: Date.now()
    };
    this.setupSignalHandlers();
  }

  loadProgress() {
    try {
      if (fs.existsSync(PROGRESS_FILE)) {
        const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        console.log(`🔄 Reanudando desde sense_id: ${data.lastProcessedSenseId}`);
        return data;
      }
    } catch (error) {
      console.warn('⚠️ Error cargando progreso, iniciando desde cero');
    }
    return {
      lastProcessedSenseId: 0,
      totalSqliteSenses: 0,
      processedBatches: 0
    };
  }

  saveProgress() {
    try {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({
        ...this.progress,
        lastUpdate: Date.now(),
        stats: this.stats
      }, null, 2));
    } catch (error) {
      console.error('❌ Error guardando progreso:', error.message);
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}`;
    console.log(logEntry);
    
    try {
      fs.appendFileSync(LOG_FILE, logEntry + '\n');
    } catch (error) {
      // Ignorar errores de log
    }
  }

  setupSignalHandlers() {
    process.on('SIGINT', () => {
      console.log('\n⏸️ PAUSANDO MIGRACIÓN...');
      this.isPaused = true;
      this.saveProgress();
      setTimeout(() => {
        console.log('✅ Migración pausada. Para reanudar: node complete-sense-migrator.cjs');
        process.exit(0);
      }, 2000);
    });
  }

  async getTotalSenses() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT COUNT(*) as total FROM senses', (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    });
  }

  async getSenseBatch(offset, limit) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT sense_id, key_value, lemma, sense_num, definition,
               gender_id, pos_id, pos_sec_id, verb_type_id,
               usage_id, style_id, region_id, domain_id,
               is_cross_ref
        FROM senses 
        WHERE sense_id > ?
        ORDER BY sense_id 
        LIMIT ?
      `, [offset, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async getExistingSenseIds(senseIds) {
    if (senseIds.length === 0) return new Set();
    
    const { data, error } = await this.supabase
      .from('dictionary_senses')
      .select('sense_id')
      .in('sense_id', senseIds);
    
    if (error) throw error;
    return new Set(data.map(s => s.sense_id));
  }

  formatSenseForSupabase(sense) {
    return {
      sense_id: sense.sense_id,
      entry_id: sense.key_value,
      sense_number: sense.sense_num,
      definition: sense.definition,
      gender_code: sense.gender_id ? { id: sense.gender_id } : null,
      pos_code: sense.pos_id ? sense.pos_id.toString() : null,
      pos_secondary_code: sense.pos_sec_id ? { id: sense.pos_sec_id } : null,
      verb_type_code: sense.verb_type_id ? sense.verb_type_id.toString() : null,
      usage_frequency_code: sense.usage_id ? { id: sense.usage_id } : null,
      style_code: sense.style_id ? { id: sense.style_id } : null,
      region_code: sense.region_id ? { id: sense.region_id } : null,
      domain_code: sense.domain_id ? { id: sense.domain_id } : null,
      is_cross_reference: sense.is_cross_ref === 1
    };
  }

  async migrateBatch(sensesToMigrate) {
    if (sensesToMigrate.length === 0) return { success: 0, errors: 0 };

    const formatted = sensesToMigrate.map(s => this.formatSenseForSupabase(s));
    
    try {
      const { data, error } = await this.supabase
        .from('dictionary_senses')
        .insert(formatted);
      
      if (error) {
        if (error.code === '23505') {
          // Algunos ya existen - insertar uno por uno
          return await this.migrateIndividually(sensesToMigrate);
        } else {
          throw error;
        }
      }
      
      return { success: formatted.length, errors: 0 };
      
    } catch (error) {
      this.log(`Error en batch: ${error.message}`, 'ERROR');
      return await this.migrateIndividually(sensesToMigrate);
    }
  }

  async migrateIndividually(senses) {
    let success = 0, errors = 0;
    
    for (const sense of senses) {
      try {
        const formatted = this.formatSenseForSupabase(sense);
        const { error } = await this.supabase
          .from('dictionary_senses')
          .insert([formatted]);
        
        if (error && error.code !== '23505') {
          throw error;
        }
        
        success++;
        
      } catch (error) {
        errors++;
        this.log(`Error sense_id ${sense.sense_id}: ${error.message}`, 'ERROR');
      }
    }
    
    return { success, errors };
  }

  async processBatch(batch) {
    if (this.isPaused) return false;

    const batchSenseIds = batch.map(s => s.sense_id);
    
    // Verificar cuáles ya existen
    const existingSenseIds = await this.getExistingSenseIds(batchSenseIds);
    
    // Filtrar solo los faltantes
    const missingSenses = batch.filter(s => !existingSenseIds.has(s.sense_id));
    
    this.stats.skipped += existingSenseIds.size;
    
    if (missingSenses.length === 0) {
      this.log(`Batch ${this.progress.processedBatches + 1}: ${batch.length} ya existen`);
      return true;
    }
    
    // Migrar faltantes
    const result = await this.migrateBatch(missingSenses);
    
    this.stats.migrated += result.success;
    this.stats.errors += result.errors;
    
    this.log(`Batch ${this.progress.processedBatches + 1}: ${result.success} migrados, ${result.errors} errores, ${existingSenseIds.size} ya existían`);
    
    return true;
  }

  async run() {
    console.log('🎯 MIGRADOR COMPLETO DE SENSES');
    console.log('==============================');
    
    try {
      // Obtener total
      this.stats.total = await this.getTotalSenses();
      this.progress.totalSqliteSenses = this.stats.total;
      console.log(`📊 Total senses en SQLite: ${this.stats.total.toLocaleString()}`);
      
      let offset = this.progress.lastProcessedSenseId;
      
      while (offset < this.stats.total && !this.isPaused) {
        // Obtener batch
        const batch = await this.getSenseBatch(offset, BATCH_SIZE);
        
        if (batch.length === 0) break;
        
        // Procesar batch
        const success = await this.processBatch(batch);
        if (!success) break;
        
        // Actualizar progreso
        this.stats.processed += batch.length;
        this.progress.processedBatches++;
        this.progress.lastProcessedSenseId = batch[batch.length - 1].sense_id;
        offset = this.progress.lastProcessedSenseId;
        
        // Reportar progreso cada 100 batches o cada 10K senses
        if (this.progress.processedBatches % 100 === 0 || this.stats.processed % 10000 === 0) {
          const progressPercent = ((this.stats.processed / this.stats.total) * 100).toFixed(2);
          const elapsed = ((Date.now() - this.stats.startTime) / 1000 / 60).toFixed(1);
          
          console.log(`\n📊 PROGRESO - Batch ${this.progress.processedBatches}`);
          console.log(`   📈 ${this.stats.processed.toLocaleString()}/${this.stats.total.toLocaleString()} (${progressPercent}%)`);
          console.log(`   ✅ Migrados: ${this.stats.migrated.toLocaleString()}`);
          console.log(`   ⏭️ Ya existían: ${this.stats.skipped.toLocaleString()}`);
          console.log(`   ❌ Errores: ${this.stats.errors.toLocaleString()}`);
          console.log(`   ⏱️ Tiempo: ${elapsed} min`);
          
          this.saveProgress();
        }
        
        // Pequeña pausa para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      if (!this.isPaused) {
        this.logFinalStats();
      }
      
    } catch (error) {
      this.log(`Error general: ${error.message}`, 'ERROR');
      throw error;
    } finally {
      this.db.close();
      this.saveProgress();
    }
  }

  logFinalStats() {
    const duration = ((Date.now() - this.stats.startTime) / 1000 / 60).toFixed(1);
    
    console.log('\n🎉 MIGRACIÓN DE SENSES COMPLETADA');
    console.log('=================================');
    console.log(`📊 Total procesados: ${this.stats.processed.toLocaleString()}`);
    console.log(`✅ Migrados: ${this.stats.migrated.toLocaleString()}`);
    console.log(`⏭️ Ya existían: ${this.stats.skipped.toLocaleString()}`);
    console.log(`❌ Errores: ${this.stats.errors.toLocaleString()}`);
    console.log(`⏱️ Duración: ${duration} minutos`);
    console.log(`📊 Tasa de éxito: ${((this.stats.migrated / (this.stats.migrated + this.stats.errors)) * 100).toFixed(2)}%`);
    
    this.log(`COMPLETADO - Migrados: ${this.stats.migrated}, Errores: ${this.stats.errors}`);
  }
}

// Ejecutar si es archivo principal
if (require.main === module) {
  const migrator = new CompleteSenseMigrator();
  
  migrator.run().catch(error => {
    console.error('\n💥 MIGRACIÓN FALLIDA:', error.message);
    process.exit(1);
  });
}