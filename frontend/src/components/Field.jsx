import React from "react";
const EyeBtn = ({ showPass, setShowPass }) => (
  <button
    type="button"
    className="eye-btn"
    onClick={() => setShowPass((prev) => !prev)}
    tabIndex={-1}
  >
    {showPass ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )}
  </button>
);

export default function Field({
  label,
  id,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  right,
}) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>

      <div className="field-wrap">
        <input
          id={id}
          type={type}
          className={`field-input${error ? " err" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
        />

        {right}
      </div>

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}