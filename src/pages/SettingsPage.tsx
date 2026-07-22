import { API_BASE_URL } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { useLocaleStore } from "../stores/localeStore";
import {
  THEME_OPTIONS,
  useThemeStore,
  type ThemeId,
} from "../stores/themeStore";
import { t } from "../i18n";
import "./SettingsPage.css";

const themeLabelKey: Record<ThemeId, "themeMindaro" | "themeDark" | "themeFederal"> = {
  mindaro: "themeMindaro",
  dark: "themeDark",
  federal: "themeFederal",
};

export function SettingsPage() {
  const locale = useLocaleStore((s) => s.locale);
  const themeId = useThemeStore((s) => s.themeId);
  const setThemeId = useThemeStore((s) => s.setThemeId);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="settings">
      <h1>{t(locale, "settings")}</h1>
      <p className="muted">{t(locale, "mindaroNote")}</p>

      <section className="card settings-card">
        <h2>{t(locale, "account")}</h2>
        <p>
          <strong>{user?.email}</strong>
        </p>
        <button type="button" className="btn btn-danger btn-sm" onClick={logout}>
          {t(locale, "logout")}
        </button>
      </section>

      <section className="card settings-card">
        <h2>{t(locale, "themeTitle")}</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {t(locale, "themeDesc")}
        </p>
        <div className="theme-row">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={themeId === opt.id ? "theme-card active" : "theme-card"}
              onClick={() => setThemeId(opt.id)}
            >
              <span className="theme-swatches" aria-hidden>
                {opt.swatches.map((c) => (
                  <span key={c} style={{ background: c }} />
                ))}
              </span>
              <span className="theme-label">{t(locale, themeLabelKey[opt.id])}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card settings-card">
        <h2>{t(locale, "apiUrl")}</h2>
        <code className="api-code">{API_BASE_URL}</code>
        <p className="muted" style={{ marginTop: "0.65rem", marginBottom: 0 }}>
          {t(locale, "paperOnly")}
        </p>
      </section>
    </div>
  );
}
