import React, { useState, useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import { API_BASE_URL } from "./config";

const mapUserToProfile = (user) => {
  if (!user) return null;
  let difficulty = "Medium";
  if (user.difficulty === "beginner") difficulty = "Easy";
  else if (user.difficulty === "intermediate") difficulty = "Medium";
  else if (user.difficulty === "advanced") difficulty = "Hard";

  return {
    id: user.id,
    name: user.username,
    dob: user.dob || "1998-05-15",
    wordCount: user.wordCountPerDay || 5,
    difficulty: difficulty,
    streakCount: user.streakCount || 0
  };
};

function App() {
  const [authed, setAuthed] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loginDate, setLoginDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) throw new Error("Session expired");
        return res.json();
      })
      .then(resData => {
        if (resData.data) {
          setUserProfile(mapUserToProfile(resData.data));
          setAuthed(true);
        }
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      });
    }
  }, []);

  const handleRegister = (user) => {
    setUserProfile(mapUserToProfile(user));
    setLoginDate(new Date().toISOString().split("T")[0]);
    setAuthed(true);
  };

  const handleLogin = (user) => {
    setUserProfile(mapUserToProfile(user));
    setLoginDate(new Date().toISOString().split("T")[0]);
    setAuthed(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUserProfile(null);
    setAuthed(false);
  };

  return authed && userProfile ? (
    <Dashboard 
      userProfile={userProfile} 
      setUserProfile={setUserProfile} 
      loginDate={loginDate} 
      onLogout={handleLogout} 
    />
  ) : (
    <Login onLogin={handleLogin} onRegister={handleRegister} />
  );
}

export default App;

