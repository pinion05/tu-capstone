#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/stt-server"
WEB_DIR="$ROOT_DIR/stt-web"

cleanup() {
  jobs -p | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT INT TERM

if [ ! -d "$SERVER_DIR/.venv" ]; then
  python3 -m venv "$SERVER_DIR/.venv"
fi
# shellcheck disable=SC1091
source "$SERVER_DIR/.venv/bin/activate"
pip install -r "$SERVER_DIR/requirements.txt"
(
  cd "$SERVER_DIR"
  uvicorn server:app --host 0.0.0.0 --port "${STT_SERVER_PORT:-8765}" --reload
) &

(
  cd "$WEB_DIR"
  if [ ! -d node_modules ]; then
    npm install
  fi
  NEXT_PUBLIC_STT_WS_URL="${NEXT_PUBLIC_STT_WS_URL:-ws://localhost:${STT_SERVER_PORT:-8765}}" npm run dev -- --port "${STT_WEB_PORT:-3000}"
) &

printf '\nCapstone MVP example is starting...\n'
printf '  STT server: http://localhost:%s\n' "${STT_SERVER_PORT:-8765}"
printf '  Web app:    http://localhost:%s/stt\n\n' "${STT_WEB_PORT:-3000}"
wait
