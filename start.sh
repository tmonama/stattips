#!/bin/bash
# StatTips — bring up all services. Run from project root.
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Postgres (Docker)…"
(cd "$ROOT/backend" && docker compose up -d)

echo "Pre-warming Ollama…"
ollama run qwen2.5:3b-instruct-q4_K_M "hi" >/dev/null 2>&1 &

run_tab () {  # run_tab "title" "command"
  osascript <<EOF
tell application "Terminal"
  activate
  do script "cd '$ROOT' && echo '=== $1 ===' && $2"
end tell
EOF
}

run_tab "TRANSLATOR" "cd backend/translator && source .venv/bin/activate && python app.py"
run_tab "BACKEND"    "cd backend && source .venv/bin/activate && python manage.py runserver"
run_tab "FRONTEND"   "cd frontend && npm run dev"

echo "All services launching in separate Terminal tabs."
echo "Open: http://localhost:5173  (admin: /admin/login)"