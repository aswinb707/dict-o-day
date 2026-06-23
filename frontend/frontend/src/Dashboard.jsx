import React, { useState } from "react";
import "./Dashboard.css";
import logo from "./assets/dict-o-day.png";

// Import new sub-pages
import LearnPage from "./components/LearnPage";
import Test from "./Test";
import JournalPage from "./components/JournalPage";
import CalendarPage from "./components/CalendarPage";
import ProfilePage from "./components/ProfilePage";
import AITutorPage from "./components/AITutorPage";
import WordDetailPage from "./components/WordDetailPage";

// Import word bank database
import { VOCABULARY_BANK } from "./data/words";

const STREAK_DAYS = [
  { day: "Mon", done: true },
  { day: "Tue", done: true },
  { day: "Wed", done: true },
  { day: "Thu", done: true },
  { day: "Fri", done: false },
  { day: "Sat", done: false },
  { day: "Sun", done: false, today: true },
];

const CHART_DATA = [
  { label: "Mon", words: 8 },
  { label: "Tue", words: 12 },
  { label: "Wed", words: 6 },
  { label: "Thu", words: 15 },
  { label: "Fri", words: 10 },
  { label: "Sat", words: 13 },
  { label: "Sun", words: 14 },
];

// Fallback Today Words (from original, to keep the UI identical on landing)
const TODAY_WORDS = [
  {
    id: 1,
    word: "Ephemeral",
    pos: "Adjective",
    definition: "Lasting for a very short time.",
    pronunciation: "ih-FEM-er-ul",
    mastery: 82,
  },
  {
    id: 2,
    word: "Laconic",
    pos: "Adjective",
    definition: "Using very few words; brief and concise.",
    pronunciation: "luh-KON-ik",
    mastery: 65,
  },
  {
    id: 3,
    word: "Sanguine",
    pos: "Adjective",
    definition: "Optimistic, especially in a difficult situation.",
    pronunciation: "SANG-gwin",
    mastery: 45,
  },
  {
    id: 4,
    word: "Mellifluous",
    pos: "Adjective",
    definition: "Sweet or musical; pleasant to hear.",
    pronunciation: "meh-LIF-loo-us",
    mastery: 30,
  },
];

const STATS = [
  { label: "Day streak", value: "4", icon: "🔥" },
  { label: "Words learned", value: "138", icon: "📚" },
  { label: "Test accuracy", value: "87%", icon: "🎯" },
  { label: "This week", value: "78", icon: "📅" },
];

