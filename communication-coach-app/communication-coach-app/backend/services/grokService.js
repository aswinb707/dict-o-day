// Thin wrapper around the xAI Grok chat completions endpoint.
// Uses the global `fetch` available in Node 18+, so no extra HTTP
// dependency is needed.
//
// API reference: https://docs.x.ai/docs/api-reference
// Base URL: https://api.x.ai/v1  ·  Endpoint: POST /chat/completions
// (OpenAI-compatible request/response shape)

const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";

export async function callGrok({ systemPrompt, userPrompt }) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    const err = new Error("NO_API_KEY");
    throw err;
  }

  // xAI periodically retires/renames model slugs. Override via .env if the
  // model below stops working — check https://docs.x.ai for the current
  // recommended chat model.
  const model = process.env.GROK_MODEL || "grok-4.3";

  const response = await fetch(XAI_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Grok API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
