import { useMemo, useState, type MouseEvent } from "react";
import type { BotChartData, Candle, TradeMarker } from "../types/chart";
import { useLocaleStore } from "../stores/localeStore";
import { t } from "../i18n";
import "./BotPriceChart.css";

const HEIGHT = 300;
const PAD = { top: 18, right: 64, bottom: 36, left: 58 };

type Props = {
  data: BotChartData | null;
  loading?: boolean;
  accentColor?: string;
};

type HoverInfo = {
  x: number;
  y: number;
  candle: Candle;
  index: number;
};

function mapPriceToY(price: number, min: number, max: number, plotH: number) {
  if (max <= min) return plotH / 2;
  return plotH - ((price - min) / (max - min)) * plotH;
}

function mapTimeToX(t: number, tMin: number, tMax: number, plotW: number) {
  if (tMax <= tMin) return plotW / 2;
  return ((t - tMin) / (tMax - tMin)) * plotW;
}

function formatPrice(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) {
    return n.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (n >= 1) {
    return n.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  });
}

/** Scale from candles only (markers inside range expand slightly). Avoids empty top from outliers. */
function computePriceRange(candles: Candle[], markers: TradeMarker[]) {
  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  let minP = Math.min(...lows);
  let maxP = Math.max(...highs);

  // Soft-include trade markers only if near candle range (don't blow scale)
  const span0 = Math.max(maxP - minP, maxP * 0.002, 1e-8);
  for (const m of markers) {
    if (!Number.isFinite(m.price)) continue;
    if (m.price >= minP - span0 * 0.5 && m.price <= maxP + span0 * 0.5) {
      minP = Math.min(minP, m.price);
      maxP = Math.max(maxP, m.price);
    }
  }

  let span = maxP - minP;
  if (span <= 0 || !Number.isFinite(span)) {
    const mid = candles[candles.length - 1]?.c || 1;
    span = Math.abs(mid) * 0.01 || 1;
    minP = mid - span / 2;
    maxP = mid + span / 2;
  }

  // ~10% padding so wicks aren't glued to edges
  const pad = span * 0.1;
  minP -= pad;
  maxP += pad;
  return { minP, maxP };
}

function markerColor(m: TradeMarker): string {
  if (m.kind === "exit") {
    return (m.pnl_usdt ?? 0) >= 0 ? "#2e7d32" : "#c62828";
  }
  return m.side === "short" ? "#c62828" : "#2e7d32";
}

