import React, { useState, useEffect, useRef } from "react";
import "./AITutorPage.css";

const IELTS_QUESTIONS = [
  "Tell me about yourself, including where you are from and what you currently do.",
  "What is your favorite hobby or interest, and how did you get started with it?",
  "How do you think improving your English vocabulary will benefit your future career?",
  "Describe a memorable journey or vacation you have taken. Why was it special?",
  "What is your favorite book, movie, or song, and what makes it appeal to you?"
];

const FILLERS_LIST = ["um", "uh", "like", "you know", "basically", "actually", "ah", "sort of", "well"];

function formatMessageText(text) {
  if (!text) return "";
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const isListItem = line.trim().startsWith("- ") || line.trim().startsWith("* ") || /^\d+\.\s/.test(line.trim());
    let cleanLine = line;
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      cleanLine = line.replace(/^[\s]*[-*]\s/, "");
    }
    const parts = cleanLine.split(/\*\*([\s\S]*?)\*\*/g);
    const content = parts.map((part, idx) => {
      if (idx % 2 === 1) {
        return <strong key={idx}>{part}</strong>;
      }
      return part;
    });
    if (isListItem) {
      return (
        <li key={lineIdx} style={{ marginLeft: "20px", marginBottom: "4px" }}>
          {content}
        </li>
      );
    }
    return (
      <p key={lineIdx} style={{ margin: "0 0 8px 0" }}>
        {content}
      </p>
    );
  });
}

