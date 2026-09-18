#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "Stopping Postgres…"
(cd "$ROOT/backend" && docker compose stop)
echo "Killing dev servers…"
pkill -f "manage.py runserver" 2>/dev/null
pkill -f "translator/app.py" 2>/dev/null || pkill -f "app.py" 2>/dev/null
pkill -f "vite" 2>/dev/null
echo "Done. (Ollama left running.)"