export function BotPriceChart({ data, loading, accentColor }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const accent = accentColor?.startsWith("#") ? accentColor : "#22333b";
  const [hover, setHover] = useState<HoverInfo | null>(null);

  const layout = useMemo(() => {
    if (!data?.candles?.length) return null;

    const width = 720;
    const plotW = width - PAD.left - PAD.right;
    const plotH = HEIGHT - PAD.top - PAD.bottom;
    const { minP, maxP } = computePriceRange(data.candles, data.markers ?? []);
    const tMin = data.candles[0].t;
    const tMax = data.candles[data.candles.length - 1].t;
    const n = data.candles.length;
    const step = n > 1 ? plotW / (n - 1) : plotW;
    const bodyW = Math.max(2.5, Math.min(9, step * 0.62));

    const toY = (p: number) => PAD.top + mapPriceToY(p, minP, maxP, plotH);
    const toX = (t: number) => PAD.left + mapTimeToX(t, tMin, tMax, plotW);

    const candleBars = data.candles.map((c: Candle, i: number) => {
      const x = toX(c.t);
      return {
        index: i,
        candle: c,
        x,
        yH: toY(c.h),
        yL: toY(c.l),
        yO: toY(c.o),
        yC: toY(c.c),
        bull: c.c >= c.o,
      };
    });

    // Soft area under close
    const areaPath = (() => {
      if (!candleBars.length) return "";
      const first = candleBars[0];
      const last = candleBars[candleBars.length - 1];
      const baseY = PAD.top + plotH;
      let d = `M ${first.x} ${baseY}`;
      for (const b of candleBars) d += ` L ${b.x} ${b.yC}`;
      d += ` L ${last.x} ${baseY} Z`;
      return d;
    })();

    const linePoints = candleBars.map((b) => `${b.x},${b.yC}`).join(" ");

    const markers = (data.markers ?? []).map((m) => {
      // clamp markers into plot if slightly outside
      const y = Math.min(
        Math.max(toY(m.price), PAD.top + 4),
        PAD.top + plotH - 4,
      );
      return {
        ...m,
        x: toX(m.t),
        y,
        color: markerColor(m),
      };
    });

    const last = data.candles[n - 1].c;
    const lastY = toY(last);
    const levels = 5;
    const priceLabels = Array.from({ length: levels }, (_, i) => {
      const p = maxP - ((maxP - minP) * i) / (levels - 1);
      return { p, y: toY(p) };
    });

    return {
      width,
      height: HEIGHT,
      plotW,
      plotH,
      candleBars,
      linePoints,
      areaPath,
      markers,
      last,
      lastY,
      priceLabels,
      bodyW,
      minP,
      maxP,
      step,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="chart card chart-empty">
        <span className="spinner" />
        <span className="muted">{t(locale, "chartLoading")}</span>
      </div>
    );
  }

  if (!data || !layout) {
    return (
      <div className="chart card chart-empty">
        <span className="muted">{t(locale, "chartNoData")}</span>
      </div>
    );
  }

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xSvg =
      ((e.clientX - rect.left) / rect.width) * layout.width;
    let best = layout.candleBars[0];
    let bestDist = Infinity;
    for (const bar of layout.candleBars) {
      const d = Math.abs(bar.x - xSvg);
      if (d < bestDist) {
        bestDist = d;
        best = bar;
      }
    }
    if (bestDist > layout.step * 1.2) {
      setHover(null);
      return;
    }
    setHover({
      x: best.x,
      y: best.yC,
      candle: best.candle,
      index: best.index,
    });
  };

  return (
    <section className="chart card">
      <div className="chart-head">
        <div>
          <strong>
            {data.symbol} · {data.timeframe}
          </strong>
          <span className="muted chart-sub">{t(locale, "chartTitle")}</span>
        </div>
        <div className="chart-last-wrap">
          <span className="chart-last-label">Last</span>
          <span className="chart-last" style={{ color: accent }}>
            {formatPrice(layout.last)}
          </span>
        </div>
      </div>

      <div className="chart-svg-wrap">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="chart-svg"
          role="img"
          aria-label={`${data.symbol} ${data.timeframe}`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* plot background */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={layout.plotW}
            height={layout.plotH}
            className="chart-plot-bg"
            rx={6}
          />

          {layout.priceLabels.map((pl) => (
            <g key={pl.p}>
              <line
                x1={PAD.left}
                y1={pl.y}
                x2={PAD.left + layout.plotW}
                y2={pl.y}
                className="chart-grid"
              />
              <text
                x={PAD.left - 8}
                y={pl.y + 3.5}
                className="chart-axis-label"
                textAnchor="end"
              >
                {formatPrice(pl.p)}
              </text>
            </g>
          ))}

          {/* area under price */}
          <path d={layout.areaPath} className="chart-area" fill={accent} />

          {/* candles */}
          {layout.candleBars.map((bar) => {
            const color = bar.bull ? "#1b8a3e" : "#d32f2f";
            const bodyTop = Math.min(bar.yO, bar.yC);
            const bodyH = Math.max(Math.abs(bar.yC - bar.yO), 1.5);
            const active = hover?.index === bar.index;
            return (
              <g key={bar.index} opacity={hover && !active ? 0.55 : 1}>
                <line
                  x1={bar.x}
                  y1={bar.yH}
                  x2={bar.x}
                  y2={bar.yL}
                  stroke={color}
                  strokeWidth={active ? 1.6 : 1.15}
                />
                <rect
                  x={bar.x - layout.bodyW / 2}
                  y={bodyTop}
                  width={layout.bodyW}
                  height={bodyH}
                  fill={color}
                  rx={0.6}
                />
              </g>
            );
          })}

          {/* close line */}
          <polyline
            points={layout.linePoints}
            fill="none"
            stroke={accent}
            strokeWidth={1.4}
            opacity={0.45}
          />

          {/* last price line */}
          <line
            x1={PAD.left}
            y1={layout.lastY}
            x2={PAD.left + layout.plotW}
            y2={layout.lastY}
            stroke={accent}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.55}
          />
          <rect
            x={PAD.left + layout.plotW + 4}
            y={layout.lastY - 9}
            width={54}
            height={18}
            rx={4}
            fill={accent}
          />
          <text
            x={PAD.left + layout.plotW + 31}
            y={layout.lastY + 3.5}
            textAnchor="middle"
            className="chart-last-tag"
          >
            {formatPrice(layout.last)}
          </text>

          {/* trade markers as triangles */}
          {layout.markers.map((m, i) => {
            const s = 7;
            if (m.kind === "entry") {
              // ▲ entry
              const points = `${m.x},${m.y - s} ${m.x - s * 0.85},${m.y + s * 0.55} ${m.x + s * 0.85},${m.y + s * 0.55}`;
              return (
                <g key={`m-${i}`}>
                  <polygon
                    points={points}
                    fill={m.color}
                    stroke="#fff"
                    strokeWidth={1.2}
                  />
                </g>
              );
            }
            // ▼ exit
            const points = `${m.x},${m.y + s} ${m.x - s * 0.85},${m.y - s * 0.55} ${m.x + s * 0.85},${m.y - s * 0.55}`;
            return (
              <g key={`m-${i}`}>
                <polygon
                  points={points}
                  fill={m.color}
                  stroke="#fff"
                  strokeWidth={1.2}
                />
              </g>
            );
          })}

          {/* hover crosshair + tooltip */}
          {hover ? (
            <g className="chart-hover">
              <line
                x1={hover.x}
                y1={PAD.top}
                x2={hover.x}
                y2={PAD.top + layout.plotH}
                className="chart-crosshair"
              />
              <circle
                cx={hover.x}
                cy={hover.y}
                r={4}
                fill={accent}
                stroke="#fff"
                strokeWidth={1.5}
              />
              {(() => {
                const c = hover.candle;
                const boxW = 128;
                const boxH = 78;
                let bx = hover.x + 12;
                if (bx + boxW > PAD.left + layout.plotW) bx = hover.x - boxW - 12;
                const by = Math.min(
                  Math.max(hover.y - boxH / 2, PAD.top + 4),
                  PAD.top + layout.plotH - boxH - 4,
                );
                const chg = c.c - c.o;
                const chgPct = c.o ? (chg / c.o) * 100 : 0;
                const chgColor = chg >= 0 ? "#1b8a3e" : "#d32f2f";
                return (
                  <g>
                    <rect
                      x={bx}
                      y={by}
                      width={boxW}
                      height={boxH}
                      rx={8}
                      className="chart-tip-bg"
                    />
                    <text x={bx + 10} y={by + 16} className="chart-tip-title">
                      O {formatPrice(c.o)}
                    </text>
                    <text x={bx + 10} y={by + 32} className="chart-tip-line">
                      H {formatPrice(c.h)}
                    </text>
                    <text x={bx + 10} y={by + 46} className="chart-tip-line">
                      L {formatPrice(c.l)}
                    </text>
                    <text x={bx + 10} y={by + 60} className="chart-tip-line">
                      C {formatPrice(c.c)}
                    </text>
                    <text
                      x={bx + boxW - 10}
                      y={by + 60}
                      textAnchor="end"
                      fill={chgColor}
                      className="chart-tip-chg"
                    >
                      {chgPct >= 0 ? "+" : ""}
                      {chgPct.toFixed(2)}%
                    </text>
                  </g>
                );
              })()}
            </g>
          ) : null}
        </svg>
      </div>

      <div className="chart-legend">
        <span>
          <i className="mark entry" /> {t(locale, "chartEntry")}
        </span>
        <span>
          <i className="mark exit-win" /> {t(locale, "chartExitWin")}
        </span>
        <span>
          <i className="mark exit-loss" /> {t(locale, "chartExitLoss")}
        </span>
        <span className="muted chart-hint">
          {locale === "ru" ? "Наведите на свечу — OHLC" : "Hover a candle for OHLC"}
        </span>
      </div>
    </section>
  );
}
