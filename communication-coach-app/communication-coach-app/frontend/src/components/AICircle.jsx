// The "AI" is represented as a breathing/pulsing circle whose animation
// state reflects what it's doing: idle, speaking (asking a question),
// listening (recording the user), or thinking (scoring the answer).

export default function AICircle({ state = "idle", label }) {
  return (
    <div className={`ai-circle-wrap state-${state}`}>
      <div className="ai-circle">
        <div className="ai-circle-ring ring-2" />
        <div className="ai-circle-ring ring-1" />
        <div className="ai-circle-core" />
      </div>
      <div className="ai-circle-label">{label || "\u00A0"}</div>
    </div>
  );
}
