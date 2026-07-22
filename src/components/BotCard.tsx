import { Link } from "react-router-dom";
import type { Bot } from "../types/bot";
import { useLocaleStore } from "../stores/localeStore";
import { useBotsStore } from "../stores/botsStore";
import { getBotDescription, getCategoryLabel, getStrategyGuide, t } from "../i18n";
import { formatPnl, formatPct } from "../utils/format";
import "./BotCard.css";

export function BotCard({ bot }: { bot: Bot }) {
  const locale = useLocaleStore((s) => s.locale);
  const toggleBot = useBotsStore((s) => s.toggleBot);
  const togglingId = useBotsStore((s) => s.togglingId);
  const busy = togglingId === bot.id;
  const pnl = bot.profitNet ?? bot.profit;
  const desc = getBotDescription(bot.strategy, locale, bot.description);
  const guide = getStrategyGuide(bot.strategy, locale);
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

  return (
    <article className="bot-card card">
      <div className="bot-card-accent" style={{ background: bot.color || "#22333B" }} />
      <div className="bot-card-body">
        <div className="bot-card-head">
          <div>
            <Link to={`/bots/${bot.id}`} className="bot-name">
              {bot.name}
            </Link>
            <div className="bot-meta muted">
              {bot.strategy} · {bot.symbol || bot.pair} · {bot.timeframe}
            </div>
          </div>
          <div className="bot-badges">
            <span className={`badge ${badgeClass}`}>{statusLabel}</span>
            <span className="badge badge-paper">{t(locale, "paper")}</span>
            {guide ? (
              <span className="badge badge-paper">
                {getCategoryLabel(guide.category, locale)}
              </span>
            ) : null}
          </div>
        </div>

        {desc ? <p className="bot-desc">{desc}</p> : null}

        <div className="bot-stats">
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
            <strong>{(bot.paperBalance ?? 1000).toFixed(0)}</strong>
          </div>
        </div>

        <div className="bot-actions">
          <Link to={`/bots/${bot.id}`} className="btn btn-ghost btn-sm">
            →
          </Link>
          <button
            type="button"
            className={`btn btn-sm ${bot.status === "running" ? "btn-danger" : "btn-primary"}`}
            disabled={busy}
            onClick={() => void toggleBot(bot.id)}
          >
            {busy ? <span className="spinner" /> : null}
            {bot.status === "running" ? t(locale, "stop") : t(locale, "start")}
          </button>
        </div>
      </div>
    </article>
  );
}
