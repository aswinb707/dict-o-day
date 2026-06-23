import React from "react";

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