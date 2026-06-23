import React, { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  const [authed, setAuthed] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "Alex R.",
    dob: "1998-05-15",
    wordCount: 10,
    difficulty: "Medium",
  });
  const [loginDate, setLoginDate] = useState(new Date().toISOString().split("T")[0]);

  const handleRegister = (regData) => {
    setUserProfile({
      name: regData.name || "Alex R.",
      dob: regData.dob || "1998-05-15",
      wordCount: regData.wordCount || 10,
      difficulty: regData.difficulty || "Medium",
    });
    setLoginDate(new Date().toISOString().split("T")[0]);
    setAuthed(true);
  };

  const handleLogin = () => {
    setLoginDate(new Date().toISOString().split("T")[0]);
    setAuthed(true);
  };

  return authed ? (
    <Dashboard userProfile={userProfile} setUserProfile={setUserProfile} loginDate={loginDate} />
  ) : (
    <Login onLogin={handleLogin} onRegister={handleRegister} />
  );
}

export default App;

