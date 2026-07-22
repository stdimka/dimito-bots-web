import type { DashboardOverview } from "../types/bot";
import { useLocaleStore } from "../stores/localeStore";
import { t } from "../i18n";
import { formatPnl } from "../utils/format";
import "./DashboardSummary.css";

export function DashboardSummary({ data }: { data: DashboardOverview | null }) {
  const locale = useLocaleStore((s) => s.locale);
  if (!data) return null;
  const pnl = data.total_profit ?? 0;

  return (
    <section className="dash card">
      <h2>{t(locale, "overview")}</h2>
      <div className="dash-grid">
        <div>
          <span className="muted">{t(locale, "botsTotal")}</span>
          <strong>{data.total_bots}</strong>
        </div>
        <div>
          <span className="muted">{t(locale, "runningCount")}</span>
          <strong>{data.running_count}</strong>
        </div>
        <div>
          <span className="muted">{t(locale, "totalPnl")}</span>
          <strong className={pnl >= 0 ? "profit-pos" : "profit-neg"}>
            {formatPnl(pnl)}
          </strong>
        </div>
        <div>
          <span className="muted">{t(locale, "totalTrades")}</span>
          <strong>{data.total_trades}</strong>
        </div>
      </div>
    </section>
  );
}
