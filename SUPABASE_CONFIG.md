# 🔧 Configuración Persistente de Supabase

## 📋 Credenciales del Proyecto

### **Proyecto: Juez Léxico (duxzmtvrcaphljakflod)**
```bash
SUPABASE_URL="https://duxzmtvrcaphljakflod.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjUzNzgzOSwiZXhwIjoyMDUyMTEzODM5fQ.H4XC4Bf81SidVk8UhrzCYmRCqBQdNEeKaKNV8F-e47U"
DB_PASSWORD="2PVN2zxkXvbwvYo"
```

### **Database Connection:**
```bash
# PostgreSQL Direct
PGPASSWORD="2PVN2zxkXvbwvYo" psql -h aws-0-us-west-1.pooler.supabase.com -p 6543 -U postgres.duxzmtvrcaphljakflod -d postgres

# Connection String
postgresql://postgres.duxzmtvrcaphljakflod:2PVN2zxkXvbwvYo@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

## 🛠️ CLI Configuration

### **Supabase CLI:**
```bash
# Ya configurado y linkeado
npx supabase --version  # 2.30.4
npx supabase projects list  # ● duxzmtvrcaphljakflod

# Commands frecuentes:
npx supabase db push           # Aplicar migraciones
npx supabase db pull           # Sincronizar schema
npx supabase gen types         # Generar tipos TypeScript
npx supabase functions deploy  # Deploy functions
```

### **PostgreSQL Tools:**
```bash
# Ya instalado via Homebrew
export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"
which psql  # /opt/homebrew/opt/postgresql@14/bin/psql
```

## 📊 Estado del Proyecto

### **Tablas Principales (Diccionario):**
- ✅ `dictionary_entries` - Entradas del diccionario
- ✅ `dictionary_senses` - Acepciones/definiciones  
- ✅ `dictionary_categories` - Categorías (POS, géneros, etc.)
- ✅ `word_dictionary_relations` - Relaciones palabra-diccionario

### **Tablas de Entrenamiento:**
- ✅ `training_patterns` - Patrones aprendidos del agente
- ✅ `training_rules` - Reglas de filtrado por modo
- ✅ `training_sessions` - Sesiones de entrenamiento
- ✅ `training_logs` - Logs detallados

### **Edge Functions:**
- ✅ `process-natural-query` - Procesamiento de consultas NL
- ✅ `build-trie` - Construcción de estructuras de datos

## 🚀 Workflows Comunes

### **1. Migrations:**
```bash
# Crear nueva migración
npx supabase migration new nombre_migration

# Aplicar migraciones
npx supabase db push

# Ver diferencias
npx supabase db diff
```

### **2. Functions:**
```bash
# Deploy función específica
npx supabase functions deploy function-name

# Deploy todas las funciones
npx supabase functions deploy

# Logs de función
npx supabase functions logs function-name
```

### **3. Types Generation:**
```bash
# Generar tipos TypeScript
npx supabase gen types typescript --local > src/types/database.types.ts
```

### **4. Backup & Restore:**
```bash
# Backup schema
pg_dump -h aws-0-us-west-1.pooler.supabase.com -p 6543 -U postgres.duxzmtvrcaphljakflod -d postgres --schema-only > schema_backup.sql

# Backup data
pg_dump -h aws-0-us-west-1.pooler.supabase.com -p 6543 -U postgres.duxzmtvrcaphljakflod -d postgres --data-only > data_backup.sql
```

## 🔐 Configuración de Environment

### **Para desarrollo local (.env.local):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://duxzmtvrcaphljakflod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjUzNzgzOSwiZXhwIjoyMDUyMTEzODM5fQ.H4XC4Bf81SidVk8UhrzCYmRCqBQdNEeKaKNV8F-e47U
```

### **Para shell (.zshrc / .bashrc):**
```bash
# Supabase CLI
export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"
export SUPABASE_ACCESS_TOKEN="[tu_access_token_aqui]"

# Aliases útiles
alias supa="npx supabase"
alias psql-supa="PGPASSWORD='2PVN2zxkXvbwvYo' psql -h aws-0-us-west-1.pooler.supabase.com -p 6543 -U postgres.duxzmtvrcaphljakflod -d postgres"
```

## 📝 Notas Importantes

1. **API Keys NO caducan** - Son permanentes para el proyecto
2. **Access Tokens SÍ pueden caducar** - Para CLI authentication  
3. **Database password es fija** - No cambia automáticamente
4. **SSL es requerido** - Para conexiones directas a PostgreSQL
5. **Row Level Security está habilitado** - Para algunas tablas

## 🔄 Estado Actual

1. ✅ **Sistema de entrenamiento COMPLETO** - Funcionando al 100%
2. ✅ **Integración en aplicación** - Ctrl+Shift+T para acceder
3. ✅ **Tablas y datos iniciales** - 1 patrón + 3 reglas activas
4. ✅ **Modo dual operativo** - Superuser y producción
5. 🔄 **Migración del diccionario** - 23K/91K entradas (25.1%)
6. ⏳ **Deploy a Netlify** - Esperando finalización de migración

## 🚀 Aplicación Funcionando

- **URL Local**: http://localhost:8080/
- **Sistema de entrenamiento**: Ctrl + Shift + T
- **Credenciales superuser**: alfredo.falconer@gmail.com / scrabble2025
- **Migración automática**: 23K entradas procesadas, 1,637 errores con retry