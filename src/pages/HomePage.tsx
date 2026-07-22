import { useEffect, useMemo, useState } from "react";
import { BotCard } from "../components/BotCard";
import { DashboardSummary } from "../components/DashboardSummary";
import { useBotsStore } from "../stores/botsStore";
import { useLocaleStore } from "../stores/localeStore";
import { t } from "../i18n";
import "./HomePage.css";

export function HomePage() {
  const locale = useLocaleStore((s) => s.locale);
  const bots = useBotsStore((s) => s.bots);
  const dashboard = useBotsStore((s) => s.dashboard);
  const loading = useBotsStore((s) => s.loading);
  const error = useBotsStore((s) => s.error);
  const fetchBots = useBotsStore((s) => s.fetchBots);

  const [q, setQ] = useState("");
  const [onlyRunning, setOnlyRunning] = useState(false);

  useEffect(() => {
    void fetchBots();
    const id = window.setInterval(() => void fetchBots(), 20000);
    return () => window.clearInterval(id);
  }, [fetchBots]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return bots.filter((b) => {
      if (onlyRunning && b.status !== "running") return false;
      if (!needle) return true;
      return (
        b.name.toLowerCase().includes(needle) ||
        b.strategy.toLowerCase().includes(needle) ||
        (b.symbol || "").toLowerCase().includes(needle)
      );
    });
  }, [bots, q, onlyRunning]);

  return (
    <div className="home">
      <div className="home-head">
        <div>
          <h1>{t(locale, "catalog")}</h1>
          <p className="muted">{t(locale, "paperOnly")}</p>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => void fetchBots()}
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : null}
          {t(locale, "refresh")}
        </button>
      </div>

      <DashboardSummary data={dashboard} />

      <div className="toolbar card">
        <input
          className="search"
          placeholder={t(locale, "search")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="filter-pills">
          <button
            type="button"
            className={!onlyRunning ? "pill active" : "pill"}
            onClick={() => setOnlyRunning(false)}
          >
            {t(locale, "all")}
          </button>
          <button
            type="button"
            className={onlyRunning ? "pill active" : "pill"}
            onClick={() => setOnlyRunning(true)}
          >
            {t(locale, "onlyRunning")}
          </button>
        </div>
      </div>

      {error ? <div className="error-box" style={{ marginBottom: "1rem" }}>{error}</div> : null}

      {loading && bots.length === 0 ? (
        <div className="empty">
          <span className="spinner" /> {t(locale, "loading")}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">{t(locale, "emptyBots")}</div>
      ) : (
        <div className="bot-grid">
          {filtered.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      )}
    </div>
  );
}
