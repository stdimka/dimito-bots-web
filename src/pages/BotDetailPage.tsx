import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchBotLogs, fetchBotTrades } from "../api/bots";
import { fetchBotChart } from "../api/chart";
import { connectBotLogs, type WsStatus } from "../api/logsWs";
import { BotPriceChart } from "../components/BotPriceChart";
import { StrategyGuidePanel } from "../components/StrategyGuidePanel";
import { useBotsStore } from "../stores/botsStore";
import { useLocaleStore } from "../stores/localeStore";
import type { BotLog, BotTrade } from "../types/bot";
import type { BotChartData } from "../types/chart";
import { getBotDescription, t, translateLogMessage } from "../i18n";
import { formatPnl, formatPct, formatTime } from "../utils/format";
import "./BotDetailPage.css";

const MAX_LOGS = 80;

function mergeLog(prev: BotLog[], log: BotLog): BotLog[] {
  const key = `${log.timestamp ?? ""}|${log.message}|${log.type}`;
  if (prev.some((p) => `${p.timestamp ?? ""}|${p.message}|${p.type}` === key)) {
    return prev;
  }
  return [log, ...prev].slice(0, MAX_LOGS);
}

export function BotDetailPage() {
  const { id } = useParams();
  const botId = Number(id);
  const locale = useLocaleStore((s) => s.locale);
  const bots = useBotsStore((s) => s.bots);
  const fetchBots = useBotsStore((s) => s.fetchBots);
  const toggleBot = useBotsStore((s) => s.toggleBot);
  const togglingId = useBotsStore((s) => s.togglingId);
  const storeError = useBotsStore((s) => s.error);

  const bot = bots.find((b) => b.id === botId);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [chart, setChart] = useState<BotChartData | null>(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");

  useEffect(() => {
    if (!bots.length) void fetchBots();
  }, [bots.length, fetchBots]);

  useEffect(() => {
    if (!botId) return;
    let cancelled = false;
    (async () => {
      setLoadingExtra(true);
      setChartLoading(true);
      try {
        const [l, tr, ch] = await Promise.all([
          fetchBotLogs(botId),
          fetchBotTrades(botId),
          fetchBotChart(botId, 80).catch(() => null),
        ]);
        if (!cancelled) {
          // newest first for live feed UX
          const sorted = [...l].reverse().slice(0, MAX_LOGS);
          setLogs(sorted);
          setTrades(tr.slice(0, 40));
          setChart(ch);
        }
      } catch {
        if (!cancelled) {
          setLogs([]);
          setTrades([]);
          setChart(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingExtra(false);
          setChartLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [botId]);

  // Refresh chart while bot is running
  useEffect(() => {
    if (!botId || !bot || bot.status !== "running") return;
    const id = window.setInterval(() => {
      void fetchBotChart(botId, 80)
        .then(setChart)
        .catch(() => undefined);
      void fetchBots();
    }, 20000);
    return () => window.clearInterval(id);
  }, [botId, bot?.status, fetchBots]);

  const onLiveLog = useCallback((log: BotLog) => {
    if (log.bot_id != null && Number(log.bot_id) !== botId) return;
    setLogs((prev) => mergeLog(prev, { ...log, bot_id: botId }));
  }, [botId]);

  useEffect(() => {
    if (!botId || Number.isNaN(botId)) return;
    return connectBotLogs(botId, onLiveLog, setWsStatus);
  }, [botId, onLiveLog]);

  if (!bot) {
    return (
      <div className="empty">
        {loadingExtra || !bots.length ? (
          <>
            <span className="spinner" /> {t(locale, "loading")}
          </>
        ) : (
          <>
            <p>Bot #{botId} not found</p>
            <Link to="/" className="btn btn-primary">
              {t(locale, "back")}
            </Link>
          </>
        )}
      </div>
    );
  }

  const pnl = bot.profitNet ?? bot.profit;
  const busy = togglingId === bot.id;
  const statusLabel =
    bot.status === "running"
      ? t(locale, "running")
      : bot.status === "error"
        ? t(locale, "error")
        : t(locale, "stopped");
  const badgeClass =
    bot.status === "running"
      ? "badge-running"
      : bot.status === "error"
        ? "badge-error"
        : "badge-stopped";

  const liveLabel =
    wsStatus === "connected"
      ? t(locale, "liveLogsConnected")
      : wsStatus === "connecting"
        ? t(locale, "liveLogsConnecting")
        : wsStatus === "reconnecting"
          ? t(locale, "liveLogsReconnecting")
          : t(locale, "liveLogsOffline");

  return (
    <div className="detail">
      <Link to="/" className="back-link">
        ← {t(locale, "back")}
      </Link>

      <section className="detail-hero card">
        <div className="detail-hero-top">
          <div>
            <div className="bot-badges" style={{ marginBottom: "0.5rem" }}>
              <span className={`badge ${badgeClass}`}>{statusLabel}</span>
              <span className="badge badge-paper">{t(locale, "paper")}</span>
            </div>
            <h1>{bot.name}</h1>
            <p className="muted">
              {bot.strategy} · {bot.symbol || bot.pair} · {bot.timeframe}
            </p>
          </div>
          <button
            type="button"
            className={`btn ${bot.status === "running" ? "btn-danger" : "btn-primary"}`}
            disabled={busy}
            onClick={() => void toggleBot(bot.id)}
          >
            {busy ? <span className="spinner" /> : null}
            {bot.status === "running" ? t(locale, "stop") : t(locale, "start")}
          </button>
        </div>
        <p className="detail-desc">
          {getBotDescription(bot.strategy, locale, bot.description)}
        </p>
        {storeError ? <div className="error-box">{storeError}</div> : null}

        <div className="detail-stats">
          <div>
            <span className="muted">{t(locale, "profit")}</span>
            <strong className={pnl >= 0 ? "profit-pos" : "profit-neg"}>
              {formatPnl(pnl)}
            </strong>
          </div>
          <div>
            <span className="muted">{t(locale, "trades")}</span>
            <strong>{bot.trades}</strong>
          </div>
          <div>
            <span className="muted">{t(locale, "winRate")}</span>
            <strong>{formatPct(bot.winRate)}</strong>
          </div>
          <div>
            <span className="muted">{t(locale, "balance")}</span>
            <strong>{(bot.paperBalance ?? 1000).toFixed(2)}</strong>
          </div>
          <div>
            <span className="muted">{t(locale, "fees")}</span>
            <strong>{(bot.totalFeesUsdt ?? 0).toFixed(4)}</strong>
          </div>
        </div>

        {bot.openPosition ? (
          <div className="open-pos">
            <strong>{t(locale, "openPos")}</strong>
            <span>
              {bot.openPosition.side} · entry {bot.openPosition.entryPrice} · mark{" "}
              {bot.openPosition.markPrice} · qty {bot.openPosition.quantity}
            </span>
            {bot.unrealizedPnl != null ? (
              <span className={bot.unrealizedPnl >= 0 ? "profit-pos" : "profit-neg"}>
                uPnL {formatPnl(bot.unrealizedPnl)}
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      <BotPriceChart
        data={chart}
        loading={chartLoading}
        accentColor={bot.color}
      />

      <StrategyGuidePanel strategy={bot.strategy} accentColor={bot.color} />

      <div className="detail-cols">
        <section className="card detail-panel">
          <h2>{t(locale, "trades")}</h2>
          {loadingExtra ? (
            <div className="empty">
              <span className="spinner" />
            </div>
          ) : trades.length === 0 ? (
            <p className="muted">{t(locale, "noTrades")}</p>
          ) : (
            <ul className="list">
              {trades.map((tr, i) => {
                const p = Number(tr.pnl_net ?? tr.pnl ?? 0);
                return (
                  <li key={String(tr.id ?? i)}>
                    <span>
                      {String(tr.side ?? "—")} ·{" "}
                      {formatTime(String(tr.closed_at ?? tr.opened_at ?? ""))}
                    </span>
                    <strong className={p >= 0 ? "profit-pos" : "profit-neg"}>
                      {formatPnl(p)}
                    </strong>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card detail-panel">
          <div className="logs-head">
            <h2>{t(locale, "logs")}</h2>
            <span className={`ws-pill ws-${wsStatus}`} title={t(locale, "liveLogs")}>
              <span className="ws-dot" aria-hidden />
              {liveLabel}
            </span>
          </div>
          {loadingExtra && logs.length === 0 ? (
            <div className="empty">
              <span className="spinner" />
            </div>
          ) : logs.length === 0 ? (
            <p className="muted">{t(locale, "noLogs")}</p>
          ) : (
            <ul className="list logs">
              {logs.map((log, i) => (
                <li key={`${log.timestamp ?? ""}-${i}`} className={`log-${log.type}`}>
                  <span className="muted log-time">{formatTime(log.timestamp)}</span>
                  <span>{translateLogMessage(log.message, locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
