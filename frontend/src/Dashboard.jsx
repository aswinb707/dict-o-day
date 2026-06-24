import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import logo from "./assets/dict-o-day.png";
import { API_BASE_URL } from "./config";

// Import new sub-pages
import LearnPage from "./components/LearnPage";
import Test from "./Test";
import JournalPage from "./components/JournalPage";
import CalendarPage from "./components/CalendarPage";
import ProfilePage from "./components/ProfilePage";
import AITutorPage from "./components/AITutorPage";
import WordDetailPage from "./components/WordDetailPage";
import ExplorePage from "./components/ExplorePage";

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
  const max = Math.max(...data.map((d) => d.words)) || 1;
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

function getUniqueCardStyle(wordData) {
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

export default function Dashboard({ userProfile, setUserProfile, loginDate, onLogout }) {
  const [activeNav, setActiveNav] = useState("home");
  const [flipped, setFlipped] = useState({});
  const [todayWords, setTodayWords] = useState([]);
  const [learnedWords, setLearnedWords] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streakCount, setStreakCount] = useState(userProfile.streakCount || 0);
  const [selectedWord, setSelectedWord] = useState(null);
  const [initialAIWord, setInitialAIWord] = useState("");

  const [stats, setStats] = useState([
    { label: "Day streak", value: "0", icon: "🔥" },
    { label: "Words learned", value: "0", icon: "📚" },
    { label: "Test accuracy", value: "0%", icon: "🎯" },
    { label: "This week", value: "0", icon: "📅" },
  ]);

  const [chartData, setChartData] = useState([
    { label: "Mon", words: 0 },
    { label: "Tue", words: 0 },
    { label: "Wed", words: 0 },
    { label: "Thu", words: 0 },
    { label: "Fri", words: 0 },
    { label: "Sat", words: 0 },
    { label: "Sun", words: 0 },
  ]);

  const [streakDays, setStreakDays] = useState([
    { day: "Mon", done: false },
    { day: "Tue", done: false },
    { day: "Wed", done: false },
    { day: "Thu", done: false },
    { day: "Fri", done: false },
    { day: "Sat", done: false },
    { day: "Sun", done: false },
  ]);

  const toggleFlip = (id) =>
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));

  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const pivot = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - pivot);

    const dates = [];
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const isToday = d.toDateString() === today.toDateString();
      dates.push({ label: labels[i], dateStr, isToday });
    }
    return dates;
  };

  const loadDashboardData = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch(`${API_BASE_URL}/api/sessions/start`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(sessionRes => {
        if (sessionRes.data) {
          setSessionId(sessionRes.data.id);
        }
        return fetch(`${API_BASE_URL}/api/words/today`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
      })
      .then(res => res.json())
      .then(wordsRes => {
        if (wordsRes.data) {
          const mappedToday = wordsRes.data.map(w => ({
            id: w.id,
            word: w.word,
            pos: w.partOfSpeech.charAt(0).toUpperCase() + w.partOfSpeech.slice(1),
            definition: w.definition,
            pronunciation: w.pronunciation,
            sentences: [w.inASentence, ...(w.examples || [])],
            synonyms: w.synonyms || "N/A",
            antonyms: w.antonyms || "N/A",
            mastery: 0,
            fusedWord: w.fusedWord,
            fusedDefinition: w.fusedDefinition,
            fusedPronunciation: w.fusedPronunciation,
            fusedSentence: w.fusedSentence
          }));
          setTodayWords(mappedToday);
        }
        return fetch(`${API_BASE_URL}/api/words/learned`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
      })
      .then(res => res.json())
      .then(learnedRes => {
        let mappedLearned = [];
        if (learnedRes.data) {
          mappedLearned = learnedRes.data.map(p => ({
            id: p.word.id,
            word: p.word.word,
            pos: p.word.partOfSpeech.charAt(0).toUpperCase() + p.word.partOfSpeech.slice(1),
            definition: p.word.definition,
            pronunciation: p.word.pronunciation,
            sentences: [p.word.inASentence, ...(p.word.examples || [])],
            synonyms: p.word.synonyms || "N/A",
            antonyms: p.word.antonyms || "N/A",
            mastery: Math.round(p.masteryScore * 100),
            status: p.status,
            dateLearned: p.lastReviewed ? p.lastReviewed.split("T")[0] : new Date().toISOString().split("T")[0],
            fusedWord: p.word.fusedWord,
            fusedDefinition: p.word.fusedDefinition,
            fusedPronunciation: p.word.fusedPronunciation,
            fusedSentence: p.word.fusedSentence
          }));
          setLearnedWords(mappedLearned);
        }
        return fetch(`${API_BASE_URL}/api/users/me/analytics`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(analyticsRes => {
            if (analyticsRes.data) {
              const calendar = analyticsRes.data.calendarHistory || [];
              const weekDates = getWeekDates();

              const newStreakDays = weekDates.map(wd => {
                const entry = calendar.find(c => c.entryDate === wd.dateStr);
                return {
                  day: wd.label,
                  done: entry ? entry.streakMaintained : false,
                  today: wd.isToday
                };
              });
              setStreakDays(newStreakDays);

              const newChartData = weekDates.map(wd => {
                const entry = calendar.find(c => c.entryDate === wd.dateStr);
                return {
                  label: wd.label,
                  words: entry ? entry.wordsCount : 0
                };
              });
              setChartData(newChartData);

              fetch(`${API_BASE_URL}/api/users/me/streak`, {
                headers: { "Authorization": `Bearer ${token}` }
              })
                .then(res => res.json())
                .then(streakRes => {
                  const activeStreak = streakRes.streakCount || 0;
                  setStreakCount(activeStreak);
                  const thisWeekTotal = newChartData.reduce((sum, item) => sum + item.words, 0);
                  const avgAccuracy = analyticsRes.data.averageTestAccuracy != null ? Math.round(analyticsRes.data.averageTestAccuracy) : 0;
                  setStats([
                    { label: "Day streak", value: String(activeStreak), icon: "🔥" },
                    { label: "Words learned", value: String(analyticsRes.data.totalWordsStudied || 0), icon: "📚" },
                    { label: "Test accuracy", value: `${avgAccuracy}%`, icon: "🎯" },
                    { label: "This week", value: String(thisWeekTotal), icon: "📅" },
                  ]);
                });
            }
          });
      })
      .catch(err => console.error("Error loading dashboard data", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.difficulty, userProfile.wordCount]);

  const handleMarkLearned = (wordId) => {
    const token = localStorage.getItem("accessToken");
    if (!token || !sessionId) return;

    fetch(`${API_BASE_URL}/api/sessions/${sessionId}/word-seen`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ wordId })
    })
      .then(res => res.json())
      .then(() => {
        const remaining = todayWords.filter(w => w.id !== wordId && !learnedWords.some(lw => lw.id === w.id));
        if (remaining.length === 0) {
          fetch(`${API_BASE_URL}/api/sessions/${sessionId}/complete`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
          })
            .then(() => {
              loadDashboardData();
            });
        } else {
          loadDashboardData();
        }
      })
      .catch(err => console.error("Error marking word seen", err));
  };

  const handleAddCustomWord = (newWord) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch(`${API_BASE_URL}/api/words/custom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        word: newWord.word,
        partOfSpeech: newWord.pos.toLowerCase(),
        definition: newWord.definition,
        pronunciation: newWord.pronunciation,
        inASentence: newWord.sentences[0] || "",
        examples: newWord.sentences.slice(1)
      })
    })
      .then(res => res.json())
      .then(() => {
        loadDashboardData();
      })
      .catch(err => console.error("Error saving custom word", err));
  };

  const handlePostponeWord = (wordId) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetch(`${API_BASE_URL}/api/words/${wordId}/postpone`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(() => {
        loadDashboardData();
      })
      .catch(err => console.error("Error postponing word:", err));
  };

  const handleSaveProfile = (formData) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const diffMapped = formData.difficulty === "Easy" ? "beginner" :
      formData.difficulty === "Medium" ? "intermediate" : "advanced";

    fetch(`${API_BASE_URL}/api/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        difficulty: diffMapped,
        wordCount: Number(formData.wordCount)
      })
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.data) {
          let diff = "Medium";
          if (resData.data.difficulty === "beginner") diff = "Easy";
          else if (resData.data.difficulty === "intermediate") diff = "Medium";
          else if (resData.data.difficulty === "advanced") diff = "Hard";

          setUserProfile({
            ...userProfile,
            difficulty: diff,
            wordCount: resData.data.wordCountPerDay
          });
        }
      })
      .catch(err => console.error("Error updating profile", err));
  };

  const handleNavigateToAI = (wordName) => {
    setInitialAIWord(wordName);
    setActiveNav("ai-tutor");
  };

  const handleWordCardSelect = (wordObj) => {
    const fullData =
      todayWords.find((v) => v.word.toLowerCase() === wordObj.word.toLowerCase()) ||
      learnedWords.find((v) => v.word.toLowerCase() === wordObj.word.toLowerCase()) ||
      wordObj;
    setSelectedWord(fullData);
    setActiveNav("word-detail");
  };

  if (loading) {
    return (
      <div className="dod-root" style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
          <div style={{ fontSize: "36px", animation: "pulse 1.5s infinite" }}>📚</div>
          <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-3)" }}>Loading your vocabulary dashboard...</span>
        </div>
      </div>
    );
  }

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
            { id: "explore", icon: <span style={{ fontSize: "24px" }}>⌕</span>, label: "Explore" },
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
            <p className="page-sub">You have {todayWords.length} new words waiting today</p>
          </div>
          <div className="topbar-right">
            <div
              className="streak-badge"
              onClick={() => setActiveNav("calendar")}
              style={{ cursor: "pointer" }}
            >
              <span className="streak-fire">🔥</span>
              <span className="streak-num">{streakCount}</span>
              <span className="streak-label">day streak</span>
            </div>
          </div>
        </header>

        {/* CONDITIONAL PAGES RENDERING */}
        {activeNav === "home" && (
          <>
            {/* Stats row */}
            <section className="stats-row">
              {stats.map((s) => (
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
                  <span className="card-badge">{stats[3].value} words</span>
                </div>
                <div className="chart-labels">
                  {chartData.map((d) => (
                    <span key={d.label} className="chart-label">{d.label}</span>
                  ))}
                </div>
                <SparkLine data={chartData} />
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
                  {streakDays.map((d) => (
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
                <p className="streak-message">Keep it up! Maintain your daily learning streak.</p>
              </div>
            </section>

            {/* Limit Warning Banner */}
            {todayWords.length > userProfile.wordCount && (
              <div
                className="limit-warning-banner animate-fade-in"
                style={{
                  background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)",
                  border: "1px solid #ef4444",
                  borderRadius: "var(--radius-sm)",
                  padding: "16px",
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  color: "#fecaca",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)"
                }}
              >
                <span style={{ fontSize: "20px" }}>⚠️</span>
                <div>
                  <h4 style={{ margin: 0, fontWeight: "700", color: "#ffffff" }}>Daily Vocabulary Limit Exceeded</h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
                    You have <strong>{todayWords.length}</strong> words today, which exceeds your daily limit of <strong>{userProfile.wordCount}</strong>.
                    To start learning, please increase your limit in the Profile settings or postpone a word.
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <section className="action-row">
              <button
                className="action-btn primary"
                onClick={() => setActiveNav("learn")}
                disabled={todayWords.length > userProfile.wordCount}
                style={todayWords.length > userProfile.wordCount ? { opacity: 0.5, cursor: "not-allowed" } : {}}
              >
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
                <span className="section-pill">{todayWords.length} words · {todayWords.filter(w => learnedWords.some(lw => lw.word === w.word)).length} learned</span>
              </div>
              <div className="words-grid">
                {todayWords.map((w) => {
                  const mastery = learnedWords.find(lw => lw.word === w.word)?.mastery || 0;
                  return (
                    <div
                      key={w.id}
                      className={`word-card${flipped[w.id] ? " flipped" : ""}`}
                      onClick={() => toggleFlip(w.id)}
                    >
                      <div className="word-card-inner">
                        {/* Front */}
                        <div
                          className="word-face front"
                          style={getUniqueCardStyle(w)}
                        >
                          <div className="word-top">
                            <span className="pos-tag" style={w.fusedWord ? { background: "rgba(255,255,255,0.25)", color: "#ffffff" } : {}}>{w.pos}</span>
                            {w.fusedWord ? (
                              <span className="fused-indicator-badge" style={{ fontSize: "10px", fontWeight: "800", color: "#fbbf24", background: "rgba(0,0,0,0.3)", padding: "2px 8px", borderRadius: "999px" }}>FUSED ⭐</span>
                            ) : (
                              <span className="flip-hint" style={{ color: "rgba(255,255,255,0.6)" }}>tap to flip</span>
                            )}
                          </div>
                          <h3 className="word-title" style={{ color: "#ffffff", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>{w.word}</h3>
                          <p className="word-pron" style={{ color: "rgba(255,255,255,0.7)" }}>/{w.pronunciation}/</p>
                          <div className="word-mastery">
                            <span className="mastery-label" style={{ color: "rgba(255,255,255,0.6)" }}>Mastery</span>
                            <span className="mastery-pct" style={{ color: "#ffffff" }}>{mastery}%</span>
                          </div>
                          <MasteryBar pct={mastery} />
                        </div>
                        {/* Back */}
                        <div
                          className="word-face back"
                          style={{ ...getUniqueCardStyle(w), transform: "rotateY(180deg)" }}
                        >
                          <div className="back-card-top-row">
                            <span className="pos-tag" style={w.fusedWord ? { background: "rgba(255,255,255,0.25)", color: "#ffffff" } : {}}>{w.pos}</span>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {todayWords.length > userProfile.wordCount && (
                                <button
                                  className="postpone-card-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePostponeWord(w.id);
                                  }}
                                  title="Postpone this word to tomorrow"
                                >
                                  ⏱ Postpone
                                </button>
                              )}
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
                          </div>
                          <h3 className="word-title back-word" style={{ color: "#ffffff" }}>{w.word}</h3>
                          <p className="word-def" style={{ color: "#ffffff", fontSize: "12.5px" }}>{w.definition}</p>
                          {w.fusedWord && (
                            <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "6px" }}>
                              <span style={{ fontSize: "9px", fontWeight: "800", color: "#fbbf24", display: "block" }}>IELTS LINK:</span>
                              <span style={{ fontSize: "11px", fontWeight: "700", display: "block" }}>{w.fusedWord}</span>
                            </div>
                          )}
                          {!w.fusedWord && w.sentences && w.sentences[0] && (
                            <p className="word-sentence" style={{ color: "rgba(255,255,255,0.7)", marginTop: "auto" }}>"{w.sentences[0]}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* EXPLORE VIEW */}
        {activeNav === "explore" && (
          <ExplorePage
            onAddWordSuccess={loadDashboardData}
            onBack={() => setActiveNav("home")}
          />
        )}

        {/* LEARN VIEW */}
        {activeNav === "learn" && (
          <LearnPage
            wordsPool={todayWords.filter(w => !learnedWords.some(lw => lw.word === w.word && lw.mastery >= 70))}
            onMarkLearned={handleMarkLearned}
            onWordSelect={handleWordCardSelect}
          />
        )}

        {/* TEST VIEW */}
        {activeNav === "test" && (
          <Test learnedWords={learnedWords} onTestCompleted={loadDashboardData} />
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
            onSave={handleSaveProfile}
            onLogout={onLogout}
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
