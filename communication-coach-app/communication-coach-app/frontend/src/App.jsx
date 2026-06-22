import { Routes, Route } from "react-router-dom";
import Interview from "./pages/Interview.jsx";
import Report from "./pages/Report.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Interview />} />
      <Route path="/report" element={<Report />} />
    </Routes>
  );
}
