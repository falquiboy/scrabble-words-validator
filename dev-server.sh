#!/bin/bash

# Script para manejo definitivo del servidor de desarrollo
# Uso: ./dev-server.sh [start|stop|restart|status]

PORT=3000
PROJECT_NAME="scrabble-words-validator"

case $1 in
  "stop")
    echo "🛑 Deteniendo servidor de desarrollo..."
    # Matar procesos por puerto
    lsof -ti:$PORT | xargs kill -9 2>/dev/null
    # Matar procesos de vite para este proyecto
    pkill -f "vite.*$PROJECT_NAME" 2>/dev/null
    pkill -f "node.*vite" 2>/dev/null
    echo "✅ Servidor detenido"
    ;;
  
  "start")
    echo "🚀 Iniciando servidor de desarrollo en puerto $PORT..."
    # Primero detener cualquier proceso existente
    $0 stop
    sleep 2
    # Iniciar servidor
    npm run dev -- --host 0.0.0.0 --port $PORT
    ;;
  
  "restart")
    echo "🔄 Reiniciando servidor..."
    $0 stop
    sleep 2
    $0 start
    ;;
  
  "status")
    echo "📊 Estado del servidor:"
    if lsof -ti:$PORT > /dev/null 2>&1; then
      echo "✅ Servidor corriendo en puerto $PORT"
      echo "🌐 URL: http://localhost:$PORT/"
      lsof -ti:$PORT | head -5
    else
      echo "❌ No hay servidor corriendo en puerto $PORT"
    fi
    ;;
  
  *)
    echo "📖 Uso: $0 [start|stop|restart|status]"
    echo ""
    echo "Comandos:"
    echo "  start   - Iniciar servidor de desarrollo"
    echo "  stop    - Detener servidor"
    echo "  restart - Reiniciar servidor"
    echo "  status  - Ver estado del servidor"
    echo ""
    echo "URL del servidor: http://localhost:$PORT/"
    ;;
esac