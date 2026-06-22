// Lightweight retrieval for the RAG pipeline.
//
// We don't call an external embeddings API (one less API key to manage).
// Instead we build a term-frequency vector for the query and for every
// document, then rank documents by cosine similarity. For a knowledge base
// this small (a handful of rubric chunks) this is plenty accurate and runs
// instantly with zero dependencies.

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function termFrequency(tokens) {
  const tf = {};
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  return tf;
}

function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const key of keys) {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Retrieve the top-k most relevant documents for a query.
 * @param {string} query - combined question + transcript text
 * @param {Array<{id:string,title:string,text:string,tags?:string[]}>} documents
 * @param {number} k
 */
export function retrieveRelevantDocs(query, documents, k = 4) {
  const queryVec = termFrequency(tokenize(query));

  const scored = documents.map((doc) => {
    const docText = `${doc.title} ${doc.text} ${(doc.tags || []).join(" ")}`;
    const docVec = termFrequency(tokenize(docText));
    return { doc, score: cosineSimilarity(queryVec, docVec) };
  });

  scored.sort((a, b) => b.score - a.score);

  // Always keep the four core rubric docs (articulation/fillers/clarity/fluency)
  // even if scoring is weak, since every evaluation needs them, then fill
  // remaining slots with the best-matching question-type guidance docs.
  const coreIds = new Set([
    "articulation-rubric",
    "filler-words-rubric",
    "clarity-coherence-rubric",
    "fluency-pace-rubric",
  ]);
  const core = documents.filter((d) => coreIds.has(d.id));
  const rest = scored.filter((s) => !coreIds.has(s.doc.id)).slice(0, Math.max(0, k - core.length));

  return [...core, ...rest.map((s) => s.doc)];
}
