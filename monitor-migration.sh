#!/bin/bash

echo "🔄 MONITOR DE MIGRACIÓN (Cada 60 segundos)"
echo "=========================================="
echo "⚡ Mac protegida contra suspensión"
echo "📍 Progreso actual:"

while true; do
    if [ -f "migration-progress.json" ]; then
        entries=$(grep '"entriesMigrated"' migration-progress.json | grep -o '[0-9]*')
        senses=$(grep '"sensesMigrated"' migration-progress.json | grep -o '[0-9]*')
        errors=$(grep '"errors"' migration-progress.json | grep -o '[0-9]*')
        timestamp=$(date "+%H:%M:%S")
        
        # Calcular progreso aproximado (de ~91700 total)
        if [ ! -z "$entries" ]; then
            percentage=$(( entries * 100 / 91700 ))
            echo "[$timestamp] 📊 Entradas: $entries ($percentage%) | Sentidos: $senses | Errores: $errors"
        fi
    fi
    
    # Verificar si el proceso sigue ejecutándose
    if ! pgrep -f "migrate-dictionary-resilient" > /dev/null; then
        echo "⚠️  ¡PROCESO DE MIGRACIÓN DETENIDO!"
        break
    fi
    
    sleep 60
done