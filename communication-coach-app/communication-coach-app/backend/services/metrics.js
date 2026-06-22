// Deterministic, rule-based metrics. These don't depend on Grok at all, so
// they stay reliable and explainable even if the LLM call fails or is
// disabled. Grok is reserved for the more subjective judgments (clarity,
// qualitative articulation feedback) in services/grokService.js + routes/evaluate.js.

const FILLER_WORDS = [
  "um", "umm", "uh", "uhh", "uhm", "like", "you know", "i mean",
  "basically", "actually", "literally", "kind of", "sort of", "so yeah",
  "right", "well",
];

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function analyzeFillers(transcript) {
  const text = ` ${transcript.toLowerCase()} `;
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length || 1;

  let fillerCount = 0;
  const found = {};
  for (const filler of FILLER_WORDS) {
    const regex = new RegExp(`\\b${escapeRegExp(filler)}\\b`, "g");
    const matches = text.match(regex);
    if (matches) {
      fillerCount += matches.length;
      found[filler] = matches.length;
    }
  }

  const fillerRate = fillerCount / wordCount; // fillers per word

  // 0% filler rate -> 10/10. Each percentage point of filler rate costs 1 point.
  let score = 10 - Math.min(10, fillerRate * 100);
  score = Math.max(0, Math.round(score * 10) / 10);

  return { fillerCount, wordCount, fillerRate, found, score };
}

export function analyzeFluency(transcript, durationSeconds) {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const minutes = Math.max((durationSeconds || 10) / 60, 0.05);
  const wpm = wordCount / minutes;

  let score;
  if (wpm >= 110 && wpm <= 160) score = 10;
  else if (wpm >= 95 && wpm < 110) score = 8;
  else if (wpm > 160 && wpm <= 180) score = 8;
  else if (wpm >= 75 && wpm < 95) score = 6;
  else if (wpm > 180 && wpm <= 210) score = 6;
  else if (wordCount < 5) score = 2;
  else score = 4;

  return { wordCount, durationSeconds: Math.round(durationSeconds || 0), wpm: Math.round(wpm), score };
}

export function analyzeArticulationFromConfidence(avgConfidence) {
  // The browser's SpeechRecognition API returns a confidence value (0-1)
  // per recognized phrase. Low confidence usually means the engine had to
  // guess at unclear pronunciation, mumbled words, or background noise —
  // so we use it as a proxy for articulation/audibility ("clarity of speech").
  // Some browsers (notably some Chrome versions) always report a flat,
  // unreliable confidence — if so we fall back to a neutral baseline and
  // let Grok's qualitative read of the transcript do more of the work.
  const conf = typeof avgConfidence === "number" && avgConfidence > 0 ? avgConfidence : 0.82;
  const score = Math.max(0, Math.min(15, Math.round(conf * 15 * 10) / 10));
  return { avgConfidence: conf, score };
}
