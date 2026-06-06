# EVChamp Chatbot (Chatbot2.0)

RAG-powered FastAPI service that answers questions about the EVChamp
platform. Mirrors ZipsureAI's architecture (LangChain chain + server-side
session memory + Pinecone retrieval), with a thin custom wrapper around the
slim `google-genai` SDK so the deployed bundle fits inside Vercel's 500 MB
Lambda budget.

---

## Stack

| Layer | Component |
| --- | --- |
| Framework | FastAPI (ASGI), served by Vercel Python functions or `uvicorn` locally |
| LLM | `gemini-2.5-flash` via custom `GeminiChatModel` (`app/services/gemini.py`) |
| Embeddings | `models/gemini-embedding-001` (3072-d) via custom `GeminiEmbeddings` |
| Vector store | Pinecone `evchampai` index (3072-d, cosine, AWS `us-east-1`) |
| RAG chain | LangChain `create_retrieval_chain` + `create_stuff_documents_chain` |
| Session memory | LangChain `ChatMessageHistory` + `RunnableWithMessageHistory`, in-memory dict with 1 h TTL |
| Ingest | `httpx` + Playwright (SPA fallback), `RecursiveCharacterTextSplitter`, `PineconeVectorStore.from_documents` |

---

## Project structure

```
Chatbot2.0/
├── app/
│   ├── main.py                     FastAPI app + CORS + router mount
│   ├── core/
│   │   └── config.py               Settings: model names, index, URLs, TTL
│   ├── routers/v1/
│   │   └── chat.py                 GET /chatbot, POST /ask, GET /health/llm
│   ├── schemas/
│   │   └── chat.py                 AskRequest, AskResponse, ChatbotResponse
│   └── services/
│       ├── gemini.py               Thin LangChain wrappers over google-genai
│       ├── rag_service.py          build_rag_chain(), health_check()
│       └── llm_service.py          Back-compat re-export of rag_service
├── scripts/
│   └── ingest.py                   Scrape + chunk + embed + upsert to Pinecone
├── requirements.txt                Local dev deps (includes Playwright)
├── .env                            Secrets only (gitignored)
└── README.md                       This file
```

The Vercel entry point (`api/chat.py` at the repo root) just imports
`app.main:app` after pushing `Chatbot2.0/` onto `sys.path`.

---

## API

Mounted under `/python_api` (mirrors ZipsureAI).

### `GET /python_api/chatbot`
Creates a new conversation session.

```json
{ "session_id": "ee2f185c-8d43-4e81-9a56-d487b6b580d0" }
```

### `POST /python_api/ask`

```json
{
  "question": "What is EVChamp?",
  "session_id": "ee2f185c-..."          // optional; server creates one if absent
}
```

Returns:

```json
{
  "session_id": "ee2f185c-...",
  "question": "What is EVChamp?",
  "response": "EVChamp is an AI and IoT-driven electric mobility platform ..."
}
```

The server prepends prior turns from `_session_cache[session_id]` (1 h TTL)
before invoking the chain, so follow-ups like *"tell me more about the first
one"* resolve correctly.

### `GET /python_api/health/llm`
Returns model names, index status, active session count, chain-built flag.

---

## Request flow

```
POST /python_api/ask
  └─ RunnableWithMessageHistory(chain, session_history)        [langchain-core]
      ├─ create_retrieval_chain                                 [langchain]
      │   ├─ PineconeVectorStore.as_retriever()                [langchain-pinecone]
      │   │     └─ GeminiEmbeddings.embed_query()               [custom -> google-genai]
      │   │           └─ Pinecone.index.query(top_k=10)
      │   └─ create_stuff_documents_chain                       [langchain]
      │       ├─ ChatPromptTemplate.format()                    [langchain-core]
      │       └─ GeminiChatModel._generate()                    [custom -> google-genai]
      └─ ChatMessageHistory.add_user/ai_message()              [langchain-community]
```

---

## Local development

### 1. Install Python deps

```bash
cd Chatbot2.0
python3 -m pip install -r requirements.txt
python3 -m playwright install chromium      # only needed for `ingest`
```

### 2. Set secrets

Create `Chatbot2.0/.env`:

```env
GEMINI_API_KEY=AIza...
PINECONE_API_KEY=pcsk_...
```

Everything non-secret (model names, index name, namespace, TOP_K, ingest URLs,
session TTL) is hard-coded in `app/core/config.py`.

### 3. Run the API

```bash
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/python_api/health/llm
```

### 4. Run the frontend against local backend

In the **frontend** `.env` (at `/Users/ujjwalchopra/Downloads/EVChamp-main/.env`):

