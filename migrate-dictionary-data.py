#!/usr/bin/env python3
"""
Script de Migración Gradual del Diccionario Español
Migra datos desde SQLite (diccionario.db) a Supabase PostgreSQL en lotes seguros
"""

import sqlite3
import psycopg2
import json
import sys
import time
from typing import Dict, List, Tuple, Optional

# Configuración de conexiones
SQLITE_DB_PATH = "/Users/isaacfalconer/DB_sources/diccionario.db"
POSTGRES_CONFIG = {
    'host': 'aws-0-us-west-1.pooler.supabase.com',
    'port': 6543,
    'database': 'postgres',
    'user': 'postgres.duxzmtvrcaphljakflod',
    'password': '2PVN2zxkXvbwvYo'
}

class DictionaryMigrator:
    def __init__(self, test_mode=True, batch_size=100):
        self.test_mode = test_mode
        self.batch_size = batch_size
        self.sqlite_conn = None
        self.postgres_conn = None
        
    def connect_databases(self):
        """Conecta a ambas bases de datos"""
        try:
            # Conectar SQLite
            self.sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
            self.sqlite_conn.row_factory = sqlite3.Row
            print("✅ Conectado a SQLite")
            
            # Conectar PostgreSQL
            self.postgres_conn = psycopg2.connect(**POSTGRES_CONFIG)
            self.postgres_conn.autocommit = False
            print("✅ Conectado a PostgreSQL")
            
        except Exception as e:
            print(f"❌ Error conectando bases de datos: {e}")
            sys.exit(1)
    
    def migrate_categories(self) -> bool:
        """Migra todas las categorías (géneros, POS, regiones, etc.)"""
        print("📊 Migrando categorías...")
        
        try:
            cursor_sqlite = self.sqlite_conn.cursor()
            cursor_postgres = self.postgres_conn.cursor()
            
            # Migrar géneros
            cursor_sqlite.execute("SELECT code, description FROM genders")
            genders = cursor_sqlite.fetchall()
            
            for gender in genders:
                cursor_postgres.execute("""
                    INSERT INTO dictionary_categories (category_type, code, description)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (category_type, code) DO NOTHING
                """, ('gender', gender['code'], gender['description']))
            
            # Migrar categorías gramaticales
            cursor_sqlite.execute("SELECT code, description FROM pos_categories")
            pos_cats = cursor_sqlite.fetchall()
            
            for pos in pos_cats:
                cursor_postgres.execute("""
                    INSERT INTO dictionary_categories (category_type, code, description)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (category_type, code) DO NOTHING
                """, ('pos', pos['code'], pos['description']))
            
            # Migrar regiones
            cursor_sqlite.execute("SELECT abbrev, meaning FROM regions")
            regions = cursor_sqlite.fetchall()
            
            for region in regions:
                cursor_postgres.execute("""
                    INSERT INTO dictionary_categories (category_type, code, description)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (category_type, code) DO NOTHING
                """, ('region', region['abbrev'], region['meaning']))
            
            # Migrar dominios
            cursor_sqlite.execute("SELECT abbrev, meaning FROM domains")
            domains = cursor_sqlite.fetchall()
            
            for domain in domains:
                cursor_postgres.execute("""
                    INSERT INTO dictionary_categories (category_type, code, description)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (category_type, code) DO NOTHING
                """, ('domain', domain['abbrev'], domain['meaning']))
            
            self.postgres_conn.commit()
            print(f"✅ Migradas {len(genders)} géneros, {len(pos_cats)} categorías POS, {len(regions)} regiones, {len(domains)} dominios")
            return True
            
        except Exception as e:
            print(f"❌ Error migrando categorías: {e}")
            self.postgres_conn.rollback()
            return False
    
    def migrate_entries_batch(self, offset: int = 0, limit: int = None) -> bool:
        """Migra un lote de entradas del diccionario"""
        if limit is None:
            limit = self.batch_size
            
        print(f"📝 Migrando lote de entradas: offset={offset}, limit={limit}")
        
        try:
            cursor_sqlite = self.sqlite_conn.cursor()
            cursor_postgres = self.postgres_conn.cursor()
            
            # Obtener entradas del diccionario con información de segmentos
            query = """
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
            """
            
            cursor_sqlite.execute(query, (limit, offset))
            entries = cursor_sqlite.fetchall()
            
            if not entries:
                print("ℹ️ No hay más entradas para migrar")
                return False
            
            # Insertar entradas en PostgreSQL
            for entry in entries:
                cursor_postgres.execute("""
                    INSERT INTO dictionary_entries 
                    (key_value, lemma, etymology_info, parenthesis_info, total_senses)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (key_value) DO UPDATE SET
                        lemma = EXCLUDED.lemma,
                        etymology_info = EXCLUDED.etymology_info,
                        parenthesis_info = EXCLUDED.parenthesis_info,
                        total_senses = EXCLUDED.total_senses,
                        updated_at = NOW()
                    RETURNING entry_id
                """, (
                    float(entry['key_value']),
                    entry['lemma'],
                    entry['etymology_origin'],
                    entry['parenthesis_info'],
                    entry['total_senses']
                ))
                
                entry_id = cursor_postgres.fetchone()[0]
                
                # Migrar acepciones para esta entrada
                self.migrate_senses_for_entry(entry['key_value'], entry_id)
            
            self.postgres_conn.commit()
            print(f"✅ Migradas {len(entries)} entradas del diccionario")
            return True
            
        except Exception as e:
            print(f"❌ Error migrando entradas: {e}")
            self.postgres_conn.rollback()
            return False
    
    def migrate_senses_for_entry(self, key_value: float, entry_id: int):
        """Migra las acepciones de una entrada específica"""
        cursor_sqlite = self.sqlite_conn.cursor()
        cursor_postgres = self.postgres_conn.cursor()
        
        # Obtener acepciones con información completa
        query = """
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
        """
        
        cursor_sqlite.execute(query, (key_value,))
        senses = cursor_sqlite.fetchall()
        
        for sense in senses:
            cursor_postgres.execute("""
                INSERT INTO dictionary_senses 
                (entry_id, sense_number, definition, gender_code, pos_code, 
                 pos_secondary_code, verb_type_code, usage_frequency_code, 
                 style_code, region_code, domain_code, is_cross_reference)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (entry_id, sense_number) DO UPDATE SET
                    definition = EXCLUDED.definition,
                    gender_code = EXCLUDED.gender_code,
                    pos_code = EXCLUDED.pos_code,
                    updated_at = NOW()
            """, (
                entry_id,
                sense['sense_num'],
                sense['definition'],
                sense['gender_code'],
                sense['pos_code'],
                sense['pos_secondary_code'],
                sense['verb_type_code'],
                sense['usage_frequency_code'],
                sense['style_code'],
                sense['region_code'],
                sense['domain_code'],
                bool(sense['is_cross_ref'])
            ))
    
    def migrate_word_relations_batch(self, offset: int = 0, limit: int = None) -> bool:
        """Migra relaciones palabra-diccionario en lotes"""
        if limit is None:
            limit = self.batch_size * 10  # Más relaciones por lote
            
        print(f"🔗 Migrando relaciones palabra-diccionario: offset={offset}, limit={limit}")
        
        try:
            cursor_sqlite = self.sqlite_conn.cursor()
            cursor_postgres = self.postgres_conn.cursor()
            
            # Obtener relaciones desde lexicon_indexes
            query = """
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
            LIMIT ? OFFSET ?
            """
            
            cursor_sqlite.execute(query, (limit, offset))
            relations = cursor_sqlite.fetchall()
            
            if not relations:
                return False
            
            for relation in relations:
                word = relation['non_diac_word']
                
                # Procesar cada tipo de relación
                if relation['key_lemma']:
                    for key in relation['key_lemma'].split(','):
                        if key.strip():
                            self.insert_word_relation(cursor_postgres, word, float(key.strip()), 'lemma')
                
                if relation['key_feminine']:
                    for key in relation['key_feminine'].split(','):
                        if key.strip():
                            self.insert_word_relation(cursor_postgres, word, float(key.strip()), 'feminine')
                
                if relation['key_plural']:
                    for key in relation['key_plural'].split(','):
                        if key.strip():
                            self.insert_word_relation(cursor_postgres, word, float(key.strip()), 'plural')
                
                if relation['key_conj']:
                    for key in relation['key_conj'].split(','):
                        if key.strip():
                            self.insert_word_relation(cursor_postgres, word, float(key.strip()), 'conjugation')
                
                if relation['key_variant']:
                    for key in relation['key_variant'].split(','):
                        if key.strip():
                            self.insert_word_relation(cursor_postgres, word, float(key.strip()), 'variant')
            
            self.postgres_conn.commit()
            print(f"✅ Procesadas {len(relations)} palabras para relaciones")
            return True
            
        except Exception as e:
            print(f"❌ Error migrando relaciones: {e}")
            self.postgres_conn.rollback()
            return False
    
    def insert_word_relation(self, cursor, word: str, key_value: float, relation_type: str):
        """Inserta una relación palabra-diccionario si la entrada existe"""
        try:
            cursor.execute("""
                INSERT INTO word_dictionary_relations (word, entry_id, relation_type)
                SELECT %s, entry_id, %s
                FROM dictionary_entries 
                WHERE key_value = %s
                ON CONFLICT (word, entry_id, relation_type) DO NOTHING
            """, (word, relation_type, key_value))
        except Exception as e:
            print(f"⚠️ Error insertando relación {word}->{key_value}: {e}")
    
    def get_migration_stats(self) -> Dict:
        """Obtiene estadísticas de la migración"""
        cursor_postgres = self.postgres_conn.cursor()
        
        stats = {}
        
        # Contar categorías
        cursor_postgres.execute("SELECT category_type, COUNT(*) FROM dictionary_categories GROUP BY category_type")
        stats['categories'] = dict(cursor_postgres.fetchall())
        
        # Contar entradas
        cursor_postgres.execute("SELECT COUNT(*) FROM dictionary_entries")
        stats['entries'] = cursor_postgres.fetchone()[0]
        
        # Contar acepciones
        cursor_postgres.execute("SELECT COUNT(*) FROM dictionary_senses")
        stats['senses'] = cursor_postgres.fetchone()[0]
        
        # Contar relaciones
        cursor_postgres.execute("SELECT COUNT(*) FROM word_dictionary_relations")
        stats['relations'] = cursor_postgres.fetchone()[0]
        
        return stats
    
    def run_test_migration(self):
        """Ejecuta migración de prueba con muestra pequeña"""
        print("🧪 Iniciando migración de prueba...")
        
        self.connect_databases()
        
        # Migrar categorías
        if not self.migrate_categories():
            return False
        
        # Migrar lote pequeño de entradas (10)
        if not self.migrate_entries_batch(offset=0, limit=10):
            return False
        
        # Migrar relaciones para estas entradas
        if not self.migrate_word_relations_batch(offset=0, limit=50):
            return False
        
        # Mostrar estadísticas
        stats = self.get_migration_stats()
        print("\n📊 Estadísticas de migración de prueba:")
        print(f"   Categorías: {stats['categories']}")
        print(f"   Entradas: {stats['entries']}")
        print(f"   Acepciones: {stats['senses']}")
        print(f"   Relaciones: {stats['relations']}")
        
        print("✅ Migración de prueba completada exitosamente!")
        return True
    
    def run_full_migration(self):
        """Ejecuta migración completa en lotes"""
        print("🚀 Iniciando migración completa...")
        
        self.connect_databases()
        
        # Migrar categorías
        if not self.migrate_categories():
            return False
        
        # Migrar entradas en lotes
        offset = 0
        while True:
            if not self.migrate_entries_batch(offset=offset):
                break
            offset += self.batch_size
            time.sleep(0.1)  # Pausa pequeña entre lotes
        
        # Migrar relaciones en lotes
        offset = 0
        while True:
            if not self.migrate_word_relations_batch(offset=offset):
                break
            offset += self.batch_size * 10
            time.sleep(0.1)
        
        # Estadísticas finales
        stats = self.get_migration_stats()
        print("\n📊 Estadísticas finales de migración:")
        print(f"   Categorías: {stats['categories']}")
        print(f"   Entradas: {stats['entries']}")
        print(f"   Acepciones: {stats['senses']}")
        print(f"   Relaciones: {stats['relations']}")
        
        print("✅ Migración completa exitosa!")
        return True
    
    def close_connections(self):
        """Cierra conexiones a bases de datos"""
        if self.sqlite_conn:
            self.sqlite_conn.close()
        if self.postgres_conn:
            self.postgres_conn.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Migrar diccionario de SQLite a PostgreSQL')
    parser.add_argument('--test', action='store_true', help='Ejecutar migración de prueba')
    parser.add_argument('--full', action='store_true', help='Ejecutar migración completa')
    parser.add_argument('--batch-size', type=int, default=100, help='Tamaño de lote')
    
    args = parser.parse_args()
    
    migrator = DictionaryMigrator(batch_size=args.batch_size)
    
    try:
        if args.test:
            migrator.run_test_migration()
        elif args.full:
            migrator.run_full_migration()
        else:
            print("Especifica --test o --full")
            sys.exit(1)
    finally:
        migrator.close_connections()