import { Router } from "express";

const router = Router();

const QUESTIONS = [
  { id: 1, text: "Tell me a little about yourself and what you're currently working on.", type: "intro" },
  { id: 2, text: "Describe a challenge you faced recently and how you handled it.", type: "behavioral" },
  { id: 3, text: "Explain a process or concept you know well, as if teaching it to a beginner.", type: "explain" },
  { id: 4, text: "What's your opinion on remote work versus working from an office?", type: "opinion" },
  { id: 5, text: "If a teammate missed an important deadline, how would you give them feedback?", type: "scenario" },
];

router.get("/", (req, res) => {
  res.json(QUESTIONS);
});

export default router;
