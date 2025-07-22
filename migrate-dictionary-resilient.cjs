#!/usr/bin/env node
/**
 * Migración Resiliente del Diccionario Español
 * Soporta pausar/reanudar, cambios de conexión, y recuperación automática
 */

const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración
const SQLITE_DB_PATH = '/Users/isaacfalconer/DB_sources/diccionario.db';
const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 1000;
const PROGRESS_FILE = './migration-progress.json';
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 segundos

class ResilientDictionaryMigrator {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        this.db = new sqlite3.Database(SQLITE_DB_PATH);
        this.progress = this.loadProgress();
        this.isPaused = false;
        this.setupSignalHandlers();
    }

    setupSignalHandlers() {
        // Manejo de Ctrl+C para pausa elegante
        process.on('SIGINT', () => {
            console.log('\n⏸️ PAUSANDO MIGRACIÓN...');
            console.log('💾 Guardando progreso...');
            this.isPaused = true;
            this.saveProgress();
            
            setTimeout(() => {
                console.log('\n✅ Migración pausada exitosamente');
                console.log('🔄 Para reanudar, ejecuta: node migrate-dictionary-resilient.cjs --resume');
                process.exit(0);
            }, 2000);
        });

        // Manejo de errores de conexión
        process.on('uncaughtException', (error) => {
            console.error('\n💥 Error no manejado:', error.message);
            console.log('💾 Guardando progreso antes de salir...');
            this.saveProgress();
            process.exit(1);
        });
    }

    loadProgress() {
        try {
            if (fs.existsSync(PROGRESS_FILE)) {
                const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
                console.log('📂 Progreso anterior encontrado:');
                console.log(`   📝 Entradas: ${data.entriesOffset || 0}`);
                console.log(`   🔗 Relaciones: ${data.relationsOffset || 0}`);
                console.log(`   📊 Última actualización: ${new Date(data.lastUpdate).toLocaleString()}`);
                return data;
            }
        } catch (error) {
            console.log('⚠️ No se pudo cargar progreso anterior, iniciando desde cero');
        }
        
        return {
            entriesOffset: 0,
            relationsOffset: 0,
            entriesMigrated: 0,
            sensesMigrated: 0,
            relationsMigrated: 0,
            errors: 0,
            phase: 'categories', // categories, entries, relations, completed
            lastUpdate: Date.now(),
            startTime: Date.now()
        };
    }

    saveProgress() {
        try {
            this.progress.lastUpdate = Date.now();
            fs.writeFileSync(PROGRESS_FILE, JSON.stringify(this.progress, null, 2));
        } catch (error) {
            console.error('❌ Error guardando progreso:', error.message);
        }
    }

    async testConnection() {
        try {
            const { data, error } = await this.supabase
                .from('dictionary_categories')
                .select('count')
                .limit(1);
            
            if (error) throw error;
            return true;
        } catch (error) {
            return false;
        }
    }

    async waitForConnection() {
        console.log('\n🔄 Esperando conexión a internet...');
        
        while (!await this.testConnection()) {
            if (this.isPaused) return false;
            
            process.stdout.write('.');
            await this.sleep(3000);
        }
        
        console.log('\n✅ Conexión restaurada!');
        return true;
    }

    async executeWithRetry(operation, context = '') {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                if (this.isPaused) {
                    throw new Error('Migration paused by user');
                }

                return await operation();
                
            } catch (error) {
                console.error(`   ⚠️ Intento ${attempt}/${MAX_RETRIES} falló${context ? ` (${context})` : ''}: ${error.message}`);
                
                if (attempt === MAX_RETRIES) {
                    // Si es error de conexión, esperar reconexión
                    if (error.message.includes('network') || error.message.includes('connect') || error.code === 'ENOTFOUND') {
                        console.log('   🔌 Error de conexión detectado, esperando reconexión...');
                        if (await this.waitForConnection()) {
                            // Reiniciar intentos después de reconexión
                            return await this.executeWithRetry(operation, context);
                        }
                    }
                    throw error;
                }
                
                await this.sleep(RETRY_DELAY * attempt);
            }
        }
    }

    async runResilientMigration() {
        const isResume = process.argv.includes('--resume');
        
        console.log('🚀 MIGRACIÓN RESILIENTE DEL DICCIONARIO');
        console.log('=====================================');
        
        if (isResume) {
            console.log('🔄 REANUDANDO migración desde punto guardado...\n');
        } else {
            console.log('🆕 INICIANDO nueva migración...\n');
            // Reset progress for new migration
            this.progress = {
                entriesOffset: 0,
                relationsOffset: 0,
                entriesMigrated: 0,
                sensesMigrated: 0,
                relationsMigrated: 0,
                errors: 0,
                phase: 'categories',
                lastUpdate: Date.now(),
                startTime: Date.now()
            };
        }

        try {
            // Verificar conexión inicial
            if (!await this.testConnection()) {
                if (!await this.waitForConnection()) {
                    throw new Error('No se pudo establecer conexión');
                }
            }

            // Ejecutar fases según progreso guardado
            if (this.progress.phase === 'categories') {
                await this.ensureCategories();
                this.progress.phase = 'entries';
                this.saveProgress();
            }

            if (this.progress.phase === 'entries') {
                await this.migrateAllEntries();
                this.progress.phase = 'relations';
                this.saveProgress();
            }

            if (this.progress.phase === 'relations') {
                await this.migrateAllWordRelations();
                this.progress.phase = 'completed';
                this.saveProgress();
            }

            if (this.progress.phase === 'completed') {
                await this.showFinalStats();
                console.log('\n🎉 MIGRACIÓN COMPLETA EXITOSA!');
                
                // Limpiar archivo de progreso
                if (fs.existsSync(PROGRESS_FILE)) {
                    fs.unlinkSync(PROGRESS_FILE);
                    console.log('🧹 Archivo de progreso limpiado');
                }
            }
            
        } catch (error) {
            if (error.message === 'Migration paused by user') {
                return; // Pausa elegante
            }
            
            console.error('\n❌ ERROR EN MIGRACIÓN:', error.message);
            console.log('💾 Progreso guardado. Puedes reanudar con: --resume');
            this.saveProgress();
            throw error;
        } finally {
            this.db.close();
        }
    }

    async ensureCategories() {
        if (this.isPaused) return;
        
        console.log('📂 Verificando categorías...');
        
        await this.executeWithRetry(async () => {
            const { count: categoryCount } = await this.supabase
                .from('dictionary_categories')
                .select('*', { count: 'exact', head: true });

            if (categoryCount < 200) {
                console.log('   📊 Migrando categorías...');
                await this.migrateCategories();
            } else {
                console.log('   ✅ Categorías ya migradas');
            }
        }, 'verificación de categorías');
    }

    async migrateCategories() {
        const categories = [
            { type: 'gender', items: await this.queryAsync("SELECT code, description FROM genders") },
            { type: 'pos', items: await this.queryAsync("SELECT code, description FROM pos_categories") },
            { type: 'region', items: await this.queryAsync("SELECT abbrev as code, meaning as description FROM regions") },
            { type: 'domain', items: await this.queryAsync("SELECT abbrev as code, meaning as description FROM domains") },
            { type: 'style', items: await this.queryAsync("SELECT code, description FROM styles") },
            { type: 'usage', items: await this.queryAsync("SELECT code, description FROM usage_frequency") },
            { type: 'verb_type', items: await this.queryAsync("SELECT code, description FROM verb_types") }
        ];

        for (const category of categories) {
            if (this.isPaused) return;
            
            if (category.items.length > 0) {
                await this.executeWithRetry(async () => {
                    const categoryData = category.items.map(item => ({
                        category_type: category.type,
                        code: item.code,
                        description: item.description
                    }));

                    const { error } = await this.supabase
                        .from('dictionary_categories')
                        .upsert(categoryData, { onConflict: 'category_type,code' });

                    if (error) throw error;
                    console.log(`   ✅ ${category.type}: ${categoryData.length} categorías`);
                }, `migración de categorías ${category.type}`);
            }
        }
    }

    async migrateAllEntries() {
        if (this.isPaused) return;
        
        console.log('\n📚 Continuando migración de entradas y acepciones...');
        
        const totalEntries = await this.queryAsync(`
            SELECT COUNT(DISTINCT key_value) as total 
            FROM senses
        `);
        
        const total = totalEntries[0].total;
        const startOffset = this.progress.entriesOffset;
        
        console.log(`   📊 Total entradas: ${total.toLocaleString()}`);
        console.log(`   🔄 Reanudando desde: ${startOffset.toLocaleString()}`);

        let offset = startOffset;
        let batchNum = Math.floor(startOffset / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(total / BATCH_SIZE);

        while (offset < total && !this.isPaused) {
            const startTime = Date.now();
            
            console.log(`\n📦 Lote ${batchNum}/${totalBatches} (offset: ${offset.toLocaleString()})`);
            
            await this.executeWithRetry(async () => {
                const migrated = await this.migrateEntriesBatch(offset, BATCH_SIZE);
                
                if (migrated === 0) {
                    console.log('   ℹ️ No hay más entradas para migrar');
                    return;
                }

                this.progress.entriesMigrated += migrated;
                this.progress.entriesOffset = offset + BATCH_SIZE;
                
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                const progress = ((offset + BATCH_SIZE) / total * 100).toFixed(1);
                const entriesPerSec = (migrated / (elapsed || 1)).toFixed(1);
                
                console.log(`   ✅ ${migrated} entradas migradas en ${elapsed}s (${entriesPerSec} entradas/s)`);
                console.log(`   📈 Progreso: ${progress}%`);
                
                // Guardar progreso cada 10 lotes
                if (batchNum % 10 === 0) {
                    this.saveProgress();
                    console.log('   💾 Progreso guardado');
                }
                
            }, `lote de entradas ${batchNum}`);

            if (offset + BATCH_SIZE < total && !this.isPaused) {
                await this.sleep(DELAY_BETWEEN_BATCHES);
            }

            offset += BATCH_SIZE;
            batchNum++;
        }

        console.log(`\n✅ Migración de entradas completada: ${this.progress.entriesMigrated} entradas`);
    }

    async migrateEntriesBatch(offset, limit) {
        const entries = await this.queryAsync(`
            SELECT DISTINCT
                s.key_value,
                s.lemma,
                seg.parenthesis_info,
                seg.etymology_origin,
                (SELECT COUNT(*) FROM senses sen WHERE sen.key_value = s.key_value) as total_senses
            FROM senses s
            LEFT JOIN segments seg ON s.key_value = seg.key_value
            ORDER BY s.key_value
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        if (entries.length === 0) return 0;

        for (const entry of entries) {
            if (this.isPaused) break;
            
            try {
                const { data: entryData, error: entryError } = await this.supabase
                    .from('dictionary_entries')
                    .upsert({
                        key_value: entry.key_value,
                        lemma: entry.lemma,
                        etymology_info: entry.etymology_origin,
                        parenthesis_info: entry.parenthesis_info,
                        total_senses: entry.total_senses
                    }, { onConflict: 'key_value' })
                    .select('entry_id')
                    .single();

                if (entryError) {
                    console.error(`     ❌ Error entrada ${entry.lemma}:`, entryError.message);
                    this.progress.errors++;
                    continue;
                }

                const sensesCount = await this.migrateSensesForEntry(entry.key_value, entryData.entry_id);
                this.progress.sensesMigrated += sensesCount;

            } catch (error) {
                console.error(`     ❌ Error procesando ${entry.lemma}:`, error.message);
                this.progress.errors++;
            }
        }

        return entries.length;
    }

    async migrateSensesForEntry(keyValue, entryId) {
        const senses = await this.queryAsync(`
            SELECT 
                s.sense_num,
                s.definition,
                s.is_cross_ref,
                g.code as gender_code,
                pc.code as pos_code,
                ps.code as pos_secondary_code,
                vt.code as verb_type_code,
                uf.code as usage_frequency_code,
                st.code as style_code,
                r.abbrev as region_code,
                d.abbrev as domain_code
            FROM senses s
            LEFT JOIN genders g ON s.gender_id = g.gender_id
            LEFT JOIN pos_categories pc ON s.pos_id = pc.pos_id
            LEFT JOIN pos_secondary ps ON s.pos_sec_id = ps.pos_sec_id
            LEFT JOIN verb_types vt ON s.verb_type_id = vt.verb_type_id
            LEFT JOIN usage_frequency uf ON s.usage_id = uf.usage_id
            LEFT JOIN styles st ON s.style_id = st.style_id
            LEFT JOIN regions r ON s.region_id = r.region_id
            LEFT JOIN domains d ON s.domain_id = d.domain_id
            WHERE s.key_value = ?
            ORDER BY s.sense_num
        `, [keyValue]);

        if (senses.length === 0) return 0;

        const sensesData = senses.map(sense => ({
            entry_id: entryId,
            sense_number: sense.sense_num,
            definition: sense.definition,
            gender_code: sense.gender_code,
            pos_code: sense.pos_code,
            pos_secondary_code: sense.pos_secondary_code,
            verb_type_code: sense.verb_type_code,
            usage_frequency_code: sense.usage_frequency_code,
            style_code: sense.style_code,
            region_code: sense.region_code,
            domain_code: sense.domain_code,
            is_cross_reference: Boolean(sense.is_cross_ref)
        }));

        const { error } = await this.supabase
            .from('dictionary_senses')
            .upsert(sensesData, { onConflict: 'entry_id,sense_number' });

        if (error) {
            throw new Error(`Error acepciones entrada ${entryId}: ${error.message}`);
        }

        return senses.length;
    }

    async migrateAllWordRelations() {
        if (this.isPaused) return;
        
        console.log('\n🔗 Continuando migración de relaciones palabra-diccionario...');
        
        const totalWords = await this.queryAsync('SELECT COUNT(*) as total FROM lexicon_indexes');
        const total = totalWords[0].total;
        const startOffset = this.progress.relationsOffset;
        
        console.log(`   📊 Total palabras: ${total.toLocaleString()}`);
        console.log(`   🔄 Reanudando desde: ${startOffset.toLocaleString()}`);

        let offset = startOffset;
        let batchNum = Math.floor(startOffset / (BATCH_SIZE * 5)) + 1;
        const relationsBatchSize = BATCH_SIZE * 5;
        const totalBatches = Math.ceil(total / relationsBatchSize);

        while (offset < total && !this.isPaused) {
            console.log(`\n🔗 Lote relaciones ${batchNum}/${totalBatches} (offset: ${offset.toLocaleString()})`);
            
            await this.executeWithRetry(async () => {
                const relationsCount = await this.migrateWordRelationsBatch(offset, relationsBatchSize);
                this.progress.relationsMigrated += relationsCount;
                this.progress.relationsOffset = offset + relationsBatchSize;
                
                const progress = ((offset + relationsBatchSize) / total * 100).toFixed(1);
                console.log(`   ✅ ${relationsCount} relaciones procesadas - Progreso: ${progress}%`);
                
                // Guardar progreso cada 5 lotes
                if (batchNum % 5 === 0) {
                    this.saveProgress();
                    console.log('   💾 Progreso guardado');
                }
                
            }, `lote de relaciones ${batchNum}`);

            if (offset + relationsBatchSize < total && !this.isPaused) {
                await this.sleep(DELAY_BETWEEN_BATCHES);
            }

            offset += relationsBatchSize;
            batchNum++;
        }

        console.log(`\n✅ Migración de relaciones completada: ${this.progress.relationsMigrated} relaciones`);
    }

    async migrateWordRelationsBatch(offset, limit) {
        const relations = await this.queryAsync(`
            SELECT 
                non_diac_word,
                key_lemma,
                key_feminine,
                key_plural,
                key_conj,
                key_variant
            FROM lexicon_indexes
            ORDER BY lexicon_id
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        let relationsCount = 0;

        for (const relation of relations) {
            if (this.isPaused) break;
            
            const word = relation.non_diac_word;
            
            const relationTypes = [
                { keys: relation.key_lemma, type: 'lemma' },
                { keys: relation.key_feminine, type: 'feminine' },
                { keys: relation.key_plural, type: 'plural' },
                { keys: relation.key_conj, type: 'conjugation' },
                { keys: relation.key_variant, type: 'variant' }
            ];

            for (const relType of relationTypes) {
                if (relType.keys) {
                    const keys = relType.keys.split(',').map(k => k.trim()).filter(k => k);
                    relationsCount += await this.insertWordRelations(word, keys, relType.type);
                }
            }
        }

        return relationsCount;
    }

    async insertWordRelations(word, keys, relationType) {
        let inserted = 0;

        for (const key of keys) {
            try {
                const keyValue = parseFloat(key);
                if (isNaN(keyValue)) continue;

                const { data: entry } = await this.supabase
                    .from('dictionary_entries')
                    .select('entry_id')
                    .eq('key_value', keyValue)
                    .single();

                if (entry) {
                    const { error } = await this.supabase
                        .from('word_dictionary_relations')
                        .upsert({
                            word: word,
                            entry_id: entry.entry_id,
                            relation_type: relationType
                        }, { onConflict: 'word,entry_id,relation_type' });

                    if (!error) {
                        inserted++;
                    }
                }
            } catch (error) {
                // Silenciar errores menores
            }
        }

        return inserted;
    }

    async showFinalStats() {
        console.log('\n📊 ESTADÍSTICAS FINALES DE MIGRACIÓN');
        console.log('====================================');

        const elapsed = (Date.now() - this.progress.startTime) / 1000 / 60;
        console.log(`⏱️ Tiempo total: ${elapsed.toFixed(1)} minutos`);
        console.log(`📝 Entradas migradas: ${this.progress.entriesMigrated.toLocaleString()}`);
        console.log(`📖 Acepciones migradas: ${this.progress.sensesMigrated.toLocaleString()}`);
        console.log(`🔗 Relaciones migradas: ${this.progress.relationsMigrated.toLocaleString()}`);
        console.log(`❌ Errores: ${this.progress.errors}`);

        // Verificar conteos finales
        const tables = ['dictionary_categories', 'dictionary_entries', 'dictionary_senses', 'word_dictionary_relations'];

        console.log('\n📋 Conteos finales en Supabase:');
        for (const table of tables) {
            try {
                const { count } = await this.supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                console.log(`   ${table}: ${count?.toLocaleString() || 'N/A'}`);
            } catch (error) {
                console.log(`   ${table}: Error obteniendo conteo`);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    queryAsync(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

// Mostrar ayuda
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🚀 MIGRACIÓN RESILIENTE DEL DICCIONARIO

Uso:
  node migrate-dictionary-resilient.cjs          # Iniciar nueva migración
  node migrate-dictionary-resilient.cjs --resume # Reanudar migración pausada
  node migrate-dictionary-resilient.cjs --help   # Mostrar esta ayuda

Características:
  ⏸️  Pausa con Ctrl+C y guarda progreso
  🔄 Reanuda desde donde se quedó
  🔌 Maneja cambios de conexión automáticamente
  💾 Guarda progreso cada 10 lotes
  🔁 Reintenta operaciones fallidas automáticamente

El progreso se guarda en: migration-progress.json
`);
    process.exit(0);
}

// Ejecutar migración
if (require.main === module) {
    const migrator = new ResilientDictionaryMigrator();
    migrator.runResilientMigration().catch(error => {
        if (error.message !== 'Migration paused by user') {
            console.error('\n💥 MIGRACIÓN FALLIDA:', error.message);
            process.exit(1);
        }
    });
}