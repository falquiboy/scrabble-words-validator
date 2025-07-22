#!/usr/bin/env node
/**
 * Migración Completa del Diccionario Español
 * Migra todos los datos desde SQLite a Supabase en lotes seguros
 */

const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');

// Configuración
const SQLITE_DB_PATH = '/Users/isaacfalconer/DB_sources/diccionario.db';
const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 1000; // 1 segundo

class FullDictionaryMigrator {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        this.db = new sqlite3.Database(SQLITE_DB_PATH);
        this.stats = {
            entriesMigrated: 0,
            sensesMigrated: 0,
            relationsMigrated: 0,
            errors: 0,
            startTime: Date.now()
        };
    }

    async runFullMigration() {
        console.log('🚀 INICIANDO MIGRACIÓN COMPLETA DEL DICCIONARIO');
        console.log('================================================\n');

        try {
            // 1. Verificar estado inicial
            await this.checkInitialState();
            
            // 2. Migrar categorías (si no están migradas)
            await this.ensureCategories();
            
            // 3. Migrar entradas y acepciones en lotes
            await this.migrateAllEntries();
            
            // 4. Migrar relaciones palabra-diccionario
            await this.migrateAllWordRelations();
            
            // 5. Estadísticas finales
            await this.showFinalStats();
            
            console.log('\n🎉 MIGRACIÓN COMPLETA EXITOSA!');
            
        } catch (error) {
            console.error('\n❌ ERROR EN MIGRACIÓN:', error);
            throw error;
        } finally {
            this.db.close();
        }
    }

    async checkInitialState() {
        console.log('🔍 Verificando estado inicial...');
        
        const { count: existingEntries } = await this.supabase
            .from('dictionary_entries')
            .select('*', { count: 'exact', head: true });

        console.log(`   📊 Entradas existentes: ${existingEntries}`);
        
        if (existingEntries > 50) {
            console.log('   ⚠️ Ya hay datos migrados, continuando desde donde se quedó...');
        }
    }

    async ensureCategories() {
        console.log('\n📂 Verificando categorías...');
        
        const { count: categoryCount } = await this.supabase
            .from('dictionary_categories')
            .select('*', { count: 'exact', head: true });

        if (categoryCount < 200) {
            console.log('   📊 Migrando categorías...');
            await this.migrateCategories();
        } else {
            console.log('   ✅ Categorías ya migradas');
        }
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
            if (category.items.length > 0) {
                const categoryData = category.items.map(item => ({
                    category_type: category.type,
                    code: item.code,
                    description: item.description
                }));

                const { error } = await this.supabase
                    .from('dictionary_categories')
                    .upsert(categoryData, { onConflict: 'category_type,code' });

                if (!error) {
                    console.log(`   ✅ ${category.type}: ${categoryData.length} categorías`);
                }
            }
        }
    }

    async migrateAllEntries() {
        console.log('\n📚 Iniciando migración de entradas y acepciones...');
        
        // Obtener total de entradas únicas
        const totalEntries = await this.queryAsync(`
            SELECT COUNT(DISTINCT key_value) as total 
            FROM senses
        `);
        
        const total = totalEntries[0].total;
        console.log(`   📊 Total entradas a migrar: ${total.toLocaleString()}`);

        let offset = 0;
        let batchNum = 1;
        const totalBatches = Math.ceil(total / BATCH_SIZE);

        while (offset < total) {
            const startTime = Date.now();
            
            console.log(`\n📦 Lote ${batchNum}/${totalBatches} (offset: ${offset})`);
            
            try {
                const migrated = await this.migrateEntriesBatch(offset, BATCH_SIZE);
                
                if (migrated === 0) {
                    console.log('   ℹ️ No hay más entradas para migrar');
                    break;
                }

                this.stats.entriesMigrated += migrated;
                
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                const progress = ((offset + BATCH_SIZE) / total * 100).toFixed(1);
                const entriesPerSec = (migrated / (elapsed || 1)).toFixed(1);
                
                console.log(`   ✅ ${migrated} entradas migradas en ${elapsed}s (${entriesPerSec} entradas/s)`);
                console.log(`   📈 Progreso: ${progress}%`);
                
                // Pausa entre lotes para no sobrecargar
                if (offset + BATCH_SIZE < total) {
                    await this.sleep(DELAY_BETWEEN_BATCHES);
                }
                
            } catch (error) {
                console.error(`   ❌ Error en lote ${batchNum}:`, error.message);
                this.stats.errors++;
                
                // Continuar con el siguiente lote en caso de error
                await this.sleep(DELAY_BETWEEN_BATCHES * 2);
            }

            offset += BATCH_SIZE;
            batchNum++;
        }

        console.log(`\n✅ Migración de entradas completada: ${this.stats.entriesMigrated} entradas`);
    }

    async migrateEntriesBatch(offset, limit) {
        // Obtener entradas únicas con información de segmentos
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
            try {
                // Insertar o actualizar entrada
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
                    continue;
                }

                // Migrar acepciones para esta entrada
                const sensesCount = await this.migrateSensesForEntry(entry.key_value, entryData.entry_id);
                this.stats.sensesMigrated += sensesCount;

            } catch (error) {
                console.error(`     ❌ Error procesando ${entry.lemma}:`, error.message);
                this.stats.errors++;
            }
        }

        return entries.length;
    }

    async migrateSensesForEntry(keyValue, entryId) {
        // Obtener acepciones con metadatos completos
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
            console.error(`     ⚠️ Error acepciones entrada ${entryId}:`, error.message);
            return 0;
        }

        return senses.length;
    }

    async migrateAllWordRelations() {
        console.log('\n🔗 Iniciando migración de relaciones palabra-diccionario...');
        
        const totalWords = await this.queryAsync('SELECT COUNT(*) as total FROM lexicon_indexes');
        const total = totalWords[0].total;
        
        console.log(`   📊 Total palabras para relacionar: ${total.toLocaleString()}`);

        let offset = 0;
        let batchNum = 1;
        const relationsBatchSize = BATCH_SIZE * 5; // Lotes más grandes para relaciones
        const totalBatches = Math.ceil(total / relationsBatchSize);

        while (offset < total) {
            console.log(`\n🔗 Lote relaciones ${batchNum}/${totalBatches} (offset: ${offset})`);
            
            try {
                const relationsCount = await this.migrateWordRelationsBatch(offset, relationsBatchSize);
                this.stats.relationsMigrated += relationsCount;
                
                const progress = ((offset + relationsBatchSize) / total * 100).toFixed(1);
                console.log(`   ✅ ${relationsCount} relaciones procesadas - Progreso: ${progress}%`);
                
                if (offset + relationsBatchSize < total) {
                    await this.sleep(DELAY_BETWEEN_BATCHES);
                }
                
            } catch (error) {
                console.error(`   ❌ Error en lote relaciones ${batchNum}:`, error.message);
                this.stats.errors++;
            }

            offset += relationsBatchSize;
            batchNum++;
        }

        console.log(`\n✅ Migración de relaciones completada: ${this.stats.relationsMigrated} relaciones`);
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
            const word = relation.non_diac_word;
            
            // Procesar cada tipo de relación
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

                // Buscar entry_id para este key_value
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
                // Silenciar errores menores de relaciones
            }
        }

        return inserted;
    }

    async showFinalStats() {
        console.log('\n📊 ESTADÍSTICAS FINALES DE MIGRACIÓN');
        console.log('====================================');

        // Estadísticas de migración
        const elapsed = (Date.now() - this.stats.startTime) / 1000 / 60; // minutos
        console.log(`⏱️ Tiempo total: ${elapsed.toFixed(1)} minutos`);
        console.log(`📝 Entradas migradas: ${this.stats.entriesMigrated.toLocaleString()}`);
        console.log(`📖 Acepciones migradas: ${this.stats.sensesMigrated.toLocaleString()}`);
        console.log(`🔗 Relaciones migradas: ${this.stats.relationsMigrated.toLocaleString()}`);
        console.log(`❌ Errores: ${this.stats.errors}`);

        // Verificar conteos finales en Supabase
        const tables = [
            'dictionary_categories',
            'dictionary_entries', 
            'dictionary_senses',
            'word_dictionary_relations'
        ];

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

    // Utilidades
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

// Ejecutar migración completa
if (require.main === module) {
    const migrator = new FullDictionaryMigrator();
    
    process.on('SIGINT', () => {
        console.log('\n\n⚠️ Migración interrumpida por usuario');
        migrator.showFinalStats().then(() => {
            process.exit(0);
        });
    });

    migrator.runFullMigration().catch(error => {
        console.error('\n💥 MIGRACIÓN FALLIDA:', error);
        process.exit(1);
    });
}