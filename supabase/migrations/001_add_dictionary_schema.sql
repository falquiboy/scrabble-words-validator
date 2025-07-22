-- =====================================================
-- Migración 001: Esquema del Diccionario Español
-- Fecha: 2025-07-14
-- Objetivo: Agregar funcionalidad de diccionario SIN modificar tablas existentes
-- =====================================================

-- NOTA: La tabla 'words' existente se mantiene intacta para compatibilidad

-- 1. Tabla de catálogos del diccionario
CREATE TABLE IF NOT EXISTS dictionary_categories (
    category_id SERIAL PRIMARY KEY,
    category_type TEXT NOT NULL, -- 'gender', 'pos', 'region', 'domain', etc.
    code TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_type, code)
);

-- 2. Tabla principal de entradas del diccionario
CREATE TABLE IF NOT EXISTS dictionary_entries (
    entry_id SERIAL PRIMARY KEY,
    key_value REAL NOT NULL UNIQUE, -- Campo key del diccionario original
    lemma TEXT NOT NULL,
    etymology_info TEXT,
    parenthesis_info TEXT,
    total_senses INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de acepciones/definiciones
CREATE TABLE IF NOT EXISTS dictionary_senses (
    sense_id SERIAL PRIMARY KEY,
    entry_id INTEGER NOT NULL REFERENCES dictionary_entries(entry_id) ON DELETE CASCADE,
    sense_number INTEGER NOT NULL DEFAULT 1,
    definition TEXT NOT NULL,
    
    -- Metadatos gramaticales (referencias a catálogos)
    gender_code TEXT,
    pos_code TEXT,
    pos_secondary_code TEXT,
    verb_type_code TEXT,
    usage_frequency_code TEXT,
    style_code TEXT,
    region_code TEXT,
    domain_code TEXT,
    
    -- Indicadores
    is_cross_reference BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(entry_id, sense_number)
);

-- 4. Tabla de relación palabra-diccionario (crucial para integración)
CREATE TABLE IF NOT EXISTS word_dictionary_relations (
    relation_id SERIAL PRIMARY KEY,
    word TEXT NOT NULL, -- Palabra de Scrabble (de tabla 'words' existente)
    entry_id INTEGER NOT NULL REFERENCES dictionary_entries(entry_id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL DEFAULT 'lemma', -- 'lemma', 'feminine', 'plural', 'conjugation', 'variant'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(word, entry_id, relation_type)
);

-- 5. Tabla específica de verbos (información extra)
CREATE TABLE IF NOT EXISTS dictionary_verbs (
    verb_id SERIAL PRIMARY KEY,
    entry_id INTEGER NOT NULL REFERENCES dictionary_entries(entry_id) ON DELETE CASCADE,
    conjugation_model TEXT,
    is_regular BOOLEAN DEFAULT TRUE,
    is_defective BOOLEAN DEFAULT FALSE,
    is_provincial BOOLEAN DEFAULT FALSE,
    
    -- Formas participio
    has_ado BOOLEAN DEFAULT FALSE,
    form_ado TEXT,
    has_ada BOOLEAN DEFAULT FALSE,
    form_ada TEXT,
    has_ados BOOLEAN DEFAULT FALSE,
    form_ados TEXT,
    has_ad BOOLEAN DEFAULT FALSE,
    form_ad TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(entry_id)
);

-- =====================================================
-- ÍNDICES PARA RENDIMIENTO
-- =====================================================

-- Índices principales
CREATE INDEX IF NOT EXISTS idx_dictionary_entries_lemma ON dictionary_entries(lemma);
CREATE INDEX IF NOT EXISTS idx_dictionary_entries_key_value ON dictionary_entries(key_value);
CREATE INDEX IF NOT EXISTS idx_dictionary_senses_entry_id ON dictionary_senses(entry_id);
CREATE INDEX IF NOT EXISTS idx_dictionary_senses_definition ON dictionary_senses USING gin(to_tsvector('spanish', definition));

-- Índices para relaciones palabra-diccionario
CREATE INDEX IF NOT EXISTS idx_word_dictionary_relations_word ON word_dictionary_relations(word);
CREATE INDEX IF NOT EXISTS idx_word_dictionary_relations_entry_id ON word_dictionary_relations(entry_id);
CREATE INDEX IF NOT EXISTS idx_word_dictionary_relations_type ON word_dictionary_relations(relation_type);

-- Índices para categorías
CREATE INDEX IF NOT EXISTS idx_dictionary_categories_type ON dictionary_categories(category_type);
CREATE INDEX IF NOT EXISTS idx_dictionary_categories_code ON dictionary_categories(code);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para búsqueda de texto completo en definiciones
CREATE OR REPLACE FUNCTION search_definitions(search_text TEXT)
RETURNS TABLE(
    entry_id INTEGER,
    lemma TEXT,
    sense_number INTEGER,
    definition TEXT,
    rank REAL
) 
LANGUAGE SQL STABLE
AS $$
    SELECT 
        ds.entry_id,
        de.lemma,
        ds.sense_number,
        ds.definition,
        ts_rank(to_tsvector('spanish', ds.definition), plainto_tsquery('spanish', search_text)) as rank
    FROM dictionary_senses ds
    JOIN dictionary_entries de ON ds.entry_id = de.entry_id
    WHERE to_tsvector('spanish', ds.definition) @@ plainto_tsquery('spanish', search_text)
    ORDER BY rank DESC, de.lemma, ds.sense_number;
$$;

-- Función para obtener definiciones de una palabra Scrabble
CREATE OR REPLACE FUNCTION get_word_definitions(scrabble_word TEXT)
RETURNS TABLE(
    lemma TEXT,
    sense_number INTEGER,
    definition TEXT,
    gender_code TEXT,
    pos_code TEXT,
    relation_type TEXT
) 
LANGUAGE SQL STABLE
AS $$
    SELECT 
        de.lemma,
        ds.sense_number,
        ds.definition,
        ds.gender_code,
        ds.pos_code,
        wdr.relation_type
    FROM word_dictionary_relations wdr
    JOIN dictionary_entries de ON wdr.entry_id = de.entry_id
    JOIN dictionary_senses ds ON de.entry_id = ds.entry_id
    WHERE UPPER(wdr.word) = UPPER(scrabble_word)
    ORDER BY de.lemma, ds.sense_number;
$$;

-- =====================================================
-- TRIGGERS PARA TIMESTAMPS
-- =====================================================

-- Trigger para actualizar updated_at en dictionary_entries
CREATE OR REPLACE FUNCTION update_dictionary_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dictionary_entries_updated_at
    BEFORE UPDATE ON dictionary_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_dictionary_entries_updated_at();

-- Trigger para actualizar updated_at en dictionary_senses
CREATE OR REPLACE FUNCTION update_dictionary_senses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_dictionary_senses_updated_at
    BEFORE UPDATE ON dictionary_senses
    FOR EACH ROW
    EXECUTE FUNCTION update_dictionary_senses_updated_at();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE dictionary_entries IS 'Entradas principales del diccionario español (lemas)';
COMMENT ON TABLE dictionary_senses IS 'Acepciones y definiciones de cada entrada';
COMMENT ON TABLE word_dictionary_relations IS 'Relación entre palabras Scrabble y entradas del diccionario';
COMMENT ON TABLE dictionary_verbs IS 'Información específica de verbos';
COMMENT ON TABLE dictionary_categories IS 'Catálogos de géneros, categorías gramaticales, regiones, etc.';

COMMENT ON FUNCTION search_definitions(TEXT) IS 'Búsqueda de texto completo en definiciones usando índices GIN';
COMMENT ON FUNCTION get_word_definitions(TEXT) IS 'Obtiene todas las definiciones relacionadas con una palabra Scrabble';