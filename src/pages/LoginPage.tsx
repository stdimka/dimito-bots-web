import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LocaleSwitch } from "../components/LocaleSwitch";
import { PasswordInput } from "../components/PasswordInput";
import { useAuthStore } from "../stores/authStore";
import { useLocaleStore } from "../stores/localeStore";
import { t } from "../i18n";
import "./AuthPages.css";

export function LoginPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);
  const locale = useLocaleStore((s) => s.locale);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (token) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch {
      /* error in store */
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-lang">
          <LocaleSwitch compact />
        </div>
        <div className="auth-brand">
          <span className="auth-logo" />
          <h1>{t(locale, "brand")}</h1>
          <p className="muted">{t(locale, "tagline")}</p>
        </div>
        <form onSubmit={onSubmit} className="auth-form">
          <div className="field">
            <label htmlFor="email">{t(locale, "email")}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <PasswordInput
            id="password"
            label={t(locale, "password")}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />
          {error ? <div className="error-box">{error}</div> : null}
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {t(locale, "login")}
          </button>
        </form>
        <p className="auth-switch muted">
          {t(locale, "noAccount")}{" "}
          <Link to="/register">{t(locale, "register")}</Link>
        </p>
      </div>
    </div>
  );
}
