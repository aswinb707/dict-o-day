import React, { useState } from "react";
import "./LearnPage.css";

export default function LearnPage({ wordsPool = [], onMarkLearned, onWordSelect }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const activeWord = wordsPool[currentIdx];

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

  const handleMarkAsLearned = (e) => {
    e.stopPropagation();
    onMarkLearned(activeWord.id);
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
            <div className="study-face front">
              <div className="study-card-top">
                <span className="study-pos-tag">{activeWord.pos}</span>
                <span className="study-flip-hint">tap to flip</span>
              </div>
              <h2 className="study-word-title">{activeWord.word}</h2>
              <div className="study-audio-row">
                <span className="study-word-pron">/{activeWord.pronunciation}/</span>
                <button className="study-audio-btn" onClick={handleSpeak} title="Pronounce word">
                  🔊
                </button>
              </div>

              <div className="study-mastery-sec">
                <div className="study-mastery-lbl-row">
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
            <div className="study-face back">
              <div className="study-card-top">
                <span className="study-pos-tag">{activeWord.pos}</span>
                <span className="study-flip-hint">tap to flip</span>
              </div>
              <h3 className="study-back-title">{activeWord.word}</h3>
              <div className="study-definition-block">
                <span className="section-label">Definition</span>
                <p className="study-def-text">{activeWord.definition}</p>
              </div>
              <div className="study-sentence-block">
                <span className="section-label">Context Sentence</span>
                <p className="study-sentence-text">"{activeWord.sentences[0]}"</p>
              </div>
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
          <button className="mark-learned-btn" onClick={handleMarkAsLearned}>
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
