import React, { useState } from "react";
import "./ExplorePage.css";
import { API_BASE_URL } from "../config";

export default function ExplorePage({ onAddWordSuccess, onBack }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [wordData, setWordData] = useState(null);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const performSearch = (wordToSearch) => {
    if (!wordToSearch.trim()) return;

    setSearching(true);
    setError(null);
    setWordData(null);
    setAdded(false);

    const token = localStorage.getItem("accessToken");
    fetch(`${API_BASE_URL}/api/words/preview?word=${encodeURIComponent(wordToSearch.trim())}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setSearching(false);
        if (data.data) {
          setWordData(data.data);
        } else {
          setError("Failed to fetch details for this word. Please check your connection and try again.");
        }
      })
      .catch(err => {
        setSearching(false);
        console.error(err);
        setError("An error occurred while generating details. Please try again.");
      });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleSuggestionClick = (word) => {
    setQuery(word);
    performSearch(word);
  };

  const handleFetchSuggestions = () => {
    setLoadingSuggestions(true);
    setError(null);
    const token = localStorage.getItem("accessToken");
    fetch(`${API_BASE_URL}/api/ai/suggest-words`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setLoadingSuggestions(false);
        if (data.words) {
          setSuggestions(data.words);
        } else {
          setError("Failed to fetch suggestions.");
        }
      })
      .catch(err => {
        setLoadingSuggestions(false);
        console.error(err);
        setError("Error loading suggestions.");
      });
  };

  const handleAddWord = () => {
    if (!wordData) return;
    const token = localStorage.getItem("accessToken");

    fetch(`${API_BASE_URL}/api/words/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ word: wordData.word })
    })
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setAdded(true);
          if (onAddWordSuccess) {
            onAddWordSuccess();
          }
        } else {
          setError(data.message || "Failed to add word. You may have exceeded your limit.");
        }
      })
      .catch(err => {
        console.error(err);
        setError("Failed to add word to learning queue.");
      });
  };

  // Helper to determine styling
  const getPreviewCardStyle = (data) => {
    if (data.fusedWord) {
      return {
        background: "linear-gradient(135deg, #db2777 0%, #ea580c 100%)",
        border: "3px solid #fbbf24",
        boxShadow: "0 12px 40px rgba(219, 39, 119, 0.4)",
        color: "#ffffff"
      };
    }
    // Dynamic clean gradient
    let hash = 0;
    const wordStr = data.word || "";
    for (let i = 0; i < wordStr.length; i++) {
      hash = wordStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return {
      background: `linear-gradient(135deg, hsl(${hue}, 70%, 20%) 0%, hsl(${(hue + 45) % 360}, 60%, 15%) 100%)`,
      border: "1px solid rgba(255,255,255,0.15)",
      boxShadow: `0 12px 40px hsla(${hue}, 70%, 15%, 0.3)`,
      color: "#f3f4f6"
    };
  };

  return (
    <div className="explore-container">
      <div className="explore-header">
        <h1 className="explore-title">Explore Vocabulary</h1>
        <p className="explore-subtitle">
          Search any word. If it's a simple word, we will create a <strong>Fused Learning Card</strong> to teach a related IELTS term alongside it.
        </p>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter a word (e.g., Apple, Ebullient, Resilient...)"
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={searching}
        />
        <button type="submit" className="search-btn" disabled={searching}>
          {searching ? "Analyzing..." : "Search & Define"}
        </button>
      </form>

      {/* AI Suggestion Section */}
      {!wordData && !searching && (
        <div className="ai-suggestions-explore" style={{ marginTop: "24px", textAlign: "center" }}>
          <p style={{ color: "var(--text-3)", fontSize: "14px", marginBottom: "12px" }}>
            💡 Need inspiration? Get IELTS Vocabulary Suggestions based on your level:
          </p>
          {loadingSuggestions ? (
            <div className="explore-loader" style={{ marginTop: "8px" }}>
              <div className="spinner" style={{ width: "24px", height: "24px", margin: "0 auto" }}></div>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>Consulting AI tutor for suggestions...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
              {suggestions.map((w, idx) => (
                <button
                  key={idx}
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(w)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    color: "#1f2937",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = "var(--amber)";
                    e.target.style.background = "#f3f4f6";
                    e.target.style.color = "#000000";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.background = "#ffffff";
                    e.target.style.color = "#1f2937";
                  }}
                >
                  ✨ {w}
                </button>
              ))}
              <button
                onClick={handleFetchSuggestions}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "700",
                  marginLeft: "8px",
                  textDecoration: "underline"
                }}
              >
                Refresh
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="action-btn secondary"
              onClick={handleFetchSuggestions}
              style={{
                background: "linear-gradient(135deg, var(--amber-light) 0%, #fef3c7 100%)",
                color: "#000000",
                border: "1px solid var(--amber)",
                padding: "10px 20px",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "13px",
                boxShadow: "0 4px 12px rgba(239, 159, 39, 0.15)"
              }}
            >
              ✨ Get AI Suggestions
            </button>
          )}
        </div>
      )}

      {searching && (
        <div className="explore-loader">
          <div className="spinner"></div>
          <p>Consulting our AI lexicographer to fetch definitions, examples, synonyms, and connections...</p>
        </div>
      )}

      {error && <div className="explore-error">{error}</div>}

      {wordData && (
        <div className="preview-section">
          <div className="preview-label">PREVIEW CARD</div>

          <div className="preview-card" style={getPreviewCardStyle(wordData)}>
            {wordData.fusedWord && (
              <div className="fused-badge">⭐ FUSED LEARNING CARD</div>
            )}

            <div className="card-top-pos">
              <span className="preview-pos-tag">{wordData.partOfSpeech}</span>
            </div>

            <div className="preview-main-word">
              <h2>{wordData.word}</h2>
              <p className="preview-phonetic">/{wordData.pronunciation}/</p>
            </div>

            <div className="preview-content-box">
              <p className="preview-def">
                <strong>Definition:</strong> {wordData.definition}
              </p>

              {wordData.inASentence && (
                <p className="preview-sentence">
                  <strong>Example:</strong> "{wordData.inASentence}"
                </p>
              )}

              {wordData.synonyms && wordData.synonyms !== "N/A" && (
                <p className="preview-syns">
                  <strong>Synonyms:</strong> {wordData.synonyms}
                </p>
              )}

              {wordData.antonyms && wordData.antonyms !== "N/A" && (
                <p className="preview-ants">
                  <strong>Antonyms:</strong> {wordData.antonyms}
                </p>
              )}
            </div>

            {wordData.fusedWord && (
              <div className="preview-fused-box">
                <div className="fused-title-header">
                  <h3>Advanced IELTS Vocab Link: {wordData.fusedWord}</h3>
                  <span className="fused-pron">/{wordData.fusedPronunciation}/</span>
                </div>
                <p className="fused-def">
                  <strong>Definition:</strong> {wordData.fusedDefinition}
                </p>
                <p className="fused-sentence">
                  <strong>Example:</strong> "{wordData.fusedSentence}"
                </p>
              </div>
            )}

            <div className="preview-actions">
              {added ? (
                <div className="added-success-msg">
                  ✓ Word added to today's learning list!
                </div>
              ) : (
                <button className="add-to-deck-btn" onClick={handleAddWord}>
                  Add to Today's Learning Deck
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
