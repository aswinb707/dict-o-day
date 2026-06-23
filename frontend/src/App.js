import React, { useState, useEffect } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("dod_token");
    if (token) {
      setAuthed(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("dod_token");
    localStorage.removeItem("dod_refresh_token");
    localStorage.removeItem("dod_user");
    setAuthed(false);
  };

  return authed ? (
    <Dashboard onLogout={handleLogout} />
  ) : (
    <Login onLogin={() => setAuthed(true)} />
  );
}

export default App;
