import React, { useState, useEffect, useRef } from "react";
import "./LearnPage.css";

function getUniqueCardStyle(wordData) {
  if (!wordData) return {};
  if (wordData.fusedWord) {
    return {
      background: "linear-gradient(135deg, #db2777 0%, #ea580c 100%)",
      border: "3px solid #fbbf24",
      color: "#ffffff",
      boxShadow: "0 8px 32px rgba(219, 39, 119, 0.35)",
      textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)"
    };
  }

  let hash = 0;
  const wordStr = wordData.word || "";
  for (let i = 0; i < wordStr.length; i++) {
    hash = wordStr.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 40) % 360;

  return {
    background: `linear-gradient(135deg, hsl(${hue1}, 75%, 20%) 0%, hsl(${hue2}, 70%, 15%) 100%)`,
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#f3f4f6",
    boxShadow: `0 8px 32px hsla(${hue1}, 75%, 20%, 0.25)`
  };
}

const generateQuizForWord = (word, pool) => {
  const isFused = !!word.fusedWord;
  const wordToTest = isFused ? word.fusedWord : word.word;
  const correctDefinition = isFused ? word.fusedDefinition : word.definition;

  const defaultDefinitions = [
    "Present, appearing, or found everywhere.",
    "Lasting for a very short time.",
    "Dealing with things sensibly and realistically in a way that is based on practical considerations.",
    "Able to withstand or recover quickly from difficult conditions.",
    "Tending to keep a firm hold of something; clinging or adhering closely.",
    "Fluent or persuasive in speaking or writing.",
    "Showing great attention to detail; very careful and precise."
  ];

  const defaultSynonyms = ["widespread", "fleeting", "practical", "strong", "persistent", "articulate", "precise"];
  const defaultAntonyms = ["rare", "permanent", "unrealistic", "weak", "yielding", "inarticulate", "careless"];
  const defaultFallbackWords = ["ubiquitous", "ephemeral", "pragmatic", "resilient", "tenacious", "eloquent", "meticulous"];

  // Q1: Definition matching (either "What is definition of X" or "Which word is defined as Y")
  const askWordForDefinition = Math.random() < 0.5;
  let q1;

  // Get other definitions from pool
  const otherDefs = pool
    .filter(w => w.id !== word.id)
    .map(w => w.fusedWord ? w.fusedDefinition : w.definition)
    .filter(Boolean);

  const distractorsQ1 = [];
  for (let def of otherDefs) {
    if (def && def !== correctDefinition && !distractorsQ1.includes(def)) {
      distractorsQ1.push(def);
    }
  }
  let i = 0;
  while (distractorsQ1.length < 2 && i < defaultDefinitions.length) {
    const fallback = defaultDefinitions[i];
    if (fallback !== correctDefinition && !distractorsQ1.includes(fallback)) {
      distractorsQ1.push(fallback);
    }
    i++;
  }

  if (askWordForDefinition) {
    const optionsQ1 = [correctDefinition, distractorsQ1[0] || defaultDefinitions[0], distractorsQ1[1] || defaultDefinitions[1]].sort(() => Math.random() - 0.5);
    q1 = {
      questionText: `What is the correct definition of the word "${wordToTest}"?`,
      options: optionsQ1,
      correctIndex: optionsQ1.indexOf(correctDefinition)
    };
  } else {
    // Distractors are other words
    const otherWords = pool
      .filter(w => w.id !== word.id)
      .map(w => w.fusedWord ? w.fusedWord : w.word)
      .filter(Boolean);
    const distractorsWords = [];
    for (let w of otherWords) {
      if (w && w.toLowerCase() !== wordToTest.toLowerCase() && !distractorsWords.includes(w)) {
        distractorsWords.push(w);
      }
    }
    let idx = 0;
    while (distractorsWords.length < 2 && idx < defaultFallbackWords.length) {
      const fallback = defaultFallbackWords[idx];
      if (fallback.toLowerCase() !== wordToTest.toLowerCase() && !distractorsWords.includes(fallback)) {
        distractorsWords.push(fallback);
      }
      idx++;
    }
    const optionsQ1 = [wordToTest, distractorsWords[0] || defaultFallbackWords[0], distractorsWords[1] || defaultFallbackWords[1]].sort(() => Math.random() - 0.5);
    q1 = {
      questionText: `Which word matches the definition: "${correctDefinition}"?`,
      options: optionsQ1,
      correctIndex: optionsQ1.indexOf(wordToTest)
    };
  }

  // Q2: Synonym or Antonym matching
  let q2;
  const hasSynonyms = word.synonyms && word.synonyms !== "N/A" && word.synonyms.trim().length > 0;
  const hasAntonyms = word.antonyms && word.antonyms !== "N/A" && word.antonyms.trim().length > 0;

  // Decide randomly between synonym, antonym, or part of speech
  const q2Type = (hasSynonyms && hasAntonyms) 
    ? (Math.random() < 0.5 ? "synonym" : "antonym")
    : hasSynonyms ? "synonym" : hasAntonyms ? "antonym" : "pos";

  if (q2Type === "synonym") {
    const synonymsList = word.synonyms.split(",").map(s => s.trim());
    const correctSynonym = synonymsList[Math.floor(Math.random() * synonymsList.length)];

    const otherSyns = pool
      .filter(w => w.id !== word.id)
      .map(w => w.synonyms)
      .filter(s => s && s !== "N/A")
      .flatMap(s => s.split(",").map(item => item.trim()));

    const distractorsQ2 = [];
    for (let s of otherSyns) {
      if (s && s.toLowerCase() !== correctSynonym.toLowerCase() && s.toLowerCase() !== wordToTest.toLowerCase() && !distractorsQ2.includes(s)) {
        distractorsQ2.push(s);
      }
    }
    let j = 0;
    while (distractorsQ2.length < 2 && j < defaultSynonyms.length) {
      const fallback = defaultSynonyms[j];
      if (fallback.toLowerCase() !== correctSynonym.toLowerCase() && fallback.toLowerCase() !== wordToTest.toLowerCase() && !distractorsQ2.includes(fallback)) {
        distractorsQ2.push(fallback);
      }
      j++;
    }

    const optionsQ2 = [correctSynonym, distractorsQ2[0] || defaultSynonyms[0], distractorsQ2[1] || defaultSynonyms[1]].sort(() => Math.random() - 0.5);
    q2 = {
      questionText: `Which of the following is a synonym of "${wordToTest}"?`,
      options: optionsQ2,
      correctIndex: optionsQ2.indexOf(correctSynonym)
    };
  } else if (q2Type === "antonym") {
    const antonymsList = word.antonyms.split(",").map(s => s.trim());
    const correctAntonym = antonymsList[Math.floor(Math.random() * antonymsList.length)];

    const otherAnts = pool
      .filter(w => w.id !== word.id)
      .map(w => w.antonyms)
      .filter(s => s && s !== "N/A")
      .flatMap(s => s.split(",").map(item => item.trim()));

    const distractorsQ2 = [];
    for (let a of otherAnts) {
      if (a && a.toLowerCase() !== correctAntonym.toLowerCase() && a.toLowerCase() !== wordToTest.toLowerCase() && !distractorsQ2.includes(a)) {
        distractorsQ2.push(a);
      }
    }
    let j = 0;
    while (distractorsQ2.length < 2 && j < defaultAntonyms.length) {
      const fallback = defaultAntonyms[j];
      if (fallback.toLowerCase() !== correctAntonym.toLowerCase() && fallback.toLowerCase() !== wordToTest.toLowerCase() && !distractorsQ2.includes(fallback)) {
        distractorsQ2.push(fallback);
      }
      j++;
    }

    const optionsQ2 = [correctAntonym, distractorsQ2[0] || defaultAntonyms[0], distractorsQ2[1] || defaultAntonyms[1]].sort(() => Math.random() - 0.5);
    q2 = {
      questionText: `Which of the following is an antonym of "${wordToTest}"?`,
      options: optionsQ2,
      correctIndex: optionsQ2.indexOf(correctAntonym)
    };
  } else {
    // Part of speech
    const correctPOS = (isFused ? "adjective" : word.pos || "adjective").toLowerCase();
    const allPOS = ["noun", "verb", "adjective", "adverb"];
    const distractorsQ2 = allPOS.filter(p => p !== correctPOS);
    const optionsQ2 = [correctPOS, distractorsQ2[0] || distractorsQ2[0], distractorsQ2[1] || distractorsQ2[1]].sort(() => Math.random() - 0.5);
    q2 = {
      questionText: `What is the part of speech of "${wordToTest}"?`,
      options: optionsQ2,
      correctIndex: optionsQ2.indexOf(correctPOS)
    };
  }

  // Q3: Fill in the blank (Sentence Context)
  let sentence = isFused ? word.fusedSentence : (word.inASentence || (word.sentences && word.sentences[0]));
  if (!sentence) {
    sentence = `It is important to understand the meaning of ${wordToTest}.`;
  }

  // Replace wordToTest in sentence with blank (case-insensitive replace)
  const regex = new RegExp(`\\b${wordToTest}\\b`, 'i');
  let blankSentence = sentence.replace(regex, "_______");
  if (blankSentence === sentence) {
    blankSentence = sentence.replace(new RegExp(wordToTest, 'i'), "_______");
  }

  // Distractors are other words from the pool/defaults
  const otherWordsForBlank = pool
    .filter(w => w.id !== word.id)
    .map(w => w.fusedWord ? w.fusedWord : w.word)
    .filter(Boolean);
  const distractorsQ3 = [];
  for (let w of otherWordsForBlank) {
    if (w && w.toLowerCase() !== wordToTest.toLowerCase() && !distractorsQ3.includes(w)) {
      distractorsQ3.push(w);
    }
  }
  let idx = 0;
  while (distractorsQ3.length < 2 && idx < defaultFallbackWords.length) {
    const fallback = defaultFallbackWords[idx];
    if (fallback.toLowerCase() !== wordToTest.toLowerCase() && !distractorsQ3.includes(fallback)) {
      distractorsQ3.push(fallback);
    }
    idx++;
  }

  const optionsQ3 = [wordToTest, distractorsQ3[0] || defaultFallbackWords[0], distractorsQ3[1] || defaultFallbackWords[1]].sort(() => Math.random() - 0.5);
  const q3 = {
    questionText: `Complete the sentence: "${blankSentence}"`,
    options: optionsQ3,
    correctIndex: optionsQ3.indexOf(wordToTest)
  };

  return [q1, q2, q3];
};

