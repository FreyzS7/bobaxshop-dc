#!/bin/bash
# BobaxShop - Start script untuk Ubuntu
# Usage:
#   ./start.sh          → production (PM2)
#   ./start.sh dev      → development (tmux)
#   ./start.sh stop     → stop semua PM2 process
#   ./start.sh logs     → lihat logs PM2
#   ./start.sh status   → status semua process

MODE=${1:-prod}

case "$MODE" in
  dev)
    echo "🚀 Starting BobaxShop in DEV mode..."
    if ! command -v tmux &> /dev/null; then
      echo "❌ tmux tidak ditemukan. Install: sudo apt install tmux"
      exit 1
    fi
    # Buat session baru atau attach ke yang sudah ada
    tmux new-session -d -s bobax 2>/dev/null || true
    tmux send-keys -t bobax "cd $(pwd) && pnpm --filter bot dev" Enter
    tmux split-window -h -t bobax
    tmux send-keys -t bobax "cd $(pwd) && pnpm --filter web dev" Enter
    tmux attach -t bobax
    ;;

  stop)
    echo "🛑 Stopping all PM2 processes..."
    pm2 stop ecosystem.config.js
    ;;

  logs)
    pm2 logs
    ;;

  status)
    pm2 status
    ;;

  prod|*)
    echo "🚀 Starting BobaxShop in PRODUCTION mode..."
    if ! command -v pm2 &> /dev/null; then
      echo "❌ PM2 tidak ditemukan. Install: npm install -g pm2"
      exit 1
    fi
    pm2 start ecosystem.config.js
    pm2 save
    echo ""
    pm2 status
    ;;
esac
