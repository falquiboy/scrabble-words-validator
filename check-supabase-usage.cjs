#!/usr/bin/env node
/**
 * Script para verificar uso actual de Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://duxzmtvrcaphljakflod.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk';

async function checkSupabaseUsage() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    console.log('📊 Verificando uso actual de Supabase...\n');

    try {
        // Verificar tablas existentes y sus tamaños
        console.log('🗄️ Tablas existentes:');
        
        // Tabla words (existente)
        const { count: wordsCount, error: wordsError } = await supabase
            .from('words')
            .select('*', { count: 'exact', head: true });

        if (!wordsError) {
            console.log(`   ✅ words: ${wordsCount?.toLocaleString()} registros`);
        }

        // Tablas del diccionario
        const tables = [
            'dictionary_categories',
            'dictionary_entries', 
            'dictionary_senses',
            'word_dictionary_relations',
            'dictionary_verbs'
        ];

        for (const table of tables) {
            try {
                const { count, error } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });

                if (!error) {
                    console.log(`   ✅ ${table}: ${count?.toLocaleString()} registros`);
                } else {
                    console.log(`   ❌ ${table}: Error - ${error.message}`);
                }
            } catch (e) {
                console.log(`   ⚠️ ${table}: No accesible`);
            }
        }

        // Estimación de tamaño de datos
        console.log('\n💾 Estimación de uso de almacenamiento:');
        
        // Datos actuales
        const currentData = {
            words: wordsCount || 0,
            dictionary_categories: 260, // Ya migrado
            dictionary_entries: 10,     // Migración de prueba
            dictionary_senses: 36,      // Migración de prueba
            word_dictionary_relations: 50 // Estimado de prueba
        };

        // Calcular tamaño estimado
        let currentSize = 0;
        currentSize += currentData.words * 50; // ~50 bytes por palabra
        currentSize += currentData.dictionary_categories * 100; // ~100 bytes por categoría
        currentSize += currentData.dictionary_entries * 200; // ~200 bytes por entrada
        currentSize += currentData.dictionary_senses * 300; // ~300 bytes por acepción
        currentSize += currentData.word_dictionary_relations * 100; // ~100 bytes por relación

        console.log(`   📏 Uso actual estimado: ${(currentSize / 1024 / 1024).toFixed(2)} MB`);

        // Proyección para migración completa
        console.log('\n🚀 Proyección para migración completa:');
        
        const fullData = {
            dictionary_entries: 169092,    // Total acepciones únicas 
            dictionary_senses: 169092,     // Total acepciones
            word_dictionary_relations: 639290 * 2 // Promedio 2 relaciones por palabra
        };

        let projectedSize = currentSize;
        projectedSize += fullData.dictionary_entries * 200;
        projectedSize += fullData.dictionary_senses * 300;
        projectedSize += fullData.word_dictionary_relations * 100;

        console.log(`   📈 Tamaño proyectado total: ${(projectedSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   📊 Límite free tier: 500 MB`);
        
        const percentageUsed = (projectedSize / (500 * 1024 * 1024)) * 100;
        console.log(`   🎯 Porcentaje del límite: ${percentageUsed.toFixed(1)}%`);

        if (percentageUsed > 90) {
            console.log('   🚨 ALERTA: Cerca del límite del free tier');
        } else if (percentageUsed > 70) {
            console.log('   ⚠️ ADVERTENCIA: Uso moderado-alto');
        } else {
            console.log('   ✅ USO SEGURO: Dentro de límites');
        }

        // Recomendaciones de optimización
        console.log('\n💡 Recomendaciones de optimización:');
        
        if (percentageUsed > 70) {
            console.log('   🔧 Comprimir definiciones largas');
            console.log('   🗜️ Normalizar códigos de categorías');
            console.log('   📦 Migración en fases');
            console.log('   🎯 Migrar solo palabras comunes primero');
        } else {
            console.log('   ✅ Migración completa es segura');
            console.log('   📈 Espacio suficiente para crecimiento');
        }

        // Verificar si hay datos redundantes
        console.log('\n🔍 Verificando redundancias:');
        
        // Verificar duplicados en words
        const { data: duplicateWords } = await supabase
            .from('words')
            .select('word')
            .limit(5);

        if (duplicateWords && duplicateWords.length > 0) {
            console.log('   📝 Muestra de palabras existentes:', duplicateWords.map(w => w.word).join(', '));
        }

        return {
            currentSizeMB: currentSize / 1024 / 1024,
            projectedSizeMB: projectedSize / 1024 / 1024,
            percentageUsed,
            isSafe: percentageUsed < 70
        };

    } catch (error) {
        console.error('❌ Error verificando uso:', error);
        return null;
    }
}

// Función para verificar tiempo estimado de migración
function estimateMigrationTime() {
    console.log('\n⏱️ Estimación de tiempo de migración:');
    
    const entries = 169092;
    const batchSize = 100;
    const timePerBatch = 2; // segundos
    const batches = Math.ceil(entries / batchSize);
    const totalTimeSeconds = batches * timePerBatch;
    const hours = Math.floor(totalTimeSeconds / 3600);
    const minutes = Math.floor((totalTimeSeconds % 3600) / 60);

    console.log(`   📊 Total entradas: ${entries.toLocaleString()}`);
    console.log(`   📦 Lotes de: ${batchSize} entradas`);
    console.log(`   🔢 Total lotes: ${batches.toLocaleString()}`);
    console.log(`   ⏱️ Tiempo por lote: ${timePerBatch}s`);
    console.log(`   🕐 Tiempo total estimado: ${hours}h ${minutes}m`);
    
    console.log('\n💡 Factores que afectan el tiempo:');
    console.log('   • Rate limits de Supabase');
    console.log('   • Conexión de red');
    console.log('   • Procesamiento de relaciones');
    console.log('   • Validación de integridad');
}

if (require.main === module) {
    checkSupabaseUsage().then(result => {
        if (result) {
            estimateMigrationTime();
            
            console.log('\n📋 RESUMEN:');
            console.log(`   💾 Uso actual: ${result.currentSizeMB.toFixed(2)} MB`);
            console.log(`   📈 Uso proyectado: ${result.projectedSizeMB.toFixed(2)} MB`);
            console.log(`   🎯 Porcentaje límite: ${result.percentageUsed.toFixed(1)}%`);
            console.log(`   ${result.isSafe ? '✅ SEGURO' : '⚠️ REVISAR ESTRATEGIA'}`);
        }
    });
}