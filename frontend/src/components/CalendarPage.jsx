import React, { useState } from "react";
import "./CalendarPage.css";

export default function CalendarPage({ learnedWords, loginDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateWords, setSelectedDateWords] = useState(null);
  const [selectedDayNum, setSelectedDayNum] = useState(null);

  // Group learned words by date
  const wordsByDate = learnedWords.reduce((groups, word) => {
    const date = word.dateLearned;
    if (!groups[date]) groups[date] = [];
    groups[date].push(word);
    return groups;
  }, {});

  // Generate calendar details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Number of days in the month
  const totalDays = new Date(year, month + 1, 0).getDate();
  // First day of the week (0 = Sunday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Create dates list
  const calendarCells = [];
  // Fillers for empty days at start
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Month days
  for (let d = 1; d <= totalDays; d++) {
    calendarCells.push(d);
  }

  // Format single date to YYYY-MM-DD
  const formatDateString = (dayNum) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(dayNum).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const handleDayClick = (dayNum) => {
    if (!dayNum) return;
    const dateStr = formatDateString(dayNum);
    const words = wordsByDate[dateStr] || [];
    setSelectedDateWords(words);
    setSelectedDayNum(dayNum);
  };

  // Streak status calculation since a simulated login date (or the dates that have words)
  // Let's determine if a day is a streak day. A day is a streak day if we have learned words on it
  const isStreakDay = (dayNum) => {
    if (!dayNum) return false;
    const dateStr = formatDateString(dayNum);
    return wordsByDate[dateStr] && wordsByDate[dateStr].length > 0;
  };

  // Calculate streak metadata
  const totalWordsCount = learnedWords.length;
  const activeStreakDays = Object.keys(wordsByDate).length;

  return (
    <div className="calendar-container animate-fade-in">
      <header className="calendar-header">
        <div>
          <h1 className="calendar-title">My Progress Calendar</h1>
          <p className="calendar-sub">Visualizing your daily learning streak status</p>
        </div>
      </header>

      <div className="calendar-layout">
        {/* Left: Calendar Grid Card */}
        <div className="calendar-card">
          <div className="calendar-card-header">
            <h2 className="month-year-label">
              {monthNames[month]} {year}
            </h2>
            <div className="calendar-nav-buttons">
              <button
                className="cal-nav-btn"
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              >
                ◀
              </button>
              <button
                className="cal-nav-btn"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </button>
              <button
                className="cal-nav-btn"
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              >
                ▶
              </button>
            </div>
          </div>

          <div className="calendar-grid-header">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="calendar-grid-cells">
            {calendarCells.map((dayNum, index) => {
              const active = isStreakDay(dayNum);
              const isToday =
                dayNum === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();
              const isSelected = selectedDayNum === dayNum;

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(dayNum)}
                  className={`calendar-cell ${!dayNum ? "empty" : ""} ${active ? "streak-active" : ""} ${
                    isToday ? "today-cell" : ""
                  } ${isSelected ? "selected-cell" : ""}`}
                >
                  {dayNum && (
                    <>
                      <span className="day-number">{dayNum}</span>
                      {active && <span className="streak-indicator">🔥</span>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Streak Details and Words Learner Panel */}
        <div className="streak-summary-panel">
          <div className="streak-stats-card">
            <h3>Streak Analytics</h3>
            <div className="streak-grid">
              <div className="streak-stat">
                <span className="stat-num">{activeStreakDays}</span>
                <span className="stat-lbl">Active Days</span>
              </div>
              <div className="streak-stat">
                <span className="stat-num">{totalWordsCount}</span>
                <span className="stat-lbl">Words Cataloged</span>
              </div>
            </div>
            <p className="streak-meta-msg">
              Your streak has been saved since login. Keep learning daily to maximize your IELTS success!
            </p>
          </div>

          {selectedDayNum ? (
            <div className="day-detail-card">
              <h3>
                Activity on {monthNames[month]} {selectedDayNum}
              </h3>
              {selectedDateWords && selectedDateWords.length > 0 ? (
                <div className="day-words-list">
                  <p className="day-words-desc">You unlocked {selectedDateWords.length} words:</p>
                  {selectedDateWords.map((w) => (
                    <div key={w.id} className="day-word-pill">
                      <span className="dw-name">{w.word}</span>
                      <span className="dw-pos">{w.pos}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-day-activity">No vocabulary words learned on this date. Click on a day marked with 🔥 to review words.</p>
              )}
            </div>
          ) : (
            <div className="day-detail-card empty-detail">
              <span className="calendar-prompt-icon">📅</span>
              <p>Click on any date to inspect the words learned and progress made on that day.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
