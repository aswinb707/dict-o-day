const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export async function fetchQuestions() {
  const res = await fetch(`${API_BASE}/api/questions`);
  if (!res.ok) throw new Error("Failed to load questions");
  return res.json();
}

export async function evaluateAnswer(payload) {
  const res = await fetch(`${API_BASE}/api/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to evaluate answer");
  }
  return res.json();
}
