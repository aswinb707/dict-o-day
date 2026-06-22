import { Router } from "express";
import { retrieveRelevantDocs } from "../rag/retriever.js";
import { knowledgeBase } from "../rag/knowledgeBase.js";
import { analyzeFillers, analyzeFluency, analyzeArticulationFromConfidence } from "../services/metrics.js";
import { callGrok } from "../services/grokService.js";

const router = Router();

function safeParseJSON(raw) {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// Used only if Grok is unreachable/unconfigured, so the app still works end to end.
function heuristicClarity(transcript) {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 3);
  let score = 7;
  if (words.length > 25) score += 2;
  if (words.length > 60) score += 2;
  if (sentences.length >= 2) score += 2;
  if (words.length < 8) score -= 3;
  return Math.max(0, Math.min(15, score));
}

router.post("/", async (req, res) => {
  const {
    question = "",
    questionType = "general",
    transcript = "",
    durationSeconds = 10,
    avgConfidence = 0,
  } = req.body || {};

  if (!transcript || transcript.trim().length < 1) {
    return res.status(400).json({ error: "Transcript is empty. Please record an answer before submitting." });
  }

  // --- Deterministic metrics (no LLM needed, always reliable) ---
  const fillerResult = analyzeFillers(transcript);
  const fluencyResult = analyzeFluency(transcript, durationSeconds);
  const articulationBase = analyzeArticulationFromConfidence(avgConfidence);

  // --- RAG retrieval step ---
  const relevantDocs = retrieveRelevantDocs(`${questionType} ${question} ${transcript}`, knowledgeBase, 4);
  const ragContext = relevantDocs.map((d) => `### ${d.title}\n${d.text}`).join("\n\n");

  // --- Defaults (used if Grok call fails or no key configured) ---
  let articulationAdjustment = 0;
  let clarityScore = heuristicClarity(transcript);
  let feedback = {
    articulation: "Speech recognition confidence suggests generally clear pronunciation.",
    clarity: "Your answer addressed the question with a reasonable structure.",
    fillers:
      fillerResult.fillerCount === 0
        ? "No filler words detected."
        : `Detected ${fillerResult.fillerCount} filler word(s).`,
    fluency: `Estimated pace: ${fluencyResult.wpm} words per minute.`,
  };
  let overallFeedback = "Keep practicing — consistent reps build confidence over time.";
  let strengths = [];
  let improvements = [];
  let usedGrok = false;
  let grokError = null;

  try {
    const systemPrompt =
      "You are an expert speech and communication coach. You evaluate a spoken answer that was transcribed by speech-to-text software, grounded in the rubric context provided. Respond ONLY with valid JSON matching this exact shape, with no markdown fences and no extra commentary: " +
      '{"articulationAdjustment": number from -3 to 3, "clarityScore": number from 0 to 15, "feedback": {"articulation": string, "clarity": string, "fillers": string, "fluency": string}, "overallFeedback": string, "strengths": [string, string], "improvements": [string, string]}';

    const userPrompt = `RUBRIC CONTEXT (retrieved):
${ragContext}

INTERVIEW QUESTION (type: ${questionType}): "${question}"

CANDIDATE'S SPOKEN ANSWER (speech-to-text transcript): "${transcript}"

OBJECTIVE SIGNALS ALREADY MEASURED:
- Speech recognition confidence: ${(articulationBase.avgConfidence * 100).toFixed(0)}%
- Filler words detected: ${fillerResult.fillerCount} in ${fillerResult.wordCount} words
- Speaking pace: ${fluencyResult.wpm} words/minute over about ${Math.round(durationSeconds)} seconds

Using the rubric context, set clarityScore (0-15) based on how relevant, coherent, and well-structured the answer is to the question asked. Set articulationAdjustment (-3 to 3) based on signs of unclear pronunciation visible in the transcript itself (broken words, repeated self-corrections, garbled phrases) — use 0 if nothing stands out beyond the confidence signal already given. Keep feedback specific and encouraging, max two sentences per field.`;

    const raw = await callGrok({ systemPrompt, userPrompt });
    const parsed = safeParseJSON(raw);
    if (parsed) {
      usedGrok = true;
      if (typeof parsed.clarityScore === "number") {
        clarityScore = Math.max(0, Math.min(15, parsed.clarityScore));
      }
      if (typeof parsed.articulationAdjustment === "number") {
        articulationAdjustment = Math.max(-3, Math.min(3, parsed.articulationAdjustment));
      }
      feedback = { ...feedback, ...(parsed.feedback || {}) };
      overallFeedback = parsed.overallFeedback || overallFeedback;
      strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
      improvements = Array.isArray(parsed.improvements) ? parsed.improvements : [];
    }
  } catch (err) {
    if (err.message === "NO_API_KEY") {
      grokError = "no_api_key";
    } else {
      grokError = err.message;
      console.error("Grok evaluation failed, using heuristic fallback:", err.message);
    }
  }

  const articulationScore = Math.max(
    0,
    Math.min(15, Math.round((articulationBase.score + articulationAdjustment) * 10) / 10)
  );

  const scores = {
    articulation: articulationScore,
    clarity: Math.round(clarityScore * 10) / 10,
    fillers: fillerResult.score,
    fluency: fluencyResult.score,
  };
  const total = Math.round((scores.articulation + scores.clarity + scores.fillers + scores.fluency) * 10) / 10;

  res.json({
    scores,
    total,
    feedback,
    overallFeedback,
    strengths,
    improvements,
    usedGrok,
    grokError,
    retrievedRubrics: relevantDocs.map((d) => d.title),
    metrics: { filler: fillerResult, fluency: fluencyResult, articulationBase },
  });
});

export default router;
