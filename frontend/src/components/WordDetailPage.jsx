import React from "react";
import "./WordDetailPage.css";

export default function WordDetailPage({ wordData, onBack, onNavigateToAI }) {
  if (!wordData) return null;

  const handleSpeak = (e) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(wordData.word);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="word-detail-container">
      {/* Back Button */}
      <button className="back-to-nav-btn" onClick={onBack}>
        ← Back
      </button>

      {/* Floating AI Corner Circle Button */}
      <button
        className="corner-ai-btn"
        onClick={() => onNavigateToAI(wordData.word)}
        title={`Ask AI tutor about "${wordData.word}"`}
      >
        💬
      </button>

      <div className="word-detail-card animate-fade-in">
        <header className="word-detail-header">
          <div className="header-top-row">
            <span className="pos-badge">{wordData.pos}</span>
            <button className="audio-speak-btn" onClick={handleSpeak} title="Listen to pronunciation">
              🔊
            </button>
          </div>
          <h1 className="word-detail-title">{wordData.word}</h1>
          <p className="word-detail-pron">/{wordData.pronunciation}/</p>
        </header>

        <section className="word-detail-section definition-sec">
          <h3>Meaning</h3>
          <p className="detail-meaning">{wordData.definition}</p>
        </section>

        <div className="thesaurus-row">
          <section className="word-detail-section thesaurus-box">
            <h3>Synonyms</h3>
            <div className="syn-ant-list">
              {(() => {
                const syns = !wordData.synonyms || typeof wordData.synonyms !== "string" || wordData.synonyms === "N/A"
                  ? ["N/A"]
                  : wordData.synonyms.split(",").map(s => s.trim()).filter(Boolean);
                return syns.map((s, idx) => (
                  <span key={idx} className={`thesaurus-pill synonym ${s === "N/A" ? "empty" : ""}`}>
                    {s}
                  </span>
                ));
              })()}
            </div>
          </section>

          <section className="word-detail-section thesaurus-box">
            <h3>Antonyms</h3>
            <div className="syn-ant-list">
              {(() => {
                const ants = !wordData.antonyms || typeof wordData.antonyms !== "string" || wordData.antonyms === "N/A"
                  ? ["N/A"]
                  : wordData.antonyms.split(",").map(a => a.trim()).filter(Boolean);
                return ants.map((a, idx) => (
                  <span key={idx} className={`thesaurus-pill antonym ${a === "N/A" ? "empty" : ""}`}>
                    {a}
                  </span>
                ));
              })()}
            </div>
          </section>
        </div>

        {wordData.fusedWord && (
          <section className="word-detail-section fused-detail-sec">
            <div className="fused-detail-header-badge">⭐ Linked IELTS Vocabulary</div>
            <div className="fused-detail-card-inner">
              <div className="fused-detail-title-row">
                <h2 className="fused-detail-word">{wordData.fusedWord}</h2>
                <span className="fused-detail-pron">/{wordData.fusedPronunciation}/</span>
              </div>
              <p className="fused-detail-def">
                <strong>Meaning:</strong> {wordData.fusedDefinition}
              </p>
              {wordData.fusedSentence && (
                <p className="fused-detail-sentence">
                  <strong>Example:</strong> "{wordData.fusedSentence}"
                </p>
              )}
            </div>
          </section>
        )}

        <section className="word-detail-section sentences-sec">
          <h3>Example Sentences</h3>
          <ol className="sentences-list">
            {wordData.sentences.map((sentence, idx) => (
              <li key={idx} className="sentence-item">
                "{sentence}"
              </li>
            ))}
          </ol>
        </section>

        <section className="word-detail-section mastery-sec">
          <div className="mastery-info-row">
            <h3>Learning Progress</h3>
            <span className="mastery-value">{wordData.mastery}% Mastered</span>
          </div>
          <div className="mastery-progress-track">
            <div
              className="mastery-progress-fill"
              style={{
                width: `${wordData.mastery}%`,
                backgroundColor:
                  wordData.mastery >= 75
                    ? "var(--green)"
                    : wordData.mastery >= 45
                    ? "var(--amber)"
                    : "var(--red)",
              }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