function MasteryBar({ pct }) {
  const color =
    pct >= 75 ? "#639922" : pct >= 45 ? "#EF9F27" : "#E24B4A";
  return (
    <div className="mastery-track">
      <div
        className="mastery-fill"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function SparkLine({ data }) {
  const max = Math.max(...data.map((d) => d.words));
  const W = 560, H = 90, PAD = 12;
  const pts = data.map((d, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - (d.words / max) * (H - PAD * 2);
    return [x, y];
  });
  const polyline = pts.map((p) => p.join(",")).join(" ");
  const area =
    `M${pts[0][0]},${H - PAD} ` +
    pts.map((p) => `L${p[0]},${p[1]}`).join(" ") +
    ` L${pts[pts.length - 1][0]},${H - PAD} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="sparkline" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sgr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF9F27" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#EF9F27" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sgr)" />
      <polyline points={polyline} fill="none" stroke="#EF9F27" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#EF9F27" />
      ))}
    </svg>
  );
}

export default function Dashboard({ userProfile, setUserProfile, loginDate }) {
  const [activeNav, setActiveNav] = useState("home");
  const [flipped, setFlipped] = useState({});
  const [learnedWords, setLearnedWords] = useState(VOCABULARY_BANK);
  const [selectedWord, setSelectedWord] = useState(null);
  const [initialAIWord, setInitialAIWord] = useState("");

  const toggleFlip = (id) =>
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));

  // Handle study status modifications
  const handleMarkLearned = (wordId) => {
    setLearnedWords((prev) =>
      prev.map((w) => (w.id === wordId ? { ...w, mastery: 100 } : w))
    );
  };

  const handleAddCustomWord = (newWord) => {
    setLearnedWords((prev) => [...prev, newWord]);
  };

  // Navigates to AI tutor from word corner button
  const handleNavigateToAI = (wordName) => {
    setInitialAIWord(wordName);
    setActiveNav("ai-tutor");
  };

  // Handle word card clicks
  const handleWordCardSelect = (wordObj) => {
    // Find rich data in VOCABULARY_BANK
    const fullData =
      VOCABULARY_BANK.find((v) => v.word.toLowerCase() === wordObj.word.toLowerCase()) || wordObj;
    setSelectedWord(fullData);
    setActiveNav("word-detail");
  };

  return (
    <div className="dod-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon"><img src={logo} className="brand-icon" alt="Brand Logo" /></span>
          <span className="brand-name">Dict<span className="brand-accent">·o·</span>Day</span>
        </div>
        <nav className="sidebar-nav">
          {[
            { id: "home", icon: "⊞", label: "Dashboard" },
            { id: "learn", icon: "✦", label: "Learn" },
            { id: "test", icon: "◎", label: "Test" },
            { id: "journal", icon: "◈", label: "Journal" },
            { id: "calendar", icon: "▦", label: "Calendar" },
          ].map((item) => (
            <button
              key={item.id}
              className={`nav-item${activeNav === item.id ? " active" : ""}`}
              onClick={() => {
                setActiveNav(item.id);
                setSelectedWord(null);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div
            className="user-pill"
            onClick={() => {
              setActiveNav("profile");
              setSelectedWord(null);
            }}
            style={{ cursor: "pointer" }}
          >
            <div className="user-avatar">
              {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="user-info">
              <span className="user-name">{userProfile.name}</span>
              <span className="user-level">{userProfile.difficulty}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="main">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">Good morning, {userProfile.name} ☀️</h1>
            <p className="page-sub">You have {userProfile.wordCount} new words waiting today</p>
          </div>
          <div className="topbar-right">
            <div
              className="streak-badge"
              onClick={() => setActiveNav("calendar")}
              style={{ cursor: "pointer" }}
            >
              <span className="streak-fire">🔥</span>
              <span className="streak-num">4</span>
              <span className="streak-label">day streak</span>
            </div>
          </div>
        </header>

        {/* CONDITIONAL PAGES RENDERING */}
        {activeNav === "home" && (
          <>
            {/* Stats row */}
            <section className="stats-row">
              {STATS.map((s) => (
                <div className="stat-card" key={s.label}>
                  <span className="stat-icon">{s.icon}</span>
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </section>

            {/* Chart + Streak row */}
            <section className="mid-row">
              <div className="chart-card">
                <div className="card-header">
                  <span className="card-title">Learning this week</span>
                  <span className="card-badge">78 words</span>
                </div>
                <div className="chart-labels">
                  {CHART_DATA.map((d) => (
                    <span key={d.label} className="chart-label">{d.label}</span>
                  ))}
                </div>
                <SparkLine data={CHART_DATA} />
              </div>

              <div
                className="streak-card"
                onClick={() => setActiveNav("calendar")}
                style={{ cursor: "pointer" }}
              >
                <div className="card-header">
                  <span className="card-title">This week</span>
                </div>
                <div className="streak-row">
                  {STREAK_DAYS.map((d) => (
                    <div key={d.day} className="streak-day">
                      <div
                        className={`streak-circle ${d.done ? "done" : ""} ${d.today ? "today" : ""}`}
                      >
                        {d.done ? "✓" : d.today ? "·" : ""}
                      </div>
                      <span className="streak-day-label">{d.day}</span>
                    </div>
                  ))}
                </div>
                <p className="streak-message">Keep it up! 3 more days for a perfect week.</p>
              </div>
            </section>

            {/* Action buttons */}
            <section className="action-row">
              <button className="action-btn primary" onClick={() => setActiveNav("learn")}>
                <span className="action-icon">✦</span>
                Start learning
              </button>
              <button className="action-btn secondary" onClick={() => setActiveNav("test")}>
                <span className="action-icon">◎</span>
                Take a test
              </button>
              <button className="action-btn secondary" onClick={() => setActiveNav("ai-tutor")}>
                <span className="action-icon">🤖</span>
                AI tutor
              </button>
            </section>

            {/* Today's words */}
            <section className="words-section">
              <div className="section-header">
                <h2 className="section-title">Today's words</h2>
                <span className="section-pill">10 words · 4 previewed</span>
              </div>
              <div className="words-grid">
                {TODAY_WORDS.map((w) => (
                  <div
                    key={w.id}
                    className={`word-card${flipped[w.id] ? " flipped" : ""}`}
                    onClick={() => toggleFlip(w.id)}
                  >
                    <div className="word-card-inner">
                      {/* Front */}
                      <div className="word-face front">
                        <div className="word-top">
                          <span className="pos-tag">{w.pos}</span>
                          <span className="flip-hint">tap to flip</span>
                        </div>
                        <h3 className="word-title">{w.word}</h3>
                        <p className="word-pron">/{w.pronunciation}/</p>
                        <div className="word-mastery">
                          <span className="mastery-label">Mastery</span>
                          <span className="mastery-pct">{w.mastery}%</span>
                        </div>
                        <MasteryBar pct={w.mastery} />
                      </div>
                      {/* Back */}
                      <div className="word-face back">
                        <div className="back-card-top-row">
                          <span className="pos-tag">{w.pos}</span>
                          {/* Details Navigation link */}
                          <button
                            className="details-link-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWordCardSelect(w);
                            }}
                          >
                            Details ➔
                          </button>
                        </div>
                        <h3 className="word-title back-word">{w.word}</h3>
                        <p className="word-def">{w.definition}</p>
                        <p className="word-sentence">"His laconic reply told me everything I needed to know."</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* LEARN VIEW */}
        {activeNav === "learn" && (
          <LearnPage
            wordsPool={learnedWords}
            onMarkLearned={handleMarkLearned}
            onWordSelect={handleWordCardSelect}
          />
        )}

        {/* TEST VIEW */}
        {activeNav === "test" && (
          <Test learnedWords={learnedWords} />
        )}

        {/* JOURNAL VIEW */}
        {activeNav === "journal" && (
          <JournalPage
            learnedWords={learnedWords}
            onWordSelect={handleWordCardSelect}
            onAddCustomWord={handleAddCustomWord}
          />
        )}

        {/* CALENDAR VIEW */}
        {activeNav === "calendar" && (
          <CalendarPage learnedWords={learnedWords} loginDate={loginDate} />
        )}

        {/* PROFILE VIEW */}
        {activeNav === "profile" && (
          <ProfilePage
            userProfile={userProfile}
            onSave={(updated) => setUserProfile(updated)}
          />
        )}

        {/* AI TUTOR VIEW */}
        {activeNav === "ai-tutor" && (
          <AITutorPage
            initialWord={initialAIWord}
            onClearInitialWord={() => setInitialAIWord("")}
          />
        )}

        {/* WORD DETAIL VIEW */}
        {activeNav === "word-detail" && selectedWord && (
          <WordDetailPage
            wordData={selectedWord}
            onBack={() => setActiveNav("home")}
            onNavigateToAI={handleNavigateToAI}
          />
        )}
      </main>
    </div>
  );
}
