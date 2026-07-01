import React, { useState } from "react";
import "./ProfilePage.css";

export default function ProfilePage({ userProfile, onSave, onLogout }) {
  const [formData, setFormData] = useState({
    name: userProfile.name,
    dob: userProfile.dob,
    wordCount: userProfile.wordCount,
    difficulty: userProfile.difficulty,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className="profile-container animate-fade-in">
      <header className="profile-header">
        <h1 className="profile-title">Profile Settings</h1>
        <p className="profile-sub">Manage your personal information and language training options</p>
      </header>

      <form className="profile-card" onSubmit={handleSubmit}>
        {showSuccess && (
          <div className="success-banner animate-fade-in">
            <span>✓</span> Profile updated successfully and synchronized.
          </div>
        )}

        <div className="profile-avatar-sec">
          <div className="profile-avatar-large">
            {formData.name ? formData.name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="profile-avatar-meta">
            <h3>{formData.name || "Alex R."}</h3>
            <span className="profile-level-badge">{formData.difficulty} Learner</span>
          </div>
        </div>

        <hr className="profile-divider" />

        <div className="profile-form-grid">
          {/* Name Field */}
          <div className="p-field">
            <label className="p-label" htmlFor="p-name">
              Full Name
            </label>
            <input
              id="p-name"
              type="text"
              className="p-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Date of Birth Field */}
          <div className="p-field">
            <label className="p-label" htmlFor="p-dob">
              Date of Birth
            </label>
            <input
              id="p-dob"
              type="date"
              className="p-input"
              value={formData.dob}
              disabled
            />
          </div>

          {/* Word Count Field */}
          <div className="p-field">
            <label className="p-label" htmlFor="p-wordcount">
              Words to Learn Per Day (Max 10)
            </label>
            <input
              id="p-wordcount"
              type="number"
              className="p-input"
              min="1"
              max="10"
              value={formData.wordCount}
              onChange={(e) => {
                let val = Math.max(1, Math.min(10, Number(e.target.value)));
                setFormData({ ...formData, wordCount: val });
              }}
              required
            />
            <span className="field-hint">Limit is 10 words. You can postpone active words to make room for new ones.</span>
          </div>

          {/* Difficulty Level */}
          <div className="p-field">
            <label className="p-label">Difficulty level</label>
            <div className="p-diff-row">
              {["Easy", "Medium", "Hard"].map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`p-diff-pill${formData.difficulty === d ? " active" : ""}`}
                  onClick={() => setFormData({ ...formData, difficulty: d })}
                >
                  {d}
                </button>
              ))}
            </div>
            <span className="field-hint">Adapts dictionary card complexities to match your level.</span>
          </div>
        </div>

        <div className="profile-btn-row">
          <button type="submit" className="p-save-btn">
            Save Settings
          </button>
          <button type="button" className="p-logout-btn" onClick={onLogout}>
            Log Out
          </button>
        </div>
      </form>
    </div>
  );
}
