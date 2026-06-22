import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORY_LABELS = {
  articulation: { label: "Articulation", max: 15, hint: "Pronunciation clarity, based on speech-recognition confidence" },
  clarity: { label: "Clarity & Coherence", max: 15, hint: "How well-structured and on-topic your answer was" },
  fillers: { label: "Filler Words", max: 10, hint: "Fewer um/uh/like = higher score" },
  fluency: { label: "Fluency & Pace", max: 10, hint: "Speaking speed and smoothness" },
};

export default function Report() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);

  useEffect(() => {
    const stored = sessionStorage.getItem("coach_results");
    if (stored) setResults(JSON.parse(stored));
  }, []);

  if (!results.length) {
    return (
      <div className="page report-page">
        <p>No session data found.</p>
        <button className="btn primary" onClick={() => navigate("/")}>
          Start an Interview
        </button>
      </div>
    );
  }

  const totals = { articulation: 0, clarity: 0, fillers: 0, fluency: 0 };
  let validCount = 0;
  results.forEach((r) => {
    if (r.error || !r.scores) return;
    validCount += 1;
    totals.articulation += r.scores.articulation || 0;
    totals.clarity += r.scores.clarity || 0;
    totals.fillers += r.scores.fillers || 0;
    totals.fluency += r.scores.fluency || 0;
  });
  const divisor = validCount || 1;
  const avg = {
    articulation: totals.articulation / divisor,
    clarity: totals.clarity / divisor,
    fillers: totals.fillers / divisor,
    fluency: totals.fluency / divisor,
  };
  const totalScore = Math.round((avg.articulation + avg.clarity + avg.fillers + avg.fluency) * 10) / 10;

  return (
    <div className="page report-page">
      <h1>Your Communication Report</h1>

      <div className="score-circle-big">
        <span className="score-number">{totalScore}</span>
        <span className="score-out-of">/ 50</span>
      </div>

      <div className="category-grid">
        {Object.entries(CATEGORY_LABELS).map(([key, meta]) => (
          <div className="category-card" key={key}>
            <h3>{meta.label}</h3>
            <div className="bar-bg">
              <div className="bar-fill" style={{ width: `${Math.min(100, (avg[key] / meta.max) * 100)}%` }} />
            </div>
            <p className="category-score">
              {Math.round(avg[key] * 10) / 10} / {meta.max}
            </p>
            <p className="category-hint">{meta.hint}</p>
          </div>
        ))}
      </div>

      <h2>Per-question feedback</h2>
      <div className="question-results">
        {results.map((r, i) => (
          <div className="result-card" key={i}>
            <h4>
              Q{i + 1}: {r.question}
            </h4>
            {r.error ? (
              <p className="error-text">This answer couldn't be scored — backend was unreachable.</p>
            ) : (
              <>
                <p className="transcript-quote">&ldquo;{r.transcript}&rdquo;</p>
                <p>{r.overallFeedback}</p>
                {r.strengths?.length > 0 && (
                  <p>
                    <strong>Strengths:</strong> {r.strengths.join(" · ")}
                  </p>
                )}
                {r.improvements?.length > 0 && (
                  <p>
                    <strong>Try next:</strong> {r.improvements.join(" · ")}
                  </p>
                )}
                {r.usedGrok === false && (
                  <p className="note-text">Scored in heuristic fallback mode (no Grok API key configured on the backend).</p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <button className="btn primary" onClick={() => navigate("/")}>
        Try Again
      </button>
    </div>
  );
}
