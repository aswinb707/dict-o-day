import React, { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

function App() {
  const [authed, setAuthed] = useState(false);
  return authed ? <Dashboard /> : <Login onLogin={() => setAuthed(true)} />;
}

export default App;
