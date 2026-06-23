import React, { useState, useEffect } from "react";
import "./Test.css";
import { VOCABULARY_BANK } from "./data/words";

export default function Test({ learnedWords = [] }) {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({}); // Stores answers: { questionIndex: value }
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Fallback to VOCABULARY_BANK if learnedWords is empty
  const wordPool = learnedWords.length > 0 ? learnedWords : VOCABULARY_BANK;

  // Generate test questions when component mounts or pool changes
  useEffect(() => {
    generateTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnedWords]);

  const generateTest = () => {
    const generatedQuestions = [];
    const shuffledPool = [...wordPool].sort(() => 0.5 - Math.random());
    
    // Choose words for MCQ (Up to 3)
    const mcqWords = shuffledPool.slice(0, Math.min(3, shuffledPool.length));
    mcqWords.forEach((wordObj) => {
      // Pick 3 distractors from VOCABULARY_BANK
      const distractors = VOCABULARY_BANK
        .filter((w) => w.word !== wordObj.word)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((w) => w.word);

      const options = [wordObj.word, ...distractors].sort(() => 0.5 - Math.random());

      generatedQuestions.push({
        type: "mcq",
        word: wordObj.word,
        definition: wordObj.definition,
        questionText: `Which word matches the definition: "${wordObj.definition}"?`,
        correctAnswer: wordObj.word,
        options,
      });
    });

    // Choose words for Fill in the Blanks (Up to 3, separate from MCQ if possible)
    const fitbWords = shuffledPool.slice(
      Math.min(3, shuffledPool.length),
      Math.min(6, shuffledPool.length)
    );

    // If we don't have enough words, reuse some but change sentences
    const fitbFinalWords = fitbWords.length > 0 ? fitbWords : shuffledPool.slice(0, Math.min(3, shuffledPool.length));

    fitbFinalWords.forEach((wordObj) => {
      // Pick a sentence from the 3 sentences
      const sentence = wordObj.sentences[Math.floor(Math.random() * wordObj.sentences.length)];
      
      // Replace the word with blank (case-insensitive)
      const regex = new RegExp(`\\b${wordObj.word}\\b`, "gi");
      const maskedSentence = sentence.replace(regex, "___________");

      generatedQuestions.push({
        type: "fitb",
        word: wordObj.word,
        sentence: maskedSentence,
        questionText: `Complete the sentence by filling in the learned vocabulary word:`,
        correctAnswer: wordObj.word,
      });
    });

    // Shuffle the final list of questions
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
  };

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