export default function LearnPage({ wordsPool = [], onMarkLearned, onWordSelect }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Quiz States
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [questionsList, setQuestionsList] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Speech Recognition States
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [voiceFeedback, setVoiceFeedback] = useState("");

  const activeWord = wordsPool[currentIdx];

  useEffect(() => {
    if (!activeWord) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const text = finalTranscript || interimTranscript;
        setSpeechTranscript(text);

        if (text) {
          const cleanText = text.toLowerCase().replace(/[^a-z]/g, "");
          const cleanWord = activeWord.word.toLowerCase().replace(/[^a-z]/g, "");
          if (cleanText.includes(cleanWord) || cleanWord.includes(cleanText)) {
            setVoiceFeedback("🎉 Perfect pronunciation! You said it correctly.");
          } else {
            setVoiceFeedback(`It sounded like: "${text}". Try pronouncing it as "${activeWord.pronunciation}".`);
          }
        }
      };

      recognition.onerror = (e) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [activeWord]);

  const startListening = () => {
    if (recognitionRef.current) {
      setSpeechTranscript("");
      setVoiceFeedback("");
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    } else {
      const mockSpeak = prompt("Speech recognition is not supported or active in this browser. Type the word below to simulate pronunciation check:", activeWord.word);
      if (mockSpeak) {
        setSpeechTranscript(mockSpeak);
        const cleanText = mockSpeak.toLowerCase().replace(/[^a-z]/g, "");
        const cleanWord = activeWord.word.toLowerCase().replace(/[^a-z]/g, "");
        if (cleanText.includes(cleanWord) || cleanWord.includes(cleanText)) {
          setVoiceFeedback("🎉 Perfect pronunciation! You said it correctly.");
        } else {
          setVoiceFeedback(`It sounded like: "${mockSpeak}". Try pronouncing it as "${activeWord.pronunciation}".`);
        }
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleNext = () => {
    if (currentIdx < wordsPool.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setFlipped(false);
    }
  };

  const handleSpeak = (e) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(activeWord.word);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleMarkAsLearnedClick = (e) => {
    e.stopPropagation();
    const questions = generateQuizForWord(activeWord, wordsPool);
    setQuestionsList(questions);
    setQuizStep(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setSpeechTranscript("");
    setVoiceFeedback("");
    setIsListening(false);
    setShowQuiz(true);
  };

  const handleOptionClick = (idx) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    const correctIdx = questionsList[quizStep].correctIndex;
    if (idx === correctIdx) {
      setIsCorrect(true);
    } else {
      setIsCorrect(false);
    }
  };

  const handleNextQuestion = () => {
    if (quizStep < 3) {
      setQuizStep(quizStep + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setIsCorrect(false);
      setSpeechTranscript("");
      setVoiceFeedback("");
      setIsListening(false);
    } else {
      setShowQuiz(false);
      onMarkLearned(activeWord.id);
    }
  };

  const handleRetryQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
  };

  if (wordsPool.length === 0) {
    return (
      <div className="learn-empty-state">
        <span className="empty-emoji">🎓</span>
        <h3>All words learned!</h3>
        <p>You have finished all today's words. Head over to the Quiz section to test your knowledge.</p>
      </div>
    );
  }

  // Quiz Overlay View
  if (showQuiz && questionsList.length > 0) {
    if (quizStep === 3) {
      return (
        <div className="root">
          <div className="learn-container animate-fade-in">
            <header className="learn-header">
              <div>
                <h1 className="learn-title">Mastery Check</h1>
                <p className="learn-sub">Complete this pronunciation practice to mark "{activeWord.word}" as learned</p>
              </div>
              <span className="learn-progress-indicator">
                Question 4 of 4
              </span>
            </header>

            <div className="learn-card-workspace">
              <div className="quiz-card">
                <div class="container">
                  <div className="quiz-header">
                    <span className="quiz-header-title">Pronunciation Check</span>
                    <button className="quiz-cancel-btn" onClick={() => { setShowQuiz(false); stopListening(); }}>
                      ✕ Exit Quiz
                    </button>
                  </div>

                  <div className="quiz-question-container" style={{ textAlign: "center", padding: "20px" }}>
                    <p className="quiz-question-text" style={{ fontSize: "18px", marginBottom: "8px" }}>
                      Pronounce the word aloud:
                    </p>
                    <h2 style={{ fontSize: "36px", color: "var(--amber)", margin: "10px 0", fontWeight: "800" }}>
                      {activeWord.word}
                    </h2>
                    <p style={{ color: "var(--text-3)", fontSize: "14px", fontStyle: "italic", marginBottom: "24px" }}>
                      Phonetic: {activeWord.pronunciation}
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                      {isListening ? (
                        <button
                          onClick={stopListening}
                          className="quiz-option-btn incorrect"
                          style={{
                            width: "120px",
                            height: "120px",
                            borderRadius: "50%",
                            fontSize: "24px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            animation: "pulse 1.2s infinite",
                            border: "none",
                            color: "#fff",
                            backgroundColor: "#ef4444"
                          }}
                        >
                          <span>⏹️</span>
                          <span style={{ fontSize: "11px", fontWeight: "600", marginTop: "4px" }}>Listening...</span>
                        </button>
                      ) : (
                        <button
                          onClick={startListening}
                          className="quiz-option-btn"
                          style={{
                            width: "120px",
                            height: "120px",
                            borderRadius: "50%",
                            fontSize: "24px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid var(--amber)",
                            backgroundColor: "rgba(245, 158, 11, 0.1)",
                            color: "var(--amber)"
                          }}
                        >
                          <span>🎙️</span>
                          <span style={{ fontSize: "11px", fontWeight: "600", marginTop: "4px" }}>Tap to Speak</span>
                        </button>
                      )}

                      {speechTranscript && (
                        <div style={{ marginTop: "12px", padding: "10px 20px", borderRadius: "8px", background: "var(--bg-3)", border: "1px solid var(--border-color)", width: "100%", maxWidth: "360px" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-3)", display: "block" }}>You said:</span>
                          <strong style={{ fontSize: "16px", color: "var(--text-1)" }}>"{speechTranscript}"</strong>
                        </div>
                      )}

                      {voiceFeedback && (
                        <div style={{
                          marginTop: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: voiceFeedback.includes("Perfect") ? "var(--green)" : "var(--amber)"
                        }}>
                          {voiceFeedback}
                        </div>
                      )}
                    </div>
                    <div className="learn-controls-row" style={{ justifyContent: "center" }}>
                      <button
                        className="mark-learned-btn"
                        onClick={handleNextQuestion}
                        style={{ width: "320px", display: "block" }}
                      >
                        ✓ Finish & Mark as Learned
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const currentQuestion = questionsList[quizStep];
    return (
      <div className="learn-container animate-fade-in">
        <header className="learn-header">
          <div>
            <h1 className="learn-title">Mastery Check</h1>
            <p className="learn-sub">Complete this quick quiz to mark "{activeWord.word}" as learned</p>
          </div>
          <span className="learn-progress-indicator">
            Question {quizStep + 1} of 4
          </span>
        </header>

        <div className="learn-card-workspace">
          <div className="quiz-card">
            <div className="quiz-header">
              <span className="quiz-header-title">Concept Verification</span>
              <button className="quiz-cancel-btn" onClick={() => setShowQuiz(false)}>
                ✕ Exit Quiz
              </button>
            </div>

            <div className="quiz-question-container">
              <p className="quiz-question-text">{currentQuestion.questionText}</p>

              <div className="quiz-options-list">
                {currentQuestion.options.map((option, idx) => {
                  let btnClass = "quiz-option-btn";
                  if (isAnswered) {
                    if (idx === currentQuestion.correctIndex) {
                      btnClass += " correct";
                    } else if (idx === selectedOption) {
                      btnClass += " incorrect";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      className={btnClass}
                      onClick={() => handleOptionClick(idx)}
                      disabled={isAnswered}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="quiz-feedback">
              {isAnswered && (
                isCorrect ? (
                  <span className="quiz-feedback correct">Correct! 🎉</span>
                ) : (
                  <span className="quiz-feedback incorrect">Incorrect answer. Try again! ❌</span>
                )
              )}
            </div>
          </div>
        </div>

        <div className="learn-controls-row" style={{ justifyContent: "center" }}>
          {isAnswered && (
            isCorrect ? (
              <button
                className="mark-learned-btn"
                onClick={handleNextQuestion}
                style={{ width: "320px", display: "block" }}
              >
                Next Question ➔
              </button>
            ) : (
              <button
                className="details-view-btn"
                onClick={handleRetryQuestion}
                style={{ width: "320px", borderColor: "var(--red)", color: "var(--red)" }}
              >
                ↻ Try Again
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="learn-container animate-fade-in">
      <header className="learn-header">
        <div>
          <h1 className="learn-title">Daily Study Session</h1>
          <p className="learn-sub">Familiarize yourself with today's words</p>
        </div>
        <span className="learn-progress-indicator">
          Word {currentIdx + 1} of {wordsPool.length}
        </span>
      </header>

      {/* Main Flashcard Work Area */}
      <div className="learn-card-workspace">
        <div
          className={`study-word-card ${flipped ? "flipped" : ""}`}
          onClick={() => setFlipped(!flipped)}
        >
          <div className="study-card-inner">
            {/* Front of Card */}
            <div
              className="study-face front"
              style={getUniqueCardStyle(activeWord)}
            >
              <div className="study-card-top">
                <span className="study-pos-tag" style={activeWord.fusedWord ? { background: "rgba(255,255,255,0.25)", color: "#ffffff" } : {}}>{activeWord.pos}</span>
                {activeWord.fusedWord ? (
                  <span className="fused-indicator-badge" style={{ fontSize: "10px", fontWeight: "800", color: "#fbbf24", background: "rgba(0,0,0,0.3)", padding: "2px 8px", borderRadius: "999px" }}>FUSED ⭐</span>
                ) : (
                  <span className="study-flip-hint" style={{ color: "rgba(255,255,255,0.6)" }}>tap to flip</span>
                )}
              </div>
              <h2 className="study-word-title" style={{ color: "#ffffff", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{activeWord.word}</h2>
              <div className="study-audio-row">
                <span className="study-word-pron" style={{ color: "rgba(255,255,255,0.7)" }}>/{activeWord.pronunciation}/</span>
                <button className="study-audio-btn" onClick={handleSpeak} title="Pronounce word" style={{ background: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.25)" }}>
                  🔊
                </button>
              </div>

              <div className="study-mastery-sec">
                <div className="study-mastery-lbl-row" style={{ color: "rgba(255, 255, 255, 0.75)" }}>
                  <span>Current Mastery</span>
                  <span>{activeWord.mastery}%</span>
                </div>
                <div className="study-mastery-track">
                  <div
                    className="study-mastery-fill"
                    style={{
                      width: `${activeWord.mastery}%`,
                      backgroundColor:
                        activeWord.mastery >= 75
                          ? "var(--green)"
                          : activeWord.mastery >= 45
                            ? "var(--amber)"
                            : "var(--red)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Back of Card */}
            <div
              className="study-face back"
              style={{ ...getUniqueCardStyle(activeWord), transform: "rotateY(180deg)" }}
            >
              <div className="study-card-top">
                <span className="study-pos-tag" style={activeWord.fusedWord ? { background: "rgba(255,255,255,0.25)", color: "#ffffff" } : {}}>{activeWord.pos}</span>
                <span className="study-flip-hint" style={{ color: "rgba(255,255,255,0.4)" }}>tap to flip</span>
              </div>
              <h3 className="study-back-title" style={{ color: "#ffffff" }}>{activeWord.word}</h3>
              <div className="study-definition-block">
                <span className="section-label" style={{ color: "rgba(255, 255, 255, 0.5)" }}>Definition</span>
                <p className="study-def-text" style={{ color: "#ffffff" }}>{activeWord.definition}</p>
              </div>
              {activeWord.fusedWord ? (
                <div style={{ marginTop: "12px", borderTop: "1px solid rgba(255,255,255,0.25)", paddingTop: "8px" }}>
                  <span style={{ fontSize: "9px", fontWeight: "800", color: "#fbbf24", display: "block" }}>IELTS LINKED VOCABULARY:</span>
                  <span style={{ fontSize: "14px", fontWeight: "700", display: "block" }}>{activeWord.fusedWord} ({activeWord.fusedPronunciation})</span>
                  <p style={{ fontSize: "11px", margin: "4px 0 0 0", color: "rgba(255,255,255,0.85)" }}>{activeWord.fusedDefinition}</p>
                </div>
              ) : (
                <div className="study-sentence-block">
                  <span className="section-label" style={{ color: "rgba(255, 255, 255, 0.5)" }}>Context Sentence</span>
                  <p className="study-sentence-text" style={{ color: "rgba(255,255,255,0.75)" }}>"{activeWord.sentences[0]}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons Row */}
      <div className="learn-controls-row">
        <button className="nav-arrow-btn" onClick={handlePrev} disabled={currentIdx === 0}>
          ◀ Prev
        </button>

        <div className="center-actions">
          <button className="mark-learned-btn" onClick={handleMarkAsLearnedClick}>
            ✓ Mark as Learned
          </button>
          <button className="details-view-btn" onClick={() => onWordSelect(activeWord)}>
            Full Details ➔
          </button>
        </div>

        <button className="nav-arrow-btn" onClick={handleNext} disabled={currentIdx === wordsPool.length - 1}>
          Next ▶
        </button>
      </div>
    </div>
  );
}
