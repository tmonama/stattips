# StatTips — Stats at your fingertips

An AI-enabled assistant for public and media information queries, built for the GovTech 2026 Hackathon (Statistics South Africa challenge). StatTips answers questions **only** from approved Stats SA publications, with citations, and refuses when the data doesn't cover a question rather than guessing. Media enquiries are never auto-answered — they route to a human reviewer.

> Independent prototype for the GovTech 2026 Hackathon — not an official Statistics South Africa product.

## What it does

- **Public assistant** — natural-language questions answered from approved sources, with inline citations, a source-match confidence score, and honest refusal + gap-flagging when nothing covers the question.
- **Media workbench** — journalists submit enquiries (with a reply-to email); the system drafts a cited response for a communications official to edit, approve (emails the enquirer) or reject with a reason. Never auto-sent.
- **Governance console** — role-gated admin: source approval, media review, an append-only audit trail, and analytics.
- **Communication memory** — a searchable repository of approved responses, press releases, statements and FAQs; reuse is suggested in both the review and compose flows for consistency.
- **Compose studio** — officials generate grounded press releases / statements / FAQs; unavailable figures are flagged `[figure to verify]`, never invented.
- **Inclusion** — all 12 official languages in the picker (answers translated by NLLB-200), read-aloud, keyboard/screen-reader accessibility, text-size and high-contrast controls.
- **Sovereign by design** — data and inference both run in-country; the whole stack runs offline on a laptop.

## Tech stack

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Django + Django REST Framework
- **Data + vectors:** PostgreSQL + pgvector (embeddings in the same DB)
- **Retrieval:** bge-small-en embeddings, cosine similarity, HNSW index
- **Generation:** swappable `LLMProvider` — Ollama (Qwen2.5-3B) locally; open-weight model on an in-country GPU in production
- **Translation:** NLLB-200 (open, all 11 official languages) via a CTranslate2 microservice
- **Email:** Resend, with an offline console fallback
- **Hosting target:** AWS af-south-1 (Cape Town) — SA-resident

## Prerequisites

Docker Desktop · Python 3.12 · Node 18+ · [Ollama](https://ollama.com)

## Setup

**1. Database**

cd backend
docker compose up -d


**2. Backend**

cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env # then fill in values
python manage.py migrate
python manage.py createsuperuser

After creating the superuser, set its role to `admin` in Django admin → Profiles (or via the shell).

**3. Language model (generation)**

ollama pull qwen2.5:3b-instruct-q4_K_M


**4. Translation model** (~600 MB, not in git) into `backend/translator/nllb-600M-int8/`:

cd backend/translator
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -c "from huggingface_hub import snapshot_download; snapshot_download('entai2965/nllb-200-distilled-600M-ctranslate2', local_dir='nllb-600M-int8')"


**5. Seed data** — download the listed Stats SA publications into `backend/seed/`, then ingest (omit `--approve` to demo the approval gate):

python manage.py ingest seed/P0141July2026.pdf --title "Consumer Price Index" --code "P0141" --url "https://www.statssa.gov.za/publications/P0141/P0141.pdf" --approve


**6. Frontend**

cd frontend
npm install
npm run dev


## Running everything

From the project root, `./start.sh` brings up Postgres, pre-warms Ollama, and launches the translator, backend and frontend in separate terminal tabs. `./stop.sh` shuts them down gracefully. (Docker Desktop and `ollama serve` must already be running.)

Open **http://localhost:5173** — admin at **/admin/login**.

## Environment (`backend/.env`)

DEBUG=1
SECRET_KEY=...
DATABASE_URL=postgres://statssa:statssa@localhost:5433/statssa
LLM_PROVIDER=ollama
OLLAMA_MODEL=qwen2.5:3b-instruct-q4_K_M
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
CONFIDENCE_THRESHOLD=0.35
TRANSLATOR_URL=http://127.0.0.1:5001
TRANSLATOR_ENABLED=1
EMAIL_BACKEND=console # or 'resend'
RESEND_API_KEY=


## Not in git

The NLLB model (`backend/translator/nllb-600M-int8/`) and seed PDFs (`backend/seed/*.pdf`) are re-downloadable artifacts — see Setup steps 4–5 to restore them.

## Data sovereignty

Data at rest and model inference both stay in South Africa. The demo runs the identical architecture offline on one machine — Postgres, embeddings, the LLM, and translation all local — so no data leaves the country, even for translation. Production swaps the local 3B model for a larger open-weight model on an in-country GPU host; the data path is unchanged.