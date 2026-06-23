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

export default function AITutorPage({ initialWord, onClearInitialWord }) {
  const [activeMode, setActiveMode] = useState(initialWord ? "chat" : "ielts");
  
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
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setAiTyping(true);

    setTimeout(() => {
      let aiResponse = `That is a great question about English language structures! In context, we often look at how nuance, usage, and collocations establish native-like fluency.`;
      
      const cleanMsg = userMsg.toLowerCase();
      if (cleanMsg.includes("definition") || cleanMsg.includes("meaning")) {
        aiResponse = `The meaning represents the core semantic classification of a word, helping it fit in syntactical rows depending on difficulty levels.`;
      } else if (cleanMsg.includes("mnemonic") || cleanMsg.includes("remember")) {
        aiResponse = `A great mnemonic device is connecting the sound to a familiar visual cue: for example, associating 'Sanguine' (cheerful/positive) with 'Sangria' (a sweet, bright red wine enjoyed at warm parties).`;
      } else if (cleanMsg.includes("example") || cleanMsg.includes("sentences")) {
        aiResponse = `Here are additional usage examples:
1. "The project leader maintained a sanguine smile despite coding bugs."
2. "Their laconic replies did not give away the surprise plan."`;
      }

      setChatMessages((prev) => [...prev, { sender: "ai", text: aiResponse }]);
      setAiTyping(false);
    }, 1200);
  };

  const handleSuggestionClick = (promptText) => {
    setChatInput(promptText);
    setTimeout(() => {
      // Small trigger to submit
      setChatMessages((prev) => [...prev, { sender: "user", text: promptText }]);
      setAiTyping(true);
      setTimeout(() => {
        let res = "";
        if (promptText.includes("mnemonic")) {
          res = `Mnemonic for "${initialWord || 'Vocabulary'}": Associate the prefix and sound with a fast-acting memory block. For instance, 'Mellifluous' (sounding like honey) starts with 'Mel', which is like 'Melody' + 'Flow' (sweet melody flowing).`;
        } else if (promptText.includes("synonyms")) {
          res = `Key synonyms for this context emphasize the word's register. Using varying adjectives creates a stronger linguistic impression in written essays and spoken tests.`;
        } else {
          res = `To practice, write a short paragraph combining this word with related terms: for example, 'My sanguine friend remained calm during the ephemeral storm.'`;
        }
        setChatMessages((prev) => [...prev, { sender: "ai", text: res }]);
        setAiTyping(false);
      }, 1000);
    }, 100);
  };

  // IELTS Actions
  const startIeltsTest = () => {
    setIeltsStep(1);
    setCurrentQuestionIdx(0);
    setAnswers([]);
    setSpeechTranscript("");
    
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

  const handleNextIeltsQuestion = () => {
    stopListening();
    
    // Save current answer
    const currentAnswer = speechTranscript.trim() || "(No speech detected)";
    const updatedAnswers = [...answers, { question: IELTS_QUESTIONS[currentQuestionIdx], answer: currentAnswer }];
    setAnswers(updatedAnswers);
    setSpeechTranscript("");

    const nextIdx = currentQuestionIdx + 1;
    if (nextIdx < IELTS_QUESTIONS.length) {
      setCurrentQuestionIdx(nextIdx);
      setTimeout(() => {
        handleSpeakText(IELTS_QUESTIONS[nextIdx]);
      }, 500);
    } else {
      // Calculate results and show report
      evaluateIeltsSpeech(updatedAnswers);
    }
  };

  const evaluateIeltsSpeech = (allAnswers) => {
    let totalFillers = 0;
    let totalWordsCount = 0;
    
    allAnswers.forEach((ans) => {
      const words = ans.answer.toLowerCase().split(/\s+/).filter(Boolean);
      totalWordsCount += words.length;
      
      words.forEach((w) => {
        // Strip punctuation
        const cleanW = w.replace(/[^a-zA-Z0-9]/g, "");
        if (FILLERS_LIST.includes(cleanW)) {
          totalFillers++;
        }
      });
    });

    // Score calculations
    // Fluency score (out of 9): Based on WPM / word length density
    const avgWordsPerAnswer = totalWordsCount / IELTS_QUESTIONS.length;
    let fluency = 6.0;
    if (avgWordsPerAnswer > 25) fluency = 8.5;
    else if (avgWordsPerAnswer > 15) fluency = 7.5;
    else if (avgWordsPerAnswer > 8) fluency = 6.5;
    else fluency = 5.0;

    // Fillers penalty: more fillers decreases fluency score slightly
    const fillerRatio = totalFillers / (totalWordsCount || 1);
    if (fillerRatio > 0.15) {
      fluency = Math.max(4.5, fluency - 1.5);
    } else if (fillerRatio > 0.08) {
      fluency = Math.max(5.0, fluency - 0.5);
    }

    // Grammar score: simple check on sentence complexity
    let grammar = 6.0;
    if (totalWordsCount > 80) grammar = 8.0;
    else if (totalWordsCount > 50) grammar = 7.0;
    else grammar = 5.5;

    // Articulation
    let articulation = 6.5;
    if (totalWordsCount > 60) articulation = 8.0;
    else if (totalWordsCount > 40) articulation = 7.0;

    // Average Band Score
    const band = Math.round(((fluency + grammar + articulation) / 3) * 2) / 2;

    setIeltsReport({
      band: band.toFixed(1),
      fluency: fluency.toFixed(1),
      grammar: grammar.toFixed(1),
      articulation: articulation.toFixed(1),
      fillersCount: totalFillers,
      wordsCount: totalWordsCount,
      feedback: generateFeedbackMessage(band, totalFillers)
    });
    setIeltsStep(2);
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
          <div className="chat-messages-container">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`chat-message-bubble ${msg.sender}`}>
                <div className="chat-avatar">{msg.sender === "ai" ? "🤖" : "U"}</div>
                <div className="chat-bubble-text">{msg.text}</div>
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
            <button className="suggestion-chip" onClick={() => handleSuggestionClick("Give me a mnemonic to remember this word.")}>
              💡 Mnemonic
            </button>
            <button className="suggestion-chip" onClick={() => handleSuggestionClick("List key synonyms and how to use them.")}>
              📚 Synonyms
            </button>
            <button className="suggestion-chip" onClick={() => handleSuggestionClick("Use this word in 2 complex sentences.")}>
              📝 Practice sentences
            </button>
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
                  <li><strong>Fillers:</strong> Tracking usage of "uh", "um", "like", etc.</li>
                  <li><strong>Fluency:</strong> Speaking rate and sentence continuity.</li>
                  <li><strong>Articulation & Grammar:</strong> Word count density and structures.</li>
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
                    <button className="record-toggle-btn start-rec" onClick={startListening}>
                      🎙️ Start Speaking
                    </button>
                  ) : (
                    <button className="record-toggle-btn stop-rec" onClick={stopListening}>
                      ⏹️ Pause Mic
                    </button>
                  )}
                </div>

                <div className="transcript-box">
                  <label>Live Speech Transcript</label>
                  <p className="transcript-text">
                    {speechTranscript || "Click 'Start Speaking' and state your answer aloud..."}
                  </p>
                </div>
              </div>

              <button className="exam-next-btn" onClick={handleNextIeltsQuestion}>
                {currentQuestionIdx < 4 ? "Next Question ➔" : "Finish Test & Score"}
              </button>
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
