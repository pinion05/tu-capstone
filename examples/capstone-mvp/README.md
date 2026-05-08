# Capstone MVP runnable example

This example is imported from `https://github.com/pinion05/capstone-mvp` so the MVP can be run from this repository.

It contains two runnable apps:

- `stt-server`: FastAPI mock streaming STT server with bundled Korean text fixtures.
- `stt-web`: Next.js UI for simulated/streaming STT, formatting, chat, and node-map generation.

No Docker is required; this example is intended to run with Python and Node.js directly.

## Prerequisites

Install these on your machine before running the example:

- Python 3
- Node.js and npm

Docker is not required.

## Quick start

From this directory:

```bash
./scripts/dev.sh
```

The script starts both the FastAPI STT server and the Next.js web app. Then open:

- Web app: http://localhost:3000/stt
- STT server health: http://localhost:8765/health
- Text fixtures: http://localhost:8765/texts

## Manual run

Terminal 1:

```bash
cd stt-server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8765 --reload
```

Terminal 2:

```bash
cd stt-web
npm install
NEXT_PUBLIC_STT_WS_URL=ws://localhost:8765 npm run dev
```

## Optional LLM features

Formatting, chat, and node-map endpoints use an OpenAI-compatible chat-completions API. Set these env vars before running `stt-web` if you want those features:

```bash
export LLM_API_KEY=...
export LLM_BASE_URL=https://api.z.ai/api/coding/paas/v4
export LLM_MODEL=glm-5-turbo
```

The basic STT simulation flow works without LLM credentials.

## Ports

Defaults:

- STT server: `8765`
- Web app: `3000`

If either port is already in use, override it when starting the script:

```bash
STT_SERVER_PORT=8876 STT_WEB_PORT=3001 ./scripts/dev.sh
```

