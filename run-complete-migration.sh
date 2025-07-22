#!/bin/bash

# 🎯 LAUNCHER PARA MIGRACIÓN COMPLETA DE SENSES
# Uso: ./run-complete-migration.sh [start|resume|status|stop]

SCRIPT_PATH="/Users/isaacfalconer/DB_sources/scrabble-words-validator/complete-sense-migrator.cjs"
LOG_FILE="/Users/isaacfalconer/DB_sources/scrabble-words-validator/sense-migration.log"
PROGRESS_FILE="/Users/isaacfalconer/DB_sources/scrabble-words-validator/sense-migration-progress.json"
PID_FILE="/Users/isaacfalconer/DB_sources/scrabble-words-validator/migration.pid"

case "${1:-start}" in
  "start")
    echo "🚀 INICIANDO MIGRACIÓN COMPLETA DE SENSES"
    echo "========================================"
    echo "📊 Total esperado: ~169,092 senses"
    echo "⏸️  Para pausar: Ctrl+C o ./run-complete-migration.sh stop"
    echo "📋 Para ver progreso: ./run-complete-migration.sh status"
    echo ""
    
    # Mantener Mac despierta durante la migración
    caffeinate -d -u -t 14400 &
    CAFFEINATE_PID=$!
    echo "⚡ Mac protegida contra suspensión (PID: $CAFFEINATE_PID)"
    
    # Ejecutar migración
    cd /Users/isaacfalconer/DB_sources/scrabble-words-validator
    node "$SCRIPT_PATH" 2>&1 | tee -a "$LOG_FILE"
    
    # Limpiar
    kill $CAFFEINATE_PID 2>/dev/null
    ;;
    
  "resume")
    echo "🔄 REANUDANDO MIGRACIÓN"
    echo "======================"
    
    if [ -f "$PROGRESS_FILE" ]; then
      LAST_ID=$(grep -o '"lastProcessedSenseId":[0-9]*' "$PROGRESS_FILE" | cut -d: -f2)
      echo "📍 Reanudando desde sense_id: $LAST_ID"
    else
      echo "⚠️  No se encontró archivo de progreso, iniciando desde cero"
    fi
    
    # Mantener Mac despierta
    caffeinate -d -u -t 14400 &
    CAFFEINATE_PID=$!
    
    cd /Users/isaacfalconer/DB_sources/scrabble-words-validator
    node "$SCRIPT_PATH" 2>&1 | tee -a "$LOG_FILE"
    
    kill $CAFFEINATE_PID 2>/dev/null
    ;;
    
  "status")
    echo "📊 ESTADO DE LA MIGRACIÓN"
    echo "========================"
    
    if [ -f "$PROGRESS_FILE" ]; then
      echo "📋 Archivo de progreso encontrado:"
      echo ""
      
      # Extraer información del JSON
      LAST_ID=$(grep -o '"lastProcessedSenseId":[0-9]*' "$PROGRESS_FILE" | cut -d: -f2)
      BATCHES=$(grep -o '"processedBatches":[0-9]*' "$PROGRESS_FILE" | cut -d: -f2)
      TOTAL=$(grep -o '"totalSqliteSenses":[0-9]*' "$PROGRESS_FILE" | cut -d: -f2)
      
      if [ ! -z "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
        PROGRESS=$(echo "scale=2; $LAST_ID * 100 / $TOTAL" | bc -l 2>/dev/null || echo "0")
        echo "   📈 Progreso: $LAST_ID/$TOTAL senses ($PROGRESS%)"
      else
        echo "   📈 Último sense_id procesado: $LAST_ID"
      fi
      
      echo "   📦 Batches procesados: $BATCHES"
      
      # Mostrar últimas líneas del log
      if [ -f "$LOG_FILE" ]; then
        echo ""
        echo "📝 Últimas entradas del log:"
        tail -5 "$LOG_FILE" | sed 's/^/   /'
      fi
      
    else
      echo "❌ No se encontró archivo de progreso"
      echo "💡 La migración no ha iniciado o falló al guardar progreso"
    fi
    
    # Verificar si está ejecutándose
    if pgrep -f "complete-sense-migrator" > /dev/null; then
      echo ""
      echo "🟢 Estado: EJECUTÁNDOSE"
      echo "💡 Para ver progreso en tiempo real: tail -f $LOG_FILE"
    else
      echo ""
      echo "🔴 Estado: DETENIDO"
      echo "💡 Para reanudar: ./run-complete-migration.sh resume"
    fi
    ;;
    
  "stop")
    echo "⏸️  DETENIENDO MIGRACIÓN"
    echo "======================"
    
    # Buscar y detener el proceso
    PIDS=$(pgrep -f "complete-sense-migrator")
    if [ ! -z "$PIDS" ]; then
      echo "🛑 Enviando señal de pausa a procesos: $PIDS"
      kill -INT $PIDS
      
      # Esperar a que se detengan
      sleep 3
      
      # Verificar si se detuvieron
      if pgrep -f "complete-sense-migrator" > /dev/null; then
        echo "⚠️  Proceso aún ejecutándose, enviando SIGTERM"
        pkill -TERM -f "complete-sense-migrator"
        sleep 2
      fi
      
      if pgrep -f "complete-sense-migrator" > /dev/null; then
        echo "❌ Proceso no responde, forzando terminación"
        pkill -KILL -f "complete-sense-migrator"
      else
        echo "✅ Migración detenida correctamente"
      fi
    else
      echo "ℹ️  No hay procesos de migración ejecutándose"
    fi
    ;;
    
  "logs")
    echo "📝 LOGS DE MIGRACIÓN"
    echo "==================="
    
    if [ -f "$LOG_FILE" ]; then
      tail -f "$LOG_FILE"
    else
      echo "❌ No se encontró archivo de log: $LOG_FILE"
    fi
    ;;
    
  *)
    echo "🎯 LAUNCHER DE MIGRACIÓN COMPLETA"
    echo "================================"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos:"
    echo "  start   - Iniciar migración desde cero"
    echo "  resume  - Reanudar migración pausada"
    echo "  status  - Ver estado y progreso actual"
    echo "  stop    - Pausar/detener migración"
    echo "  logs    - Ver logs en tiempo real"
    echo ""
    echo "Ejemplos:"
    echo "  $0 start                    # Iniciar migración"
    echo "  $0 status                   # Ver progreso"
    echo "  $0 logs                     # Ver logs en vivo"
    echo ""
    ;;
esac