export default function AITutorPage({ initialWord, onClearInitialWord, learnedWords = [], todayWords = [] }) {
  const [activeMode, setActiveMode] = useState(initialWord ? "chat" : "ielts");
  
  // Find word ID if initialWord context exists
  const allWords = [...(learnedWords || []), ...(todayWords || [])];
  const matchingWord = allWords.find(w => w.word.toLowerCase() === (typeof initialWord === "string" ? initialWord.toLowerCase() : ""));
  const wordId = matchingWord ? matchingWord.id : null;

  // Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your AI Vocabulary Tutor. Select or ask me anything about the words you are learning!"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);

  // IELTS State
  const [ieltsStep, setIeltsStep] = useState(0); // 0: Start, 1: Speaking, 2: Report
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [answers, setAnswers] = useState([]);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [ieltsReport, setIeltsReport] = useState(null);

  const recognitionRef = useRef(null);

  // Initialize Word-Specific Prompt
  useEffect(() => {
    if (initialWord) {
      setActiveMode("chat");
      setChatMessages([
        {
          sender: "ai",
          text: `I see you want to learn more about "${initialWord}". How can I help you master it?`
        }
      ]);
    }
  }, [initialWord]);

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
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
        setSpeechTranscript(finalTranscript || interimTranscript);
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
  }, []);

  const handleSpeakText = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Chat Actions
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    const userMsg = chatInput.trim();
    if (!userMsg) return;

    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setAiTyping(true);

    fetch("http://localhost:8000/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
      },
      body: JSON.stringify({ message: userMsg, wordId: wordId })
    })
    .then(res => res.json())
    .then(data => {
      setAiTyping(false);
      if (data.response) {
        setChatMessages((prev) => [...prev, { sender: "ai", text: data.response }]);
      } else {
        setChatMessages((prev) => [...prev, { sender: "ai", text: "I'm sorry, I couldn't process your request." }]);
      }
    })
    .catch(err => {
      setAiTyping(false);
      console.error(err);
      setChatMessages((prev) => [...prev, { sender: "ai", text: "Connection error. Please try again." }]);
    });
  };

  const handleSuggestionClick = (promptText) => {
    setChatInput(promptText);
    setChatMessages((prev) => [...prev, { sender: "user", text: promptText }]);
    setAiTyping(true);

    fetch("http://localhost:8000/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
      },
      body: JSON.stringify({ message: promptText, wordId: wordId })
    })
    .then(res => res.json())
    .then(data => {
      setAiTyping(false);
      if (data.response) {
        setChatMessages((prev) => [...prev, { sender: "ai", text: data.response }]);
      }
    })
    .catch(err => {
      setAiTyping(false);
      console.error(err);
    });
  };



  // IELTS Actions
  const startIeltsTest = () => {
    setIeltsStep(1);
    setCurrentQuestionIdx(0);
    setAnswers([]);
    setSpeechTranscript("");
    setCurrentFeedback(null);
    
    // Speak first question
    setTimeout(() => {
      handleSpeakText(IELTS_QUESTIONS[0]);
    }, 500);
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setSpeechTranscript("");
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    } else {
      // Fallback for browsers without speech recognition
      const mockSpeak = prompt("Speech recognition is not supported or active. Please enter your speech text below to simulate speaking:", "Well, let me tell you about myself. Actually, I live in a beautiful city, and uh, I like listening to music in my free time.");
      if (mockSpeak) {
        setSpeechTranscript(mockSpeak);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSubmitAnswer = () => {
    stopListening();
    const currentAnswer = speechTranscript.trim();
    if (!currentAnswer) return;

    setEvaluating(true);
    const question = IELTS_QUESTIONS[currentQuestionIdx];

    fetch("http://localhost:8000/api/ai/ielts-evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
      },
      body: JSON.stringify({ question, answer: currentAnswer })
    })
    .then(res => res.json())
    .then(data => {
      setEvaluating(false);
      let evalResult = { feedback: "Good effort!", professionalWords: [], bandScore: 6.0 };
      
      if (data.evaluation) {
        try {
          evalResult = JSON.parse(data.evaluation);
        } catch (e) {
          try {
            const match = data.evaluation.match(/\{[\s\S]*\}/);
            if (match) evalResult = JSON.parse(match[0]);
          } catch (e2) {
            evalResult = { feedback: data.evaluation, professionalWords: [], bandScore: 6.5 };
          }
        }
      }

      setCurrentFeedback(evalResult);
      if (evalResult.professionalWords && evalResult.professionalWords.length > 0) {
        evalResult.professionalWords.forEach(pWord => {
          fetch("http://localhost:8000/api/words/recommend", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
            },
            body: JSON.stringify({ word: pWord })
          }).catch(err => console.error("Error auto-recommending word from IELTS:", err));
        });
      }
    })
    .catch(err => {
      setEvaluating(false);
      console.error(err);
      setCurrentFeedback({ feedback: "Evaluation service temporarily unavailable.", professionalWords: [], bandScore: 6.0 });
    });
  };

  const handleNextIeltsQuestion = () => {
    // Add answer + feedback to the answers list
    const updatedAnswers = [
      ...answers,
      {
        question: IELTS_QUESTIONS[currentQuestionIdx],
        answer: speechTranscript.trim() || "(No speech detected)",
        evaluation: currentFeedback
      }
    ];
    setAnswers(updatedAnswers);
    setSpeechTranscript("");
    setCurrentFeedback(null);

    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < IELTS_QUESTIONS.length) {
      setCurrentQuestionIdx(nextIdx);
      setTimeout(() => {
        handleSpeakText(IELTS_QUESTIONS[nextIdx]);
      }, 500);
    } else {
      // Calculate overall score report
      let totalBand = 0;
      let totalFillers = 0;
      let totalWordsCount = 0;

      updatedAnswers.forEach((ans) => {
        // Calculate fillers
        const words = ans.answer.toLowerCase().split(/\s+/).filter(Boolean);
        totalWordsCount += words.length;
        words.forEach((w) => {
          const cleanW = w.replace(/[^a-zA-Z0-9]/g, "");
          if (FILLERS_LIST.includes(cleanW)) {
            totalFillers++;
          }
        });

        // Add band score
        totalBand += Number(ans.evaluation?.bandScore || 6.0);
      });

      const avgBand = totalBand / IELTS_QUESTIONS.length;
      
      // Calculate sub-scores dynamically for display
      const fluency = Math.min(9.0, Math.max(4.0, avgBand + (totalWordsCount > 50 ? 0.5 : -0.5) - (totalFillers > 5 ? 0.5 : 0)));
      const grammar = Math.min(9.0, Math.max(4.0, avgBand + (totalWordsCount > 70 ? 0.5 : -0.5)));
      const articulation = avgBand;

      setIeltsReport({
        band: avgBand.toFixed(1),
        fluency: fluency.toFixed(1),
        grammar: grammar.toFixed(1),
        articulation: articulation.toFixed(1),
        fillersCount: totalFillers,
        wordsCount: totalWordsCount,
        feedback: generateFeedbackMessage(avgBand, totalFillers)
      });
      setIeltsStep(2);
    }
  };

  const generateFeedbackMessage = (band, fillers) => {
    if (band >= 8.0) {
      return `Outstanding! You demonstrate near-native fluency and grammatical articulation. Very few fillers (${fillers}) detected. Keep practicing vocabulary to consolidate this excellent band score.`;
    } else if (band >= 6.5) {
      return `Good job! Your vocabulary and structural range are suitable for communication. However, you used ${fillers} filler words. Reducing hesitations and linking sentences more smoothly will push you into the 8.0+ band.`;
    } else {
      return `Nice try! To score higher, attempt to speak in longer sentences, minimize pauses, and restrict repetitive filler words (like "um", "uh", or "like"). Practice daily with Dict-o-Day flashcards!`;
    }
  };

  return (
    <div className="ai-tutor-container animate-fade-in">
      <header className="ai-tutor-header">
        <h1 className="ai-tutor-title">AI Speaking & Prep Tutor</h1>
        <div className="tutor-mode-tabs">
          <button
            className={`tutor-tab-btn ${activeMode === "ielts" ? "active" : ""}`}
            onClick={() => {
              setActiveMode("ielts");
              setIeltsStep(0);
            }}
          >
            IELTS Voice Test
          </button>
          <button
            className={`tutor-tab-btn ${activeMode === "chat" ? "active" : ""}`}
            onClick={() => setActiveMode("chat")}
          >
            Vocabulary Explainer
          </button>
        </div>
      </header>

      {/* CHAT MODE */}
      {activeMode === "chat" && (
        <div className="chat-interface-card">
          {initialWord && (
            <div className="word-learning-banner">
              <span>Focusing on active word: <strong>{initialWord}</strong></span>
              <button className="clear-focus-btn" onClick={() => {
                onClearInitialWord();
                setChatMessages(prev => [
                  ...prev,
                  { sender: "ai", text: "Focus cleared. Feel free to ask me anything about English vocabulary!" }
                ]);
              }} title="Clear focus to chat generally">
                ✕ Clear Focus
              </button>
            </div>
          )}
          <div className="chat-messages-container">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-message-bubble ${msg.sender}`}>
                <div className="chat-avatar">{msg.sender === "ai" ? "🤖" : "U"}</div>
                <div className="chat-bubble-text">{formatMessageText(msg.text)}</div>
              </div>
            ))}
            {aiTyping && (
              <div className="chat-message-bubble ai">
                <div className="chat-avatar">🤖</div>
                <div className="chat-bubble-text typing-indicator">
                  <span>•</span><span>•</span><span>•</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div className="suggestions-row">
            {wordId && (
              <>
                <button className="suggestion-chip" onClick={() => handleSuggestionClick("Give me a mnemonic to remember this word.")}>
                  💡 Mnemonic
                </button>
                <button className="suggestion-chip" onClick={() => handleSuggestionClick("List key synonyms and how to use them.")}>
                  📚 Synonyms
                </button>
                <button className="suggestion-chip" onClick={() => handleSuggestionClick("Use this word in 2 complex sentences.")}>
                  📝 Practice sentences
                </button>
              </>
            )}
          </div>

          <form className="chat-input-bar" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Ask me definitions, mnemonics, or syntax tips..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="chat-field-input"
            />
            <button type="submit" className="chat-send-btn">
              ➔
            </button>
          </form>
        </div>
      )}

      {/* IELTS MODE */}
      {activeMode === "ielts" && (
        <div className="ielts-interface-card">
          {/* STEP 0: START SCREEN */}
          {ieltsStep === 0 && (
            <div className="ielts-start-screen">
              <span className="ielts-banner-icon">🎙️</span>
              <h2>IELTS Voice Assessment</h2>
              <p>
                Evaluate your spoken English. Our AI tutor will speak 5 basic conversational questions, record your audio speech, and evaluate your performance in fillers, grammar, and articulation.
              </p>
              <div className="ielts-rubrics-info">
                <h4>What we evaluate:</h4>
                <ul>
                  <li><strong>Interactive Feedback:</strong> Review evaluation and advanced professional synonyms right after each response!</li>
                  <li><strong>Fillers:</strong> Tracking usage of "uh", "um", "like", etc.</li>
                  <li><strong>Fluency:</strong> Speaking rate and sentence continuity.</li>
                </ul>
              </div>
              <button className="ielts-start-btn" onClick={startIeltsTest}>
                Start Voice Exam
              </button>
            </div>
          )}

          {/* STEP 1: SPEAKING TEST SCREEN */}
          {ieltsStep === 1 && (
            <div className="ielts-exam-screen">
              <div className="exam-progress-header">
                <span>Question {currentQuestionIdx + 1} of 5</span>
                <div className="exam-progress-bar">
                  <div
                    className="exam-progress-fill"
                    style={{ width: `${((currentQuestionIdx + 1) / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="exam-question-card">
                <button
                  className="replay-question-btn"
                  onClick={() => handleSpeakText(IELTS_QUESTIONS[currentQuestionIdx])}
                  title="Repeat Question"
                >
                  🔊 Repeat Question
                </button>
                <h3 className="exam-question-text">"{IELTS_QUESTIONS[currentQuestionIdx]}"</h3>
              </div>

              <div className="voice-recorder-area">
                {isListening ? (
                  <div className="voice-wave-container animate-pulse">
                    <span className="wave-bar bar-1"></span>
                    <span className="wave-bar bar-2"></span>
                    <span className="wave-bar bar-3"></span>
                    <span className="wave-bar bar-4"></span>
                    <span className="wave-bar bar-5"></span>
                  </div>
                ) : (
                  <div className="voice-wave-container idle">
                    <span className="wave-circle">🎙️</span>
                  </div>
                )}

                <div className="recorder-buttons">
                  {!isListening ? (
                    <button className="record-toggle-btn start-rec" onClick={startListening} disabled={evaluating || currentFeedback}>
                      🎙️ Start Speaking
                    </button>
                  ) : (
                    <button className="record-toggle-btn stop-rec" onClick={stopListening}>
                      ⏹️ Pause Mic
                    </button>
                  )}
                </div>

                <div className="transcript-box">
                  <label>Speech Response</label>
                  {currentFeedback ? (
                    <p className="transcript-text" style={{ fontStyle: "normal" }}>
                      {speechTranscript}
                    </p>
                  ) : (
                    <textarea
                      className="fitb-text-field"
                      style={{ maxWidth: "100%", fontStyle: "italic", background: "transparent", border: "none", resize: "none" }}
                      rows={3}
                      placeholder="Click 'Start Speaking' and state your answer aloud (or type here directly)..."
                      value={speechTranscript}
                      onChange={(e) => setSpeechTranscript(e.target.value)}
                    />
                  )}
                </div>

                {!currentFeedback && speechTranscript.trim() && (
                  <button className="ielts-start-btn" onClick={handleSubmitAnswer} disabled={evaluating}>
                    {evaluating ? "Evaluating..." : "Submit Answer & Get Feedback"}
                  </button>
                )}

                {/* Interactive Feedback block */}
                {currentFeedback && (
                  <div className="ielts-feedback-box animate-fade-in">
                    <div className="ielts-feedback-score-row">
                      <span className="ielts-feedback-badge">IELTS Band: {currentFeedback.bandScore || "6.0"}</span>
                    </div>
                    <p className="ielts-feedback-text">
                      <strong>AI Evaluator:</strong> {currentFeedback.feedback}
                    </p>
                    {currentFeedback.professionalWords && currentFeedback.professionalWords.length > 0 && (
                      <div className="ielts-professional-words">
                        <span className="ielts-professional-label">Professional alternatives to use:</span>
                        <div className="ielts-professional-chips">
                          {currentFeedback.professionalWords.map((word, idx) => (
                            <span key={idx} className="ielts-professional-chip">{word}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {currentFeedback && (
                <button className="exam-next-btn" onClick={handleNextIeltsQuestion}>
                  {currentQuestionIdx < 4 ? "Next Question ➔" : "Finish Test & Score"}
                </button>
              )}
            </div>
          )}

          {/* STEP 2: SCORE REPORT SCREEN */}
          {ieltsStep === 2 && ieltsReport && (
            <div className="ielts-report-screen">
              <header className="report-header">
                <span className="report-badge">Report Card</span>
                <h2>IELTS Assessment Results</h2>
              </header>

              <div className="report-scores-summary">
                <div className="band-score-circle">
                  <span className="band-label">Band</span>
                  <span className="band-value">{ieltsReport.band}</span>
                  <span className="band-total">/ 9.0</span>
                </div>

                <div className="sectional-scores-list">
                  <div className="sectional-score-item">
                    <span>Fluency</span>
                    <div className="score-track-bg">
                      <div className="score-track-fill" style={{ width: `${(ieltsReport.fluency / 9) * 100}%` }} />
                    </div>
                    <span className="score-val">{ieltsReport.fluency}</span>
                  </div>

                  <div className="sectional-score-item">
                    <span>Grammar</span>
                    <div className="score-track-bg">
                      <div className="score-track-fill" style={{ width: `${(ieltsReport.grammar / 9) * 100}%` }} />
                    </div>
                    <span className="score-val">{ieltsReport.grammar}</span>
                  </div>

                  <div className="sectional-score-item">
                    <span>Articulation</span>
                    <div className="score-track-bg">
                      <div className="score-track-fill" style={{ width: `${(ieltsReport.articulation / 9) * 100}%` }} />
                    </div>
                    <span className="score-val">{ieltsReport.articulation}</span>
                  </div>
                </div>
              </div>

              <div className="report-detailed-stats">
                <div className="report-stat-pill">
                  <span className="stat-pill-label">Filler Words</span>
                  <span className="stat-pill-value">{ieltsReport.fillersCount}</span>
                </div>
                <div className="report-stat-pill">
                  <span className="stat-pill-label">Total Words Spoken</span>
                  <span className="stat-pill-value">{ieltsReport.wordsCount}</span>
                </div>
              </div>

              <div className="report-feedback-card">
                <h3>Evaluator Feedback</h3>
                <p className="feedback-text">{ieltsReport.feedback}</p>
              </div>

              <button className="ielts-retry-btn" onClick={() => setIeltsStep(0)}>
                Take Test Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
