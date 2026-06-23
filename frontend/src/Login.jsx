import React, { useState } from "react";
import logo from "./assets/dict-o-day.png";
import "./Login.css";
import Field from "./components/Field";

const EyeBtn = ({ showPass, setShowPass }) => (
  <button
    type="button"
    className="eye-btn"
    onClick={() => setShowPass((prev) => !prev)}
    tabIndex={-1}
  >
    {showPass ? (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ) : (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )}
  </button>
);

export default function Login({ onLogin, onRegister }) {
  const [tab, setTab] = useState("login");
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    dob: "",
    difficulty: "",
    wordCount: 5,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const setLogin = (key, value) =>
    setLoginForm((prev) => ({ ...prev, [key]: value }));

  const setReg = (key, value) =>
    setRegisterForm((prev) => ({ ...prev, [key]: value }));

  const validateStep1 = () => {
    const e = {};
    if (!registerForm.username.trim()) e.username = "Username is required";
    if (!registerForm.email.includes("@")) e.email = "Enter a valid email";
    if (!registerForm.dob) e.dob = "Date of birth is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const e2 = {};
    if (!loginForm.email.includes("@")) e2.email = "Enter a valid email";
    if (!loginForm.password) e2.password = "Password is required";
    setErrors(e2);
    if (Object.keys(e2).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onLogin) onLogin();
    }, 1400);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (validateStep1()) setStep(2);
      return;
    }
    const e2 = {};
    if (!registerForm.difficulty) e2.difficulty = "Pick a difficulty level";
    setErrors(e2);
    if (Object.keys(e2).length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onRegister) {
        onRegister({
          name: registerForm.username,
          dob: registerForm.dob,
          difficulty: registerForm.difficulty,
          wordCount: registerForm.wordCount || 5
        });
      } else if (onLogin) {
        onLogin();
      }
    }, 1400);
  };

  return (
    <div className="login-root">
      {/* Left Panel */}
      <div className="left-panel">
        <div className="lp-inner">
          <div className="lp-brand">
            <div className="lp-brand-icon">
              <img
                className="lp-brand-icon"
                src={logo}
                width="100"
                alt="Dict-o-Day logo"
              />
            </div>
            <span className="lp-brand-name">
              Dict<span className="lp-accent">·o·</span>Day
            </span>
          </div>

          <div className="lp-hero">
            <h2 className="lp-headline">
              Expand your vocabulary,
              <br />
              one word a day.
            </h2>
            <p className="lp-sub">
              Curated words. AI-powered context. Streaks that actually stick.
            </p>
          </div>

          <div className="lp-stats">
            <div className="lp-stat">
              <span className="lp-stat-num">10K+</span>
              <span className="lp-stat-lbl">Words in library</span>
            </div>
            <div className="lp-divider" />
            <div className="lp-stat">
              <span className="lp-stat-num">87%</span>
              <span className="lp-stat-lbl">Avg. retention</span>
            </div>
            <div className="lp-divider" />
            <div className="lp-stat">
              <span className="lp-stat-num">4.9 ★</span>
              <span className="lp-stat-lbl">User rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="form-card">
          <div className="tab-row">
            <button
              className={`tab-btn${tab === "login" ? " active" : ""}`}
              onClick={() => {
                setTab("login");
                setErrors({});
              }}
            >
              Log in
            </button>
            <button
              className={`tab-btn${tab === "register" ? " active" : ""}`}
              onClick={() => {
                setTab("register");
                setStep(1);
                setErrors({});
              }}
            >
              Sign up
            </button>
          </div>

          {/* LOGIN */}
          {tab === "login" && (
            <form className="form-body" onSubmit={handleLoginSubmit} noValidate>
              <div className="form-greeting">
                <h1 className="form-title">Welcome back</h1>
                <p className="form-sub">Log in to continue your streak</p>
              </div>

              <Field
                label="Email"
                id="l-email"
                type="email"
                value={loginForm.email}
                onChange={(v) => setLogin("email", v)}
                error={errors.email}
                placeholder="you@example.com"
              />

              <Field
                label="Password"
                id="l-pass"
                type={showPass ? "text" : "password"}
                value={loginForm.password}
                onChange={(v) => setLogin("password", v)}
                error={errors.password}
                placeholder="Your password"
                right={<EyeBtn showPass={showPass} setShowPass={setShowPass} />}
              />

              <button
                type="submit"
                className={`submit-btn${loading ? " loading" : ""}`}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : "Log in"}
              </button>
            </form>
          )}

          {/* REGISTER */}
          {tab === "register" && (
            <form
              className="form-body"
              onSubmit={handleRegisterSubmit}
              noValidate
            >
              <div className="form-greeting">
                <h1 className="form-title">
                  {step === 1 ? "Create account" : "Personalise your learning"}
                </h1>
                <p className="form-sub">
                  {step === 1
                    ? "Step 1 of 2 — Basic details"
                    : "Step 2 of 2 — Your preferences"}
                </p>
              </div>

              {step === 1 && (
                <>
                  <Field
                    label="Username"
                    id="r-user"
                    value={registerForm.username}
                    onChange={(v) => setReg("username", v)}
                    error={errors.username}
                    placeholder="Pick a username"
                  />

                  <Field
                    label="Email"
                    id="r-email"
                    type="email"
                    value={registerForm.email}
                    onChange={(v) => setReg("email", v)}
                    error={errors.email}
                    placeholder="you@gmail.com"
                  />

                  <Field
                    label="Date of birth"
                    id="r-dob"
                    type="date"
                    value={registerForm.dob}
                    onChange={(v) => setReg("dob", v)}
                    error={errors.dob}
                  />
                </>
              )}

              {step === 2 && (
                <div className="field">
                  <label className="field-label">Difficulty level</label>
                  <div className="diff-row">
                    {["Easy", "Medium", "Hard"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`diff-pill${
                          registerForm.difficulty === d ? " active" : ""
                        }`}
                        onClick={() => {
                          setReg("difficulty", d);
                          setErrors({});
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  {errors.difficulty && (
                    <span className="field-error">{errors.difficulty}</span>
                  )}
                </div>
              )}

              <div className="reg-btn-row">
                {step === 2 && (
                  <button
                    type="button"
                    className="back-btn"
                    onClick={() => {
                      setStep(1);
                      setErrors({});
                    }}
                  >
                    ← Back
                  </button>
                )}

                <button
                  type="submit"
                  className={`submit-btn${loading ? " loading" : ""}`}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner" />
                  ) : step === 1 ? (
                    "Continue →"
                  ) : (
                    "Create account"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}