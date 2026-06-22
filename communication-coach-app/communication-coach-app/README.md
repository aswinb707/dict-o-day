# AI Communication Coach

A practice app where an AI — shown as a pulsing circle — asks you basic
communication questions out loud, listens to your spoken answer, and scores
it out of 50 on a report page (Articulation, Clarity & Coherence, Filler
Words, Fluency & Pace).

```
communication-coach-app/
├── backend/     Node/Express API: RAG retrieval + Grok scoring + rule-based metrics
└── frontend/    React (Vite) app: AI circle, speech I/O, report page
```

## How it works

1. **Frontend** uses the browser's built-in **SpeechSynthesis** (text-to-speech)
   to ask each question out loud, and the **Web Speech API**
   (`SpeechRecognition`) to transcribe your spoken answer live, with no
   external speech API or key needed for this part.
2. When you stop recording, the transcript + some objective signals
   (recognition confidence, timing) are sent to the backend.
3. The backend's **RAG pipeline** (`backend/rag/`) retrieves the most
   relevant communication-coaching rubric chunks for that question type
   using TF-IDF + cosine similarity (no embeddings API required), and
   injects them as grounding context into a prompt sent to **Grok** (xAI).
4. Grok judges the subjective parts (clarity/coherence, qualitative
   articulation signals) while filler-word counting and speaking pace are
   computed deterministically in code — that split keeps scoring explainable
   and not purely "trust the LLM."
5. Scores per question (Articulation /15, Clarity /15, Fillers /10,
   Fluency /10) are combined into a /50 report on a second page.

> **Note on "level of hearing":** speech audibility/clarity isn't something
> a transcript alone can measure directly, so this is implemented as an
> **Articulation** score derived from the browser's speech-recognition
> confidence (low confidence usually means the engine struggled to make out
> unclear or mumbled words) plus Grok's read of the transcript for garbled
> phrasing. If you meant something different by "hearing," let me know and
> I can adjust the metric.

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```
XAI_API_KEY=your_grok_api_key_here
GROK_MODEL=grok-4.3
PORT=5000
```

Get a key from the [xAI Console](https://console.x.ai). xAI renames/retires
model slugs periodically — if `grok-4.3` ever stops working, check
[docs.x.ai](https://docs.x.ai) for the current recommended chat model and
update `GROK_MODEL`.

Run it:

```bash
npm start
```

You should see `Communication Coach backend running on http://localhost:5000`.

**No API key yet?** The app still works — `routes/evaluate.js` falls back to
a heuristic-only scorer (no Grok call) so you can demo the full flow before
wiring up billing.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # only needed if your backend isn't on localhost:5000
npm run dev
```

Open the printed URL (typically `http://localhost:5173`).

**Use desktop Chrome or Edge** — `SpeechRecognition` support is inconsistent
or missing on Firefox and on iOS Safari.

## 3. Using it

1. Click **Start Interview**. The circle turns orange and the question is
   spoken aloud.
2. The circle turns green ("Listening...") — answer out loud. Your words
   appear live in the transcript box.
3. Click **Stop & Submit Answer**. The circle turns pink while it's scored.
4. After the last question you're taken to **/report** with your score
   breakdown and per-question feedback.

## Extending it

- **Swap in real embeddings for RAG:** `backend/rag/retriever.js` currently
  uses TF-IDF cosine similarity, which needs zero extra API keys. If you
  want true semantic retrieval, replace it with an embeddings call (OpenAI,
  Voyage, or Cohere) and a vector index — xAI doesn't currently expose a
  public embeddings endpoint.
- **More/different questions:** edit `backend/routes/questions.js`.
- **Adjust the rubric:** edit `backend/rag/knowledgeBase.js` — this is what
  gets retrieved and fed to Grok as grounding context.
- **Change scoring weights:** the four categories are split 15/15/10/10 in
  `backend/routes/evaluate.js` and `frontend/src/pages/Report.jsx` — change
  both if you rebalance them.
