import React, { useState, useEffect } from "react";
import "./Dashboard.css";

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
  const max = Math.max(...data.map((d) => d.words), 1);
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

export default function Dashboard({ onLogout }) {
  const [activeNav, setActiveNav] = useState("home");
  const [flipped, setFlipped] = useState({});

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dod_user")) || { username: "Alex R.", difficulty: "Intermediate" };
    } catch (e) {
      return { username: "Alex R.", difficulty: "Intermediate" };
    }
  });

  const [session, setSession] = useState(null);
  const [words, setWords] = useState([]);
  const [masteryMap, setMasteryMap] = useState({});
  const [stats, setStats] = useState([
    { label: "Day streak", value: "0", icon: "🔥" },
    { label: "Words learned", value: "0", icon: "📚" },
    { label: "Test accuracy", value: "100%", icon: "🎯" },
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

  const [streakMessage, setStreakMessage] = useState("");

  const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  const fetchWithAuth = (url, options = {}) => {
    const token = localStorage.getItem("dod_token");
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return fetch(url, { ...options, headers }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 && onLogout) {
          onLogout();
        }
        throw new Error(data.message || data.detail || "Request failed.");
      }
      return data.data !== undefined ? data.data : data;
    });
  };

  const loadDashboardData = () => {
    // 1. Fetch profile
    fetchWithAuth("http://localhost:8000/api/users/me")
      .then((profile) => {
        setUser(profile);
        localStorage.setItem("dod_user", JSON.stringify(profile));
      })
      .catch((e) => console.error("Error fetching profile", e));

    // 2. Fetch daily streak
    fetchWithAuth("http://localhost:8000/api/users/me/streak")
      .then((streakInfo) => {
        const streak = streakInfo.streakCount || 0;
        setStats((prev) =>
          prev.map((s) => (s.label === "Day streak" ? { ...s, value: streak.toString() } : s))
        );
      })
      .catch((e) => console.error("Error fetching streak", e));

    // 3. Start daily session
    fetchWithAuth("http://localhost:8000/api/sessions/start", { method: "POST" })
      .then((sess) => {
        setSession(sess);
        // If session is already completed, pre-flip all cards visually
        if (sess && sess.completed) {
          // Fetch today's words and then set all flipped
          fetchWithAuth("http://localhost:8000/api/words/today")
            .then((todayWords) => {
              setWords(todayWords || []);
              const newFlipped = {};
              todayWords.forEach((w) => {
                newFlipped[w.id] = true;
              });
              setFlipped(newFlipped);
            });
        } else {
          // Fetch today's words
          fetchWithAuth("http://localhost:8000/api/words/today")
            .then((todayWords) => {
              setWords(todayWords || []);
            });
        }

        // Fetch learned words (for mastery mapping)
        return fetchWithAuth("http://localhost:8000/api/words/learned");
      })
      .then((learnedProgress) => {
        const map = {};
        if (learnedProgress && Array.isArray(learnedProgress)) {
          learnedProgress.forEach((p) => {
            map[p.wordId] = Math.round((p.masteryScore || 0) * 100);
          });
        }
        setMasteryMap(map);
      })
      .catch((e) => console.error("Error initializing session/words", e));

    // 4. Fetch analytics
    fetchWithAuth("http://localhost:8000/api/users/me/analytics")
      .then((analytics) => {
        const totalLearned = analytics.totalWordsStudied || 0;
        setStats((prev) =>
          prev.map((s) => (s.label === "Words learned" ? { ...s, value: totalLearned.toString() } : s))
        );

        const history = analytics.calendarHistory || [];
        const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const today = new Date();

        const weeklyWords = {};
        const streakDaysCompleted = {};
        let thisWeekSum = 0;

        daysOfWeek.forEach((d) => {
          weeklyWords[d] = 0;
          streakDaysCompleted[d] = false;
        });

        history.forEach((h) => {
          const entryDate = new Date(h.entryDate);
          const diffTime = Math.abs(today - entryDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 7) {
            const dayName = entryDate.toLocaleDateString("en-US", { weekday: "short" });
            weeklyWords[dayName] = (weeklyWords[dayName] || 0) + (h.wordsCount || 0);
            if (h.streakMaintained) {
              streakDaysCompleted[dayName] = true;
            }
            thisWeekSum += (h.wordsCount || 0);
          }
        });

        setStats((prev) =>
          prev.map((s) => (s.label === "This week" ? { ...s, value: thisWeekSum.toString() } : s))
        );

        setChartData(
          daysOfWeek.map((d) => ({
            label: d,
            words: weeklyWords[d] || 0,
          }))
        );

        const todayName = today.toLocaleDateString("en-US", { weekday: "short" });
        setStreakDays(
          daysOfWeek.map((d) => ({
            day: d,
            done: streakDaysCompleted[d],
            today: d === todayName,
          }))
        );

        const missingDays = daysOfWeek.filter((d) => !streakDaysCompleted[d] && d !== todayName).length;
        if (missingDays === 0) {
          setStreakMessage("Perfect week! Amazing job! 🎉");
        } else {
          setStreakMessage("Keep it up! Make sure to learn every day for a perfect week.");
        }
      })
      .catch((e) => console.error("Error fetching analytics", e));

    // 5. Fetch test history
    fetchWithAuth("http://localhost:8000/api/tests/history")
      .then((history) => {
        if (history && history.length > 0) {
          const sum = history.reduce((acc, t) => acc + (t.scorePct || 0), 0);
          const avg = Math.round(sum / history.length);
          setStats((prev) =>
            prev.map((s) => (s.label === "Test accuracy" ? { ...s, value: `${avg}%` } : s))
          );
        } else {
          setStats((prev) =>
            prev.map((s) => (s.label === "Test accuracy" ? { ...s, value: "100%" } : s))
          );
        }
      })
      .catch((e) => console.error("Error fetching test history", e));
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const completeDailySession = (currentSessionId) => {
    fetchWithAuth(`http://localhost:8000/api/sessions/${currentSessionId}/complete`, {
      method: "POST",
    })
      .then((updatedSess) => {
        setSession(updatedSess);
        loadDashboardData();
      })
      .catch((e) => console.error("Error completing session", e));
  };

  const toggleFlip = (id) => {
    setFlipped((prev) => ({ ...prev, [id]: !prev[id] }));

    if (!flipped[id] && session && !session.completed) {
      fetchWithAuth(`http://localhost:8000/api/sessions/${session.id}/word-seen`, {
        method: "POST",
        body: JSON.stringify({ wordId: id }),
      })
      .then(() => {
        return fetchWithAuth("http://localhost:8000/api/words/learned");
      })
      .then((learnedProgress) => {
        const map = {};
        if (learnedProgress && Array.isArray(learnedProgress)) {
          learnedProgress.forEach((p) => {
            map[p.wordId] = Math.round((p.masteryScore || 0) * 100);
          });
        }
        setMasteryMap(map);

        const updatedFlipped = { ...flipped, [id]: true };
        const allFlipped = words.every((w) => updatedFlipped[w.id]);
        if (allFlipped) {
          completeDailySession(session.id);
        }
      })
      .catch((e) => console.error("Error marking word seen", e));
    }
  };

  return (
    <div className="dod-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">📖</span>
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
              onClick={() => setActiveNav(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div
            className="user-pill"
            onClick={onLogout}
            style={{ cursor: "pointer" }}
            title="Click to Log out"
          >
            <div className="user-avatar">
              {user.username ? user.username.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className="user-level">{capitalize(user.difficulty)}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">Good morning, {user.username} ☀️</h1>
            <p className="page-sub">
              {session && session.completed
                ? "You have completed today's vocabulary training!"
                : `You have ${words.length} new words waiting today`}
            </p>
          </div>
          <div className="topbar-right">
            <div className="streak-badge">
              <span className="streak-fire">🔥</span>
              <span className="streak-num">
                {stats.find((s) => s.label === "Day streak")?.value || "0"}
              </span>
              <span className="streak-label">day streak</span>
            </div>
          </div>
        </header>

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
              <span className="card-badge">
                {stats.find((s) => s.label === "This week")?.value || "0"} words
              </span>
            </div>
            <div className="chart-labels">
              {chartData.map((d) => (
                <span key={d.label} className="chart-label">{d.label}</span>
              ))}
            </div>
            <SparkLine data={chartData} />
          </div>

          <div className="streak-card">
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
            <p className="streak-message">{streakMessage}</p>
          </div>
        </section>

        {/* Action buttons */}
        <section className="action-row">
          <button
            className="action-btn primary"
            onClick={() => {
              if (session && !session.completed) {
                // If not completed, complete the session on click as start learning action
                completeDailySession(session.id);
              } else {
                alert("Today's session is already completed!");
              }
            }}
          >
            <span className="action-icon">✦</span>
            {session && session.completed ? "Session completed" : "Start learning"}
          </button>
          <button className="action-btn secondary" onClick={() => alert("Tests page integration coming soon!")}>
            <span className="action-icon">◎</span>
            Take a test
          </button>
          <button className="action-btn secondary" onClick={() => alert("AI tutor integration coming soon!")}>
            <span className="action-icon">🤖</span>
            AI tutor
          </button>
        </section>

        {/* Today's words */}
        <section className="words-section">
          <div className="section-header">
            <h2 className="section-title">Today's words</h2>
            <span className="section-pill">
              {words.length} words · {Object.keys(flipped).length} previewed
            </span>
          </div>
          <div className="words-grid">
            {words.map((w) => {
              const mastery = masteryMap[w.id] || 0;
              return (
                <div
                  key={w.id}
                  className={`word-card${flipped[w.id] ? " flipped" : ""}`}
                  onClick={() => toggleFlip(w.id)}
                >
                  <div className="word-card-inner">
                    {/* Front */}
                    <div className="word-face front">
                      <div className="word-top">
                        <span className="pos-tag">{capitalize(w.partOfSpeech)}</span>
                        <span className="flip-hint">tap to flip</span>
                      </div>
                      <h3 className="word-title">{w.word}</h3>
                      <p className="word-pron">/{w.pronunciation}/</p>
                      <div className="word-mastery">
                        <span className="mastery-label">Mastery</span>
                        <span className="mastery-pct">{mastery}%</span>
                      </div>
                      <MasteryBar pct={mastery} />
                    </div>
                    {/* Back */}
                    <div className="word-face back">
                      <span className="pos-tag">{capitalize(w.partOfSpeech)}</span>
                      <h3 className="word-title back-word">{w.word}</h3>
                      <p className="word-def">{w.definition}</p>
                      <p className="word-sentence">"{w.inASentence}"</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
