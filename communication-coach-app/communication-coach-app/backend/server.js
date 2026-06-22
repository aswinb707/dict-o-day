import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import questionsRouter from "./routes/questions.js";
import evaluateRouter from "./routes/evaluate.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", grokConfigured: Boolean(process.env.XAI_API_KEY) });
});

app.use("/api/questions", questionsRouter);
app.use("/api/evaluate", evaluateRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Communication Coach backend running on http://localhost:${PORT}`);
  console.log(`Grok API key configured: ${Boolean(process.env.XAI_API_KEY)}`);
  if (!process.env.XAI_API_KEY) {
    console.log("No XAI_API_KEY set — evaluation will run in heuristic-only fallback mode.");
  }
});
