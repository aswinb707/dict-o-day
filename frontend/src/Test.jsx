import React, { useState, useEffect } from "react";
import "./Test.css";
import { API_BASE_URL } from "./config";

const COMMON_DISTRACTORS = [
  "Ephemeral", "Laconic", "Sanguine", "Mellifluous", "Luminous", 
  "Nostalgia", "Paradigm", "Pragmatic", "Resilient", "Serendipity", 
  "Synergy", "Ubiquitous", "Solitude", "Eloquence", "Cacophony"
];

export default function Test({
  learnedWords = [],
  onTestCompleted,
  questions: propQuestions,
  setQuestions: propSetQuestions,
  userAnswers: propUserAnswers,
  setUserAnswers: propSetUserAnswers,
  submitted: propSubmitted,
  setSubmitted: propSetSubmitted,
  score: propScore,
  setScore: propSetScore
}) {
  const [localQuestions, localSetQuestions] = useState([]);
  const [localUserAnswers, localSetUserAnswers] = useState({});
  const [localSubmitted, localSetSubmitted] = useState(false);
  const [localScore, localSetScore] = useState(0);

  const questions = propQuestions !== undefined ? propQuestions : localQuestions;
  const setQuestions = propSetQuestions !== undefined ? propSetQuestions : localSetQuestions;
  const userAnswers = propUserAnswers !== undefined ? propUserAnswers : localUserAnswers;
  const setUserAnswers = propSetUserAnswers !== undefined ? propSetUserAnswers : localSetUserAnswers;
  const submitted = propSubmitted !== undefined ? propSubmitted : localSubmitted;
  const setSubmitted = propSetSubmitted !== undefined ? propSetSubmitted : localSetSubmitted;
  const score = propScore !== undefined ? propScore : localScore;
  const setScore = propSetScore !== undefined ? propSetScore : localSetScore;

  // Generate test questions when component mounts or pool changes, ONLY if questions list is empty
  useEffect(() => {
    if (questions.length === 0 && learnedWords.length > 0) {
      generateTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnedWords, questions.length]);

  const generateTest = () => {
    if (learnedWords.length === 0) return;

    const generatedQuestions = [];
    const shuffledPool = [...learnedWords].sort(() => 0.5 - Math.random());
    
    // Choose words for MCQ (Up to 3)
    const mcqCount = Math.min(3, shuffledPool.length);
    const mcqWords = shuffledPool.slice(0, mcqCount);
    
    mcqWords.forEach((wordObj) => {
      // Pick 3 distractors
      const distractors = [...learnedWords, ...COMMON_DISTRACTORS.map((w, idx) => ({ id: idx, word: w }))]
        .filter((w) => w.word.toLowerCase() !== wordObj.word.toLowerCase())
        .map((w) => w.word)
        .filter((val, i, self) => self.indexOf(val) === i)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const options = [wordObj.word, ...distractors].sort(() => 0.5 - Math.random());

      generatedQuestions.push({
        type: "mcq",
        wordId: wordObj.id,
        word: wordObj.word,
        definition: wordObj.definition,
        questionText: `Which word matches the definition: "${wordObj.definition}"?`,
        correctAnswer: wordObj.word,
        options,
      });
    });

    // Choose words for Fill in the Blanks (Up to 3, separate from MCQ if possible)
    const fitbWords = shuffledPool.slice(
      mcqCount,
      Math.min(mcqCount + 3, shuffledPool.length)
    );

    const fitbFinalWords = fitbWords.length > 0 ? fitbWords : shuffledPool.slice(0, Math.min(3, shuffledPool.length));

    fitbFinalWords.forEach((wordObj) => {
      // Pick a sentence from the sentences array
      const sentence = (wordObj.sentences && wordObj.sentences.length > 0) 
        ? wordObj.sentences[Math.floor(Math.random() * wordObj.sentences.length)]
        : `An example sentence of ${wordObj.word}`;
      
      const regex = new RegExp(`\\b${wordObj.word}\\b`, "gi");
      const maskedSentence = sentence.replace(regex, "___________");

      generatedQuestions.push({
        type: "fitb",
        wordId: wordObj.id,
        word: wordObj.word,
        sentence: maskedSentence,
        questionText: `Complete the sentence by filling in the learned vocabulary word:`,
        correctAnswer: wordObj.word,
      });
    });

    setQuestions(generatedQuestions.sort(() => 0.5 - Math.random()));
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const handleSelectOption = (qIdx, option) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIdx]: option }));
  };

  const handleTextChange = (qIdx, text) => {
    if (submitted) return;
    setUserAnswers((prev) => ({ ...prev, [qIdx]: text }));
  };

  const handleSubmitTest = () => {
    if (submitted) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // Start the test on the backend
    fetch(`${API_BASE_URL}/api/tests/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ type: "daily" })
    })
    .then((res) => {
      if (!res.ok) throw new Error("Start test response not OK");
      return res.json();
    })
    .then((startData) => {
      const test = startData.data || startData;
      if (!test || !test.id) throw new Error("Could not start test in backend");

      const testId = test.id;
      // Submit each answer
      const answerPromises = questions.map((q, idx) => {
        const uAns = (userAnswers[idx] || "").trim();
        return fetch(`${API_BASE_URL}/api/tests/${testId}/answer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            wordId: q.wordId,
            answer: uAns,
            timeTakenMs: 1000
          })
        });
      });

      return Promise.all(answerPromises).then(() => {
        // Finalize the test
        return fetch(`${API_BASE_URL}/api/tests/${testId}/submit`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
      });
    })
    .then(() => {
      let correctCount = 0;
      questions.forEach((q, idx) => {
        const uAns = (userAnswers[idx] || "").trim().toLowerCase();
        const cAns = q.correctAnswer.toLowerCase();
        if (uAns === cAns) {
          correctCount++;
        }
      });
      setScore(correctCount);
      setSubmitted(true);
      if (onTestCompleted) {
        onTestCompleted();
      }
    })
    .catch((err) => {
      console.error("Error submitting test to backend:", err);
      // Fallback local grading
      let correctCount = 0;
      questions.forEach((q, idx) => {
        const uAns = (userAnswers[idx] || "").trim().toLowerCase();
        const cAns = q.correctAnswer.toLowerCase();
        if (uAns === cAns) {
          correctCount++;
        }
      });
      setScore(correctCount);
      setSubmitted(true);
    });
  };

  // If no words have been learned, display blocked/empty state
  if (learnedWords.length === 0) {
    return (
      <div className="test-container animate-fade-in">
        <header className="test-header">
          <div>
            <h1 className="test-title">Vocabulary Quiz</h1>
            <p className="test-sub">Test your knowledge with multiple choice and fill-in-the-blank questions</p>
          </div>
        </header>
        <div className="test-body-card empty-state-card">
          <div className="empty-state-graphic">🔒</div>
          <h2>No words learned yet</h2>
          <p>You must study and mark some vocabulary words as learned before you can take a test.</p>
          <p className="empty-hint">Head over to the <strong>Learn</strong> section to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="test-container animate-fade-in">
      <header className="test-header">
        <div>
          <h1 className="test-title">Vocabulary Quiz</h1>
          <p className="test-sub">Test your knowledge with multiple choice and fill-in-the-blank questions</p>
        </div>
        {submitted && (
          <button className="retake-test-btn" onClick={generateTest}>
            Retake Test
          </button>
        )}
      </header>

      {/* QUIZ FORM */}
      <div className="test-body-card">
        {questions.map((q, idx) => {
          const isCorrect = (userAnswers[idx] || "").trim().toLowerCase() === q.correctAnswer.toLowerCase();
          const questionClass = submitted
            ? isCorrect
              ? "question-block correct"
              : "question-block incorrect"
            : "question-block";

          return (
            <div key={idx} className={questionClass}>
              <div className="q-label-row">
                <span className="q-number">Question {idx + 1}</span>
                <span className="q-type-badge">{q.type === "mcq" ? "MCQ" : "Fill in the blank"}</span>
              </div>

              <p className="q-text">{q.questionText}</p>

              {/* MCQ Options Rendering */}
              {q.type === "mcq" && (
                <div className="options-grid">
                  {q.options.map((opt) => {
                    const isSelected = userAnswers[idx] === opt;
                    const optClass = `option-pill ${isSelected ? "selected" : ""} ${
                      submitted
                        ? opt === q.correctAnswer
                          ? "correct-option"
                          : isSelected
                          ? "incorrect-option"
                          : ""
                        : ""
                    }`;

                    return (
                      <button
                        key={opt}
                        type="button"
                        className={optClass}
                        onClick={() => handleSelectOption(idx, opt)}
                        disabled={submitted}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* FITB Text Input Rendering */}
              {q.type === "fitb" && (
                <div className="fitb-input-container">
                  <blockquote className="masked-sentence">"{q.sentence}"</blockquote>
                  <div className="fitb-input-row">
                    <input
                      type="text"
                      className={`fitb-text-field ${
                        submitted ? (isCorrect ? "correct-input" : "incorrect-input") : ""
                      }`}
                      placeholder="Type your word here..."
                      value={userAnswers[idx] || ""}
                      onChange={(e) => handleTextChange(idx, e.target.value)}
                      disabled={submitted}
                    />
                    {submitted && !isCorrect && (
                      <span className="correct-answer-hint">Correct Answer: <strong>{q.correctAnswer}</strong></span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!submitted ? (
          <button className="submit-test-btn" onClick={handleSubmitTest}>
            Submit Test & Get Score
          </button>
        ) : (
          <div className="test-results-card animate-fade-in">
            <div className="results-graphic">
              <span className="results-medal">🎯</span>
            </div>
            <div className="results-meta">
              <h2>Your Score: {score} / {questions.length}</h2>
              <p className="results-pct">Accuracy: {Math.round((score / (questions.length || 1)) * 100)}%</p>
              <p className="results-msg">
                {score === questions.length
                  ? "Perfect! You have mastered these words."
                  : score >= questions.length / 2
                  ? "Great job! Review correct answers to perfect your score."
                  : "Keep practicing! Review flashcards in the Learn section."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
