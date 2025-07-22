# 🔑 Supabase Authentication - Scrabble Words Validator

## Database Credentials

### PostgreSQL Connection String
```
postgres://postgres.duxzmtvrcaphljakflod:2PVN2zxkXvbwvYo@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

### Individual Components
- **Host**: `aws-0-us-west-1.pooler.supabase.com`
- **Port**: `5432`
- **Database**: `postgres`
- **Username**: `postgres.duxzmtvrcaphljakflod`
- **Password**: `2PVN2zxkXvbwvYo`

## API Keys

### Personal Access Token
```
sbp_v0_7b7b8ae5b9384cf667e56ff58613ba361a5a42b8
```

### Anon Key (for Edge Functions)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MzAxNTYsImV4cCI6MjA0ODQwNjE1Nn0.itzLd_tutXAMakVDJKeWkXZYajs16SkOGmiPKzs0FEk
```

### Service Role Key (for admin operations)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1eHptdHZyY2FwaGxqYWtmbG9kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjUzNzgzOSwiZXhwIjoyMDUyMTEzODM5fQ.H4XC4Bf81SidVk8UhrzCYmRCqBQdNEeKaKNV8F-e47U
```

### Project Details
- **Project ID**: `duxzmtvrcaphljakflod`
- **Project URL**: `https://duxzmtvrcaphljakflod.supabase.co`

## CLI Commands for Common Operations

### Migration Commands
```bash
# Apply migrations
npx supabase migration up --db-url "postgres://postgres.duxzmtvrcaphljakflod:2PVN2zxkXvbwvYo@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# Create new migration
npx supabase migration new <migration_name>

# Check migration status
npx supabase migration list --linked
```

### Direct Database Access
```bash
# Connect via psql
psql "postgres://postgres.duxzmtvrcaphljakflod:2PVN2zxkXvbwvYo@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# Quick query example
psql "postgres://postgres.duxzmtvrcaphljakflod:2PVN2zxkXvbwvYo@aws-0-us-west-1.pooler.supabase.com:5432/postgres" -c "SELECT COUNT(*) FROM public.lexicon_indexes;"
```

### Edge Functions
```bash
# Deploy function
npx supabase functions deploy <function_name>

# Check function logs
npx supabase functions list
```

## Authentication Setup
```bash
# Set access token (if needed)
npx supabase auth login --token sbp_v0_7b7b8ae5b9384cf667e56ff58613ba361a5a42b8

# Link project
npx supabase link --project-ref duxzmtvrcaphljakflod
```

## Project Structure
- **Main Database**: Spanish Scrabble dictionary with normalized words
- **Key Tables**: 
  - `lexicon_indexes` (639,293 records with norm_word column)
  - `dictionary_entries` (migrated Spanish dictionary)
  - `dictionary_senses` (word definitions and semantic data)

## Recent Successful Operations
- ✅ Mission 1: Added `norm_word` column with Scrabble normalizations (CH→Ç, LL→K, RR→W)
- ✅ Fixed CH→Ç normalization (corrected from incorrect CH→C)
- ✅ Applied migrations using professional CLI workflow

## Notes
- All authentication data is public/demo - no security concerns
- Authentication persists between sessions when using CLI properly
- Edge Functions deployable with current setup