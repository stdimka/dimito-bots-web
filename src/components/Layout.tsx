import { Link, NavLink, Outlet } from "react-router-dom";
import { LocaleSwitch } from "./LocaleSwitch";
import { useAuthStore } from "../stores/authStore";
import { useLocaleStore } from "../stores/localeStore";
import { t } from "../i18n";
import "./Layout.css";

export function Layout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const locale = useLocaleStore((s) => s.locale);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden />
            <span>
              <strong>{t(locale, "brand")}</strong>
              <small>{t(locale, "tagline")}</small>
            </span>
          </Link>
          <nav className="nav">
            <NavLink to="/" end>
              {t(locale, "catalog")}
            </NavLink>
            <NavLink to="/settings">{t(locale, "settings")}</NavLink>
          </nav>
          <div className="topbar-user">
            <LocaleSwitch compact />
            <span className="muted user-email">{user?.email}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
              {t(locale, "logout")}
            </button>
          </div>
        </div>
      </header>
      <main className="container main">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container muted">
          Dimito · paper-first · {locale.toUpperCase()}
        </div>
      </footer>
    </div>
  );
}
