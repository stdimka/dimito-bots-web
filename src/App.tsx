import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { HomePage } from "./pages/HomePage";
import { BotDetailPage } from "./pages/BotDetailPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useAuthStore } from "./stores/authStore";
import { useLocaleStore } from "./stores/localeStore";
import { applyThemeToDom, useThemeStore } from "./stores/themeStore";
import { t } from "./i18n";

function Protected({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const hydrated = useAuthStore((s) => s.hydrated);
  const locale = useLocaleStore((s) => s.locale);

  if (!hydrated) {
    return (
      <div className="empty" style={{ minHeight: "100vh" }}>
        <span className="spinner" /> {t(locale, "loading")}
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const themeId = useThemeStore((s) => s.themeId);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    applyThemeToDom(themeId);
  }, [themeId]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          element={
            <Protected>
              <Layout />
            </Protected>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/bots/:id" element={<BotDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
