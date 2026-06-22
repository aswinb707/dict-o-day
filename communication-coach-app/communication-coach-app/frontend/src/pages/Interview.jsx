import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AICircle from "../components/AICircle.jsx";
import { fetchQuestions, evaluateAnswer } from "../api.js";

const FALLBACK_QUESTIONS = [
  { id: 1, text: "Tell me a little about yourself and what you're currently working on.", type: "intro" },
  { id: 2, text: "Describe a challenge you faced recently and how you handled it.", type: "behavioral" },
  { id: 3, text: "Explain a process or concept you know well, as if teaching it to a beginner.", type: "explain" },
  { id: 4, text: "What's your opinion on remote work versus working from an office?", type: "opinion" },
  { id: 5, text: "If a teammate missed an important deadline, how would you give them feedback?", type: "scenario" },
];

export default function Interview() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(FALLBACK_QUESTIONS);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | asking | listening | processing | done
  const [liveTranscript, setLiveTranscript] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const confidencesRef = useRef([]);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) setSupported(false);

    fetchQuestions()
      .then((data) => {
        if (Array.isArray(data) && data.length) setQuestions(data);
      })
      .catch(() => {
        // Backend not reachable yet — keep the fallback question set.
      });
  }, []);

  const speak = useCallback((text, onEnd) => {
    setStatus("asking");
    if (!("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.onend = () => onEnd?.();
    utter.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utter);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition isn't supported in this browser. Try desktop Chrome or Edge.");
      setStatus("idle");
      return;
    }

    finalTranscriptRef.current = "";
    confidencesRef.current = [];
    startTimeRef.current = Date.now();
    setLiveTranscript("");
    setError("");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += `${result[0].transcript} `;
          if (typeof result[0].confidence === "number") {
            confidencesRef.current.push(result[0].confidence);
          }
        } else {
          interim += result[0].transcript;
        }
      }
      setLiveTranscript(`${finalTranscriptRef.current}${interim}`);
    };

    recognition.onerror = (e) => {
      if (e.error !== "no-speech") {
        console.error("Speech recognition error:", e.error);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStatus("listening");
  }, []);

  const stopListeningAndSubmit = useCallback(async () => {
    recognitionRef.current?.stop();
    setStatus("processing");

    const transcript = (finalTranscriptRef.current || liveTranscript).trim();
    const durationSeconds = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 10;
    const avgConfidence = confidencesRef.current.length
      ? confidencesRef.current.reduce((a, b) => a + b, 0) / confidencesRef.current.length
      : 0;

    const question = questions[index];

    if (!transcript) {
      setError("No speech was captured. Try again and speak a bit louder.");
      setStatus("idle");
      return;
    }

    try {
      const evaluation = await evaluateAnswer({
        question: question.text,
        questionType: question.type,
        transcript,
        durationSeconds,
        avgConfidence,
      });
      setResults((prev) => [...prev, { question: question.text, transcript, ...evaluation }]);
    } catch (err) {
      setError(`Couldn't reach the scoring backend (${err.message}). Make sure it's running on port 5000.`);
      setResults((prev) => [...prev, { question: question.text, transcript, error: true }]);
    }

    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setStatus("idle");
      setLiveTranscript("");
    } else {
      setStatus("done");
    }
  }, [index, questions, liveTranscript]);

  useEffect(() => {
    if (status === "done") {
      sessionStorage.setItem("coach_results", JSON.stringify(results));
      navigate("/report");
    }
  }, [status, results, navigate]);

  const askCurrentQuestion = () => {
    setError("");
    speak(questions[index].text, () => startListening());
  };

  const currentQuestion = questions[index];
  const circleState =
    status === "asking" ? "speaking" : status === "listening" ? "listening" : status === "processing" ? "thinking" : "idle";

  const circleLabel =
    status === "asking" ? "Asking..." : status === "listening" ? "Listening..." : status === "processing" ? "Evaluating..." : "";

  return (
    <div className="page interview-page">
      <div className="progress-bar">
        Question {Math.min(index + 1, questions.length)} of {questions.length}
      </div>

      <AICircle state={circleState} label={circleLabel} />

      <div className="question-card">
        <p className="question-text">{currentQuestion?.text}</p>
      </div>

      <div className="transcript-box">
        <p>{liveTranscript || "Your spoken answer will appear here as you talk..."}</p>
      </div>

      {!supported && (
        <p className="error-text">
          This browser doesn't support speech recognition. Please use desktop Chrome or Edge for the full experience.
        </p>
      )}
      {error && <p className="error-text">{error}</p>}

      <div className="controls">
        {status === "idle" && (
          <button className="btn primary" onClick={askCurrentQuestion} disabled={!supported}>
            {index === 0 ? "Start Interview" : "Ask Next Question"}
          </button>
        )}
        {status === "listening" && (
          <button className="btn danger" onClick={stopListeningAndSubmit}>
            Stop &amp; Submit Answer
          </button>
        )}
        {(status === "asking" || status === "processing") && (
          <button className="btn" disabled>
            {status === "asking" ? "AI is speaking..." : "Scoring your answer..."}
          </button>
        )}
      </div>
    </div>
  );
}
