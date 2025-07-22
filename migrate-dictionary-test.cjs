#!/usr/bin/env node
/**
 * Script de Migración de Prueba del Diccionario
 * Migra una muestra pequeña desde SQLite a Supabase
 */

const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');

// Configuración
const SQLITE_DB_PATH = '/Users/isaacfalconer/DB_sources/diccionario.db';
const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

class DictionaryMigrator {
    constructor() {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        this.db = new sqlite3.Database(SQLITE_DB_PATH);
    }

    async migrateCategories() {
        console.log('📊 Migrando categorías...');
        
        const categories = [
            // Géneros
            { type: 'gender', items: await this.queryAsync("SELECT code, description FROM genders") },
            // Categorías gramaticales
            { type: 'pos', items: await this.queryAsync("SELECT code, description FROM pos_categories") },
            // Regiones
            { type: 'region', items: await this.queryAsync("SELECT abbrev as code, meaning as description FROM regions") },
            // Dominios
            { type: 'domain', items: await this.queryAsync("SELECT abbrev as code, meaning as description FROM domains") }
        ];

        for (const category of categories) {
            const categoryData = category.items.map(item => ({
                category_type: category.type,
                code: item.code,
                description: item.description
            }));

            if (categoryData.length > 0) {
                const { error } = await this.supabase
                    .from('dictionary_categories')
                    .upsert(categoryData, { onConflict: 'category_type,code' });

                if (error) {
                    console.error(`❌ Error migrando ${category.type}:`, error);
                } else {
                    console.log(`✅ Migrados ${categoryData.length} ${category.type}`);
                }
            }
        }
    }

    async migrateTestEntries(limit = 10) {
        console.log(`📝 Migrando ${limit} entradas de prueba...`);

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
            LIMIT ?
        `, [limit]);

        console.log(`📋 Encontradas ${entries.length} entradas para migrar`);

        for (const entry of entries) {
            try {
                // Insertar entrada
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
                    console.error(`❌ Error insertando entrada ${entry.lemma}:`, entryError);
                    continue;
                }

                const entryId = entryData.entry_id;
                console.log(`✅ Entrada "${entry.lemma}" migrada (ID: ${entryId})`);

                // Migrar acepciones para esta entrada
                await this.migrateSensesForEntry(entry.key_value, entryId);

            } catch (error) {
                console.error(`❌ Error procesando entrada ${entry.lemma}:`, error);
            }
        }

        return entries.length;
    }

    async migrateSensesForEntry(keyValue, entryId) {
        // Obtener acepciones con metadatos
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

        if (senses.length === 0) return;

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
            console.error(`❌ Error migrando acepciones para entrada ${entryId}:`, error);
        } else {
            console.log(`   ✅ ${senses.length} acepciones migradas`);
        }
    }

    async migrateTestWordRelations(limit = 50) {
        console.log(`🔗 Migrando ${limit} relaciones palabra-diccionario...`);

        const relations = await this.queryAsync(`
            SELECT 
                non_diac_word,
                all_key,
                key_lemma,
                key_feminine,
                key_plural,
                key_conj,
                key_variant
            FROM lexicon_indexes
            ORDER BY lexicon_id
            LIMIT ?
        `, [limit]);

        for (const relation of relations) {
            const word = relation.non_diac_word;
            
            // Procesar relaciones de lema
            if (relation.key_lemma) {
                const keys = relation.key_lemma.split(',').map(k => k.trim()).filter(k => k);
                await this.insertWordRelations(word, keys, 'lemma');
            }

            // Procesar otros tipos de relaciones
            if (relation.key_feminine) {
                const keys = relation.key_feminine.split(',').map(k => k.trim()).filter(k => k);
                await this.insertWordRelations(word, keys, 'feminine');
            }

            if (relation.key_plural) {
                const keys = relation.key_plural.split(',').map(k => k.trim()).filter(k => k);
                await this.insertWordRelations(word, keys, 'plural');
            }

            if (relation.key_conj) {
                const keys = relation.key_conj.split(',').map(k => k.trim()).filter(k => k);
                await this.insertWordRelations(word, keys, 'conjugation');
            }
        }

        console.log(`✅ Procesadas ${relations.length} palabras para relaciones`);
    }

    async insertWordRelations(word, keys, relationType) {
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

                    if (error && !error.message.includes('duplicate')) {
                        console.error(`⚠️ Error insertando relación ${word}->${key}:`, error);
                    }
                }
            } catch (error) {
                // Silenciar errores menores de relaciones
            }
        }
    }

    async getStats() {
        console.log('\n📊 Estadísticas de migración:');

        // Categorías
        const { data: categories } = await this.supabase
            .from('dictionary_categories')
            .select('category_type')
            .group('category_type');

        const { count: categoryCount } = await this.supabase
            .from('dictionary_categories')
            .select('*', { count: 'exact', head: true });

        // Entradas
        const { count: entryCount } = await this.supabase
            .from('dictionary_entries')
            .select('*', { count: 'exact', head: true });

        // Acepciones
        const { count: senseCount } = await this.supabase
            .from('dictionary_senses')
            .select('*', { count: 'exact', head: true });

        // Relaciones
        const { count: relationCount } = await this.supabase
            .from('word_dictionary_relations')
            .select('*', { count: 'exact', head: true });

        console.log(`   📂 Categorías: ${categoryCount}`);
        console.log(`   📖 Entradas: ${entryCount}`);
        console.log(`   📝 Acepciones: ${senseCount}`);
        console.log(`   🔗 Relaciones: ${relationCount}`);
    }

    async runTestMigration() {
        console.log('🧪 Iniciando migración de prueba...\n');

        try {
            // 1. Migrar categorías
            await this.migrateCategories();
            
            // 2. Migrar entradas de prueba
            await this.migrateTestEntries(10);
            
            // 3. Migrar relaciones de prueba
            await this.migrateTestWordRelations(50);
            
            // 4. Mostrar estadísticas
            await this.getStats();
            
            console.log('\n✅ Migración de prueba completada exitosamente!');
            
        } catch (error) {
            console.error('❌ Error en migración:', error);
        } finally {
            this.db.close();
        }
    }

    // Utilidad para promisificar consultas SQLite
    queryAsync(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

// Ejecutar migración de prueba
if (require.main === module) {
    const migrator = new DictionaryMigrator();
    migrator.runTestMigration();
}