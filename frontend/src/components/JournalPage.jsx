import React, { useState, useMemo } from "react";
import "./JournalPage.css";

export default function JournalPage({ learnedWords, onWordSelect, onAddCustomWord }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState({
    word: "",
    pos: "Noun",
    definition: "",
    pronunciation: "",
    synonyms: "",
    antonyms: "",
    sentence1: "",
    sentence2: "",
    sentence3: "",
  });
  const [formError, setFormError] = useState("");

  const sortedAndFilteredWords = useMemo(() => {
    return [...learnedWords]
      .filter((w) => w.word.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.word.localeCompare(b.word));
  }, [learnedWords, searchTerm]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newWord.word.trim() || !newWord.definition.trim() || !newWord.pronunciation.trim()) {
      setFormError("Word, pronunciation, and meaning are required.");
      return;
    }

    const sentences = [
      newWord.sentence1.trim() || `The word ${newWord.word} is very interesting.`,
      newWord.sentence2.trim() || `We practice using ${newWord.word} today.`,
      newWord.sentence3.trim() || `Expanding vocabulary helps us express ${newWord.word} easily.`,
    ];

    const addedWord = {
      id: Date.now(),
      word: newWord.word.trim(),
      pos: newWord.pos,
      definition: newWord.definition.trim(),
      pronunciation: newWord.pronunciation.trim(),
      synonyms: newWord.synonyms.trim() || "N/A",
      antonyms: newWord.antonyms.trim() || "N/A",
      sentences,
      mastery: 10,
      dateLearned: new Date().toISOString().split("T")[0],
    };

    onAddCustomWord(addedWord);

    // Reset Form
    setNewWord({
      word: "",
      pos: "Noun",
      definition: "",
      pronunciation: "",
      synonyms: "",
      antonyms: "",
      sentence1: "",
      sentence2: "",
      sentence3: "",
    });
    setFormError("");
    setShowAddForm(false);
  };

  return (
    
    <div className="journal-container animate-fade-in">
      <header className="journal-header">
       
        <div>
          <h1 className="journal-title">My Learning Journal</h1>
          <p className="journal-sub">Alphabetical catalog of all learned words</p>
        </div>
         <div className="journal-header-actions">
            <h1 className="journal-title">Exams:</h1>
          <a
            href="https://ielts.org/test-centres"
            target="_blank"
            rel="noopener noreferrer"
            className="booking-btn booking-btn--ielts"
          >
            📋 IELTS Booking
          </a>
          <a
            href="https://toeflibt.ets.org/welcome"
            target="_blank"
            rel="noopener noreferrer"
            className="booking-btn booking-btn--toefl"
          >
            📝 TOEFL Booking
          </a>
        </div>
        <button className="add-word-toggle-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Close Form" : "+ Add Custom Word"}
        </button>
      </header>

      {showAddForm && (
        <form className="add-word-form" onSubmit={handleAddSubmit}>
          <h3>Add Custom Word</h3>
          {formError && <p className="form-error-msg">{formError}</p>}
          <div className="form-grid">
            <div className="form-field">
              <label>Word *</label>
              <input
                type="text"
                placeholder="e.g. Serendipity"
                value={newWord.word}
                onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Part of Speech</label>
              <select value={newWord.pos} onChange={(e) => setNewWord({ ...newWord, pos: e.target.value })}>
                <option>Noun</option>
                <option>Verb</option>
                <option>Adjective</option>
                <option>Adverb</option>
                <option>Conjunction</option>
              </select>
            </div>
            <div className="form-field">
              <label>Pronunciation *</label>
              <input
                type="text"
                placeholder="e.g. seh-run-DIP-ih-tee"
                value={newWord.pronunciation}
                onChange={(e) => setNewWord({ ...newWord, pronunciation: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Definition *</label>
              <input
                type="text"
                placeholder="e.g. Finding valuable things by chance"
                value={newWord.definition}
                onChange={(e) => setNewWord({ ...newWord, definition: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Synonyms</label>
              <input
                type="text"
                placeholder="e.g. chance, fate, fluke"
                value={newWord.synonyms}
                onChange={(e) => setNewWord({ ...newWord, synonyms: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Antonyms</label>
              <input
                type="text"
                placeholder="e.g. design, plan, misfortune"
                value={newWord.antonyms}
                onChange={(e) => setNewWord({ ...newWord, antonyms: e.target.value })}
              />
            </div>
          </div>

          <div className="form-sentences-block">
            <label>Usage Examples (Up to 3)</label>
            <input
              type="text"
              placeholder="Example Sentence 1"
              value={newWord.sentence1}
              onChange={(e) => setNewWord({ ...newWord, sentence1: e.target.value })}
              className="sentence-input"
            />
            <input
              type="text"
              placeholder="Example Sentence 2"
              value={newWord.sentence2}
              onChange={(e) => setNewWord({ ...newWord, sentence2: e.target.value })}
              className="sentence-input"
            />
            <input
              type="text"
              placeholder="Example Sentence 3"
              value={newWord.sentence3}
              onChange={(e) => setNewWord({ ...newWord, sentence3: e.target.value })}
              className="sentence-input"
            />
          </div>

          <button type="submit" className="add-word-submit-btn">
            Save Word to Journal
          </button>
        </form>
      )}

      {/* Search Filter */}
      <div className="search-bar-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="journal-search-input"
          placeholder="Search journal words..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="search-clear-btn" onClick={() => setSearchTerm("")}>
            ✕
          </button>
        )}
      </div>

      {sortedAndFilteredWords.length === 0 ? (
        <div className="journal-empty-state">
          <span className="empty-icon">📓</span>
          <p>No words found in your journal matching your query.</p>
        </div>
      ) : (
        <div className="journal-grid">
          {sortedAndFilteredWords.map((wordItem) => (
            <div
              key={wordItem.id}
              className="journal-word-card"
              onClick={() => onWordSelect(wordItem)}
            >
              <div className="journal-card-top">
                <h3 className="journal-word-title">{wordItem.word}</h3>
                <span className="journal-pos-tag">{wordItem.pos}</span>
              </div>
              <p className="journal-word-pron">/{wordItem.pronunciation}/</p>
              <p className="journal-word-def">{wordItem.definition}</p>
              <div className="journal-mastery-indicator">
                <span className="mastery-lbl">Mastery: {wordItem.mastery}%</span>
                <div className="mini-track">
                  <div
                    className="mini-fill"
                    style={{
                      width: `${wordItem.mastery}%`,
                      backgroundColor:
                        wordItem.mastery >= 75
                          ? "var(--green)"
                          : wordItem.mastery >= 45
                          ? "var(--amber)"
                          : "var(--red)",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