```env
REACT_APP_CHATBOT_API_URL=http://localhost:8000/python_api
```

Restart `npm start` so CRA picks it up.

---

## Ingest pipeline

Populates the `evchampai` Pinecone index from the URLs listed in
`config.INGEST_URLS` (evchamp.in pages, zeflash.app, zipsureai.com,
insights.zipsureai.com).

```bash
cd Chatbot2.0
python3 -m scripts.ingest              # incremental upsert
python3 -m scripts.ingest --reset      # delete + recreate index, then upsert
```

What it does per URL:

1. `httpx` GET; if HTML is thin (<500 chars), retries with Playwright
2. Playwright renders the SPA, scrolls to bottom to trigger lazy-mounted sections
3. Strips `<script>/<style>/<nav>/<header>/<footer>`, prefers `<main>`/`<article>` for text
4. Chunks at 1200 chars with 150 overlap (`RecursiveCharacterTextSplitter`)
5. Embeds each chunk with `gemini-embedding-001` (3072-d, task type `RETRIEVAL_DOCUMENT`)
6. Upserts batches of 50 into Pinecone with metadata `{source, title, chunk_index, domain}`

Re-run after adding or editing pages in `INGEST_URLS`.

---

## Deployment (Vercel)

The chatbot ships inside the parent `EVChamp-main` Vercel project as a
Python serverless function:

- Function: `api/chat.py` (at the repo root) imports `app.main:app`
- Rewrite: `/python_api/:path*` -> `/api/chat` (see root `vercel.json`)
- Bundled files: `Chatbot2.0/app/**` (declared in `vercel.json` `functions.includeFiles`)
- Function deps come from the **root** `requirements.txt`, not this folder's

Required env vars in the Vercel project (Settings -> Environment Variables):

| Name | Scope | Used by |
| --- | --- | --- |
| `GEMINI_API_KEY` | Production, Preview, Development | Function |
| `PINECONE_API_KEY` | Production, Preview, Development | Function |

Do not set `REACT_APP_CHATBOT_API_URL` in production. The frontend defaults
to `/python_api` (same origin), which is exactly what the rewrite expects.

---

## Configuration

Everything tunable is in `app/core/config.py`:

| Setting | Default | Notes |
| --- | --- | --- |
| `GEMINI_CHAT_MODEL` | `gemini-2.5-flash` | Switch to `gemini-3-flash-preview` to match ZipsureAI exactly |
| `GEMINI_EMBEDDING_MODEL` | `models/gemini-embedding-001` | Locked to the index dimension |
| `GEMINI_EMBEDDING_DIM` | `3072` | Must match the Pinecone index |
| `PINECONE_INDEX_NAME` | `evchampai` | Cosine, AWS us-east-1 |
| `PINECONE_NAMESPACE` | `default` | All vectors live here |
| `RAG_TOP_K` | `10` | Higher K -> more diverse citations |
| `SESSION_TTL_SECONDS` | `3600` | In-memory session expiry |
| `INGEST_URLS` | EVChamp + Zeflash + ZipsureAI | Edit + re-run ingest |

The system prompt (in `services/rag_service.py`) hard-codes a topic ->
canonical-URL mapping so citations resolve to the right product page instead
of collapsing to the homepage.

---

## Troubleshooting

**`Failed to connect; did you specify the correct index name?`**
Transient Pinecone connection error, usually on a freshly created index.
Retry after a few seconds; check `health_check()` shows `pinecone_ok: true`.

**Bundle exceeds 500 MB on Vercel**
Make sure `langchain-google-genai` is NOT in the root `requirements.txt`.
We replaced it with `google-genai` plus the wrappers in
`app/services/gemini.py`. The deps bundle should weigh ~140-160 MB.

**"GEMINI_API_KEY not configured"**
Locally: `.env` in `Chatbot2.0/` missing or wrong key name.
On Vercel: env var missing in project settings; redeploy after adding.

**Citations all collapse to `evchamp.in`**
Either retrieval returned chunks only from `/about` (bump `RAG_TOP_K`) or
the prompt's topic->URL mapping was edited away. Both live in
`services/rag_service.py`.

**Answer is too short / too long**
Tune the "ANSWER STYLE" block in the system prompt
(`services/rag_service.py:SYSTEM_PROMPT`). Backend hot-reloads with
`--reload`.

---

## Related directories

- `api/chat.py` (repo root) - Vercel function entry point that imports this app
- `src/components/ChatbotPopup.tsx` - frontend chat widget that calls this API
- `ev-champ-chatbot/` (repo root) - original pre-LangChain backend, kept for reference; not deployed
