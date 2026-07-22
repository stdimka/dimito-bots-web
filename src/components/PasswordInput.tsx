import { useState } from "react";
import { useLocaleStore } from "../stores/localeStore";
import { t } from "../i18n";
import "./PasswordInput.css";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
};

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  required = true,
}: Props) {
  const [visible, setVisible] = useState(false);
  const locale = useLocaleStore((s) => s.locale);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-wrap">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="password-eye"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t(locale, "hidePassword") : t(locale, "showPassword")}
          title={visible ? t(locale, "hidePassword") : t(locale, "showPassword")}
        >
          {visible ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.8 9.8 0 0112 5c5 0 9.3 3.1 11 7.5a11.6 11.6 0 01-4.2 5.1M6.1 6.1A11.6 11.6 0 001 12.5C2.7 16.9 7 20 12 20c1.6 0 3.1-.3 4.5-.9"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M1 12.5C2.7 8.1 7 5 12 5s9.3 3.1 11 7.5c-1.7 4.4-6 7.5-11 7.5S2.7 16.9 1 12.5z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
