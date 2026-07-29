import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import type { BotChartData, Candle, TradeMarker } from "../types/chart";
import { useLocaleStore } from "../stores/localeStore";
import { t } from "../i18n";
import {
  computeEma,
  computeRsi,
  defaultOverlaysForStrategy,
  resolveEmaPeriods,
  resolveLookback,
  resolveRsiPeriod,
  type ChartOverlays,
} from "../utils/indicators";
import "./BotPriceChart.css";

const PAD = { top: 14, right: 58, bottom: 12, left: 52 };
const MAIN_H = 210;
const VOL_H = 54;
const RSI_H = 58;
const GAP = 8;

const EMA_FAST_COLOR = "#2563eb";
const EMA_SLOW_COLOR = "#d97706";
const LEVEL_COLOR = "#7c3aed";
const RSI_COLOR = "#0d9488";

type Props = {
  data: BotChartData | null;
  loading?: boolean;
  accentColor?: string;
  botParams?: Record<string, unknown> | null;
  strategy?: string | null;
};

type HoverInfo = {
  x: number;
  index: number;
  candle: Candle;
  emaFast: number | null;
  emaSlow: number | null;
  rsi: number | null;
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

function computePriceRange(
  candles: Candle[],
  markers: TradeMarker[],
  extra: number[] = [],
) {
  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  let minP = Math.min(...lows);
  let maxP = Math.max(...highs);
  const span0 = Math.max(maxP - minP, maxP * 0.002, 1e-8);
  for (const m of markers) {
    if (!Number.isFinite(m.price)) continue;
    if (m.price >= minP - span0 * 0.5 && m.price <= maxP + span0 * 0.5) {
      minP = Math.min(minP, m.price);
      maxP = Math.max(maxP, m.price);
    }
  }
  for (const p of extra) {
    if (!Number.isFinite(p)) continue;
    if (p >= minP - span0 && p <= maxP + span0) {
      minP = Math.min(minP, p);
      maxP = Math.max(maxP, p);
    }
  }
  let span = maxP - minP;
  if (span <= 0 || !Number.isFinite(span)) {
    const mid = candles[candles.length - 1]?.c || 1;
    span = Math.abs(mid) * 0.01 || 1;
    minP = mid - span / 2;
    maxP = mid + span / 2;
  }
  const pad = span * 0.1;
  return { minP: minP - pad, maxP: maxP + pad };
}

function markerColor(m: TradeMarker): string {
  if (m.kind === "exit") {
    return (m.pnl_usdt ?? 0) >= 0 ? "#2e7d32" : "#c62828";
  }
  return m.side === "short" ? "#c62828" : "#2e7d32";
}

function pathFromSeries(
  values: (number | null)[],
  candles: Candle[],
  toX: (t: number) => number,
  toY: (p: number) => number,
): string {
  const parts: string[] = [];
  let drawing = false;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v == null || !Number.isFinite(v)) {
      drawing = false;
      continue;
    }
    const cmd = drawing ? "L" : "M";
    parts.push(`${cmd} ${toX(candles[i].t)} ${toY(v)}`);
    drawing = true;
  }
  return parts.join(" ");
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`chart-chip${active ? " active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export function BotPriceChart({
  data,
  loading,
  accentColor,
  botParams,
  strategy,
}: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const accent = accentColor?.startsWith("#") ? accentColor : "#22333b";
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [ov, setOv] = useState<ChartOverlays>(() =>
    defaultOverlaysForStrategy(strategy),
  );

  useEffect(() => {
    setOv(defaultOverlaysForStrategy(strategy));
  }, [strategy]);

  const periods = useMemo(() => resolveEmaPeriods(botParams), [botParams]);
  const lookback = useMemo(() => resolveLookback(botParams), [botParams]);
  const rsiPeriod = useMemo(() => resolveRsiPeriod(botParams), [botParams]);

  const layout = useMemo(() => {
    if (!data?.candles?.length) return null;

    const candles = data.candles;
    const n = candles.length;
    const closes = candles.map((c) => c.c);
    const emaFast = computeEma(closes, periods.fast);
    const emaSlow = computeEma(closes, periods.slow);
    const rsi = computeRsi(closes, rsiPeriod);

    const emaVals = [...emaFast, ...emaSlow].filter(
      (v): v is number => v != null && Number.isFinite(v),
    );

    // Lookback high/low on last N bars (the "box")
    const lb = Math.min(lookback, n);
    const slice = candles.slice(n - lb);
    const rangeHigh = Math.max(...slice.map((c) => c.h));
    const rangeLow = Math.min(...slice.map((c) => c.l));
    const rangeStartT = slice[0].t;
    const rangeEndT = slice[slice.length - 1].t;

    const volPane = ov.volume;
    const rsiPane = ov.rsi;
    const mainH = MAIN_H;
    const volH = volPane ? VOL_H : 0;
    const rsiH = rsiPane ? RSI_H : 0;
    const width = 720;
    const plotW = width - PAD.left - PAD.right;
    const totalH =
      PAD.top +
      mainH +
      (volPane ? GAP + volH : 0) +
      (rsiPane ? GAP + rsiH : 0) +
      PAD.bottom +
      18;

    const mainTop = PAD.top;
    const rsiTopFixed =
      mainTop + mainH + (volPane ? GAP + volH : 0) + (rsiPane ? GAP : 0);

    const { minP, maxP } = computePriceRange(
      candles,
      data.markers ?? [],
      ov.ema ? emaVals : [],
    );

    const tMin = candles[0].t;
    const tMax = candles[n - 1].t;
    const step = n > 1 ? plotW / (n - 1) : plotW;
    const bodyW = Math.max(2.5, Math.min(9, step * 0.62));

    const toY = (p: number) =>
      mainTop + mapPriceToY(p, minP, maxP, mainH);
    const toX = (t: number) => PAD.left + mapTimeToX(t, tMin, tMax, plotW);

    const candleBars = candles.map((c, i) => ({
      index: i,
      candle: c,
      x: toX(c.t),
      yH: toY(c.h),
      yL: toY(c.l),
      yO: toY(c.o),
      yC: toY(c.c),
      bull: c.c >= c.o,
      emaFast: emaFast[i],
      emaSlow: emaSlow[i],
      rsi: rsi[i],
      vol: c.v ?? 0,
    }));

    const maxVol = Math.max(...candleBars.map((b) => b.vol), 1e-9);

    const areaPath = (() => {
      if (!candleBars.length) return "";
      const first = candleBars[0];
      const last = candleBars[candleBars.length - 1];
      const baseY = mainTop + mainH;
      let d = `M ${first.x} ${baseY}`;
      for (const b of candleBars) d += ` L ${b.x} ${b.yC}`;
      d += ` L ${last.x} ${baseY} Z`;
      return d;
    })();

    const emaFastPath = pathFromSeries(emaFast, candles, toX, toY);
    const emaSlowPath = pathFromSeries(emaSlow, candles, toX, toY);

    const toRsiY = (v: number) =>
      rsiTopFixed + mapPriceToY(v, 0, 100, rsiH);
    const rsiPath = pathFromSeries(
      rsi,
      candles,
      toX,
      (v) => toRsiY(v),
    );

    const markers = (data.markers ?? []).map((m) => {
      const y = Math.min(
        Math.max(toY(m.price), mainTop + 4),
        mainTop + mainH - 4,
      );
      return { ...m, x: toX(m.t), y, color: markerColor(m) };
    });

    const crosses: { x: number; y: number; up: boolean }[] = [];
    if (ov.ema) {
      for (let i = 1; i < n; i++) {
        const a0 = emaFast[i - 1];
        const b0 = emaSlow[i - 1];
        const a1 = emaFast[i];
        const b1 = emaSlow[i];
        if (a0 == null || b0 == null || a1 == null || b1 == null) continue;
        const before = a0 - b0;
        const after = a1 - b1;
        if (before < 0 && after > 0) {
          crosses.push({ x: toX(candles[i].t), y: toY(a1), up: true });
        } else if (before > 0 && after < 0) {
          crosses.push({ x: toX(candles[i].t), y: toY(a1), up: false });
        }
      }
    }

    const last = closes[n - 1];
    const lastY = toY(last);
    const levels = 4;
    const priceLabels = Array.from({ length: levels }, (_, i) => {
      const p = maxP - ((maxP - minP) * i) / (levels - 1);
      return { p, y: toY(p) };
    });

    const box = {
      x1: toX(rangeStartT),
      x2: toX(rangeEndT),
      yHigh: toY(rangeHigh),
      yLow: toY(rangeLow),
      high: rangeHigh,
      low: rangeLow,
    };

    return {
      width,
      height: totalH,
      plotW,
      mainH,
      mainTop,
      volTop: mainTop + mainH + GAP,
      rsiTop: rsiTopFixed,
      volH,
      rsiH,
      candleBars,
      areaPath,
      emaFastPath,
      emaSlowPath,
      rsiPath,
      markers,
      crosses,
      last,
      lastY,
      priceLabels,
      bodyW,
      step,
      periods,
      lookback: lb,
      rsiPeriod,
      box,
      maxVol,
      toRsiY,
    };
  }, [data, periods, lookback, rsiPeriod, ov]);

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

  const toggle = (key: keyof ChartOverlays) =>
    setOv((prev) => ({ ...prev, [key]: !prev[key] }));

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xSvg = ((e.clientX - rect.left) / rect.width) * layout.width;
    let best = layout.candleBars[0];
    let bestDist = Infinity;
    for (const bar of layout.candleBars) {
      const d = Math.abs(bar.x - xSvg);
      if (d < bestDist) {
        bestDist = d;
        best = bar;
      }
    }
    if (bestDist > layout.step * 1.25) {
      setHover(null);
      return;
    }
    setHover({
      x: best.x,
      index: best.index,
      candle: best.candle,
      emaFast: best.emaFast,
      emaSlow: best.emaSlow,
      rsi: best.rsi,
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

      <div className="chart-chips" role="group" aria-label="Chart overlays">
        <ToggleChip active={ov.ema} onClick={() => toggle("ema")}>
          {t(locale, "chartShowEma")} {periods.fast}/{periods.slow}
        </ToggleChip>
        <ToggleChip active={ov.levels} onClick={() => toggle("levels")}>
          {t(locale, "chartShowLevels")} ({layout.lookback})
        </ToggleChip>
        <ToggleChip active={ov.volume} onClick={() => toggle("volume")}>
          {t(locale, "chartShowVolume")}
        </ToggleChip>
        <ToggleChip active={ov.rsi} onClick={() => toggle("rsi")}>
          {t(locale, "chartShowRsi")} {layout.rsiPeriod}
        </ToggleChip>
      </div>

      <div className="chart-svg-wrap">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="chart-svg"
          role="img"
          aria-label={`${data.symbol} chart`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {/* Main plot bg */}
          <rect
            x={PAD.left}
            y={layout.mainTop}
            width={layout.plotW}
            height={layout.mainH}
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

          {/* Range box + levels */}
          {ov.levels ? (
            <g className="chart-levels">
              <rect
                x={layout.box.x1}
                y={layout.box.yHigh}
                width={Math.max(2, layout.box.x2 - layout.box.x1)}
                height={Math.max(2, layout.box.yLow - layout.box.yHigh)}
                fill={LEVEL_COLOR}
                opacity={0.08}
                stroke={LEVEL_COLOR}
                strokeWidth={1}
                strokeDasharray="4 3"
              />
              <line
                x1={PAD.left}
                y1={layout.box.yHigh}
                x2={PAD.left + layout.plotW}
                y2={layout.box.yHigh}
                stroke={LEVEL_COLOR}
                strokeWidth={1.2}
                strokeDasharray="5 4"
                opacity={0.75}
              />
              <line
                x1={PAD.left}
                y1={layout.box.yLow}
                x2={PAD.left + layout.plotW}
                y2={layout.box.yLow}
                stroke={LEVEL_COLOR}
                strokeWidth={1.2}
                strokeDasharray="5 4"
                opacity={0.75}
              />
              <text
                x={PAD.left + layout.plotW - 4}
                y={layout.box.yHigh - 4}
                textAnchor="end"
                className="chart-level-label"
                fill={LEVEL_COLOR}
              >
                H {formatPrice(layout.box.high)}
              </text>
              <text
                x={PAD.left + layout.plotW - 4}
                y={layout.box.yLow + 12}
                textAnchor="end"
                className="chart-level-label"
                fill={LEVEL_COLOR}
              >
                L {formatPrice(layout.box.low)}
              </text>
            </g>
          ) : null}

          <path d={layout.areaPath} className="chart-area" fill={accent} />

          {layout.candleBars.map((bar) => {
            const color = bar.bull ? "#1b8a3e" : "#d32f2f";
            const bodyTop = Math.min(bar.yO, bar.yC);
            const bodyH = Math.max(Math.abs(bar.yC - bar.yO), 1.5);
            const active = hover?.index === bar.index;
            return (
              <g key={bar.index} opacity={hover && !active ? 0.5 : 1}>
                <line
                  x1={bar.x}
                  y1={bar.yH}
                  x2={bar.x}
                  y2={bar.yL}
                  stroke={color}
                  strokeWidth={active ? 1.6 : 1.1}
                />
                <rect
                  x={bar.x - layout.bodyW / 2}
                  y={bodyTop}
                  width={layout.bodyW}
                  height={bodyH}
                  fill={color}
                  rx={0.5}
                />
              </g>
            );
          })}

          {ov.ema && layout.emaSlowPath ? (
            <path
              d={layout.emaSlowPath}
              fill="none"
              stroke={EMA_SLOW_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ) : null}
          {ov.ema && layout.emaFastPath ? (
            <path
              d={layout.emaFastPath}
              fill="none"
              stroke={EMA_FAST_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ) : null}
          {ov.ema &&
            layout.crosses.map((c, i) => (
              <circle
                key={`x-${i}`}
                cx={c.x}
                cy={c.y}
                r={3.5}
                fill={c.up ? EMA_FAST_COLOR : EMA_SLOW_COLOR}
                stroke="#fff"
                strokeWidth={1}
              />
            ))}

          <line
            x1={PAD.left}
            y1={layout.lastY}
            x2={PAD.left + layout.plotW}
            y2={layout.lastY}
            stroke={accent}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.5}
          />
          <rect
            x={PAD.left + layout.plotW + 4}
            y={layout.lastY - 8}
            width={50}
            height={16}
            rx={4}
            fill={accent}
          />
          <text
            x={PAD.left + layout.plotW + 29}
            y={layout.lastY + 3}
            textAnchor="middle"
            className="chart-last-tag"
          >
            {formatPrice(layout.last)}
          </text>

          {layout.markers.map((m, i) => {
            const s = 6.5;
            const points =
              m.kind === "entry"
                ? `${m.x},${m.y - s} ${m.x - s * 0.85},${m.y + s * 0.55} ${m.x + s * 0.85},${m.y + s * 0.55}`
                : `${m.x},${m.y + s} ${m.x - s * 0.85},${m.y - s * 0.55} ${m.x + s * 0.85},${m.y - s * 0.55}`;
            return (
              <polygon
                key={`m-${i}`}
                points={points}
                fill={m.color}
                stroke="#fff"
                strokeWidth={1.1}
              />
            );
          })}

          {/* Volume pane */}
          {ov.volume ? (
            <g>
              <rect
                x={PAD.left}
                y={layout.volTop}
                width={layout.plotW}
                height={layout.volH}
                className="chart-plot-bg"
                rx={4}
              />
              <text
                x={PAD.left + 4}
                y={layout.volTop + 11}
                className="chart-pane-title"
              >
                Vol
              </text>
              {layout.candleBars.map((bar) => {
                const h = (bar.vol / layout.maxVol) * (layout.volH - 6);
                return (
                  <rect
                    key={`v-${bar.index}`}
                    x={bar.x - layout.bodyW / 2}
                    y={layout.volTop + layout.volH - h}
                    width={layout.bodyW}
                    height={Math.max(1, h)}
                    fill={bar.bull ? "#1b8a3e99" : "#d32f2f99"}
                  />
                );
              })}
            </g>
          ) : null}

          {/* RSI pane */}
          {ov.rsi ? (
            <g>
              <rect
                x={PAD.left}
                y={layout.rsiTop}
                width={layout.plotW}
                height={layout.rsiH}
                className="chart-plot-bg"
                rx={4}
              />
              <text
                x={PAD.left + 4}
                y={layout.rsiTop + 11}
                className="chart-pane-title"
              >
                RSI {layout.rsiPeriod}
              </text>
              {/* 30 / 70 bands */}
              <line
                x1={PAD.left}
                y1={layout.toRsiY(70)}
                x2={PAD.left + layout.plotW}
                y2={layout.toRsiY(70)}
                stroke="#d32f2f"
                strokeWidth={1}
                opacity={0.35}
                strokeDasharray="3 3"
              />
              <line
                x1={PAD.left}
                y1={layout.toRsiY(30)}
                x2={PAD.left + layout.plotW}
                y2={layout.toRsiY(30)}
                stroke="#1b8a3e"
                strokeWidth={1}
                opacity={0.35}
                strokeDasharray="3 3"
              />
              <line
                x1={PAD.left}
                y1={layout.toRsiY(50)}
                x2={PAD.left + layout.plotW}
                y2={layout.toRsiY(50)}
                stroke="#888"
                strokeWidth={1}
                opacity={0.25}
              />
              {layout.rsiPath ? (
                <path
                  d={layout.rsiPath}
                  fill="none"
                  stroke={RSI_COLOR}
                  strokeWidth={1.6}
                  strokeLinecap="round"
                />
              ) : null}
              <text
                x={PAD.left - 6}
                y={layout.toRsiY(70) + 3}
                textAnchor="end"
                className="chart-axis-label"
              >
                70
              </text>
              <text
                x={PAD.left - 6}
                y={layout.toRsiY(30) + 3}
                textAnchor="end"
                className="chart-axis-label"
              >
                30
              </text>
            </g>
          ) : null}

          {/* Hover */}
          {hover ? (
            <g>
              <line
                x1={hover.x}
                y1={layout.mainTop}
                x2={hover.x}
                y2={
                  layout.mainTop +
                  layout.mainH +
                  (ov.volume ? GAP + layout.volH : 0) +
                  (ov.rsi ? GAP + layout.rsiH : 0)
                }
                className="chart-crosshair"
              />
              {(() => {
                const c = hover.candle;
                const tipLines: { label: string; val: string; fill?: string; title?: boolean }[] = [
                  { label: "O", val: formatPrice(c.o), title: true },
                  { label: "H", val: formatPrice(c.h) },
                  { label: "L", val: formatPrice(c.l) },
                ];
                const chg = c.c - c.o;
                const chgPct = c.o ? (chg / c.o) * 100 : 0;
                tipLines.push({
                  label: "C",
                  val: `${formatPrice(c.c)} ${chgPct >= 0 ? "+" : ""}${chgPct.toFixed(2)}%`,
                  fill: chg >= 0 ? "#1b8a3e" : "#d32f2f",
                });
                if (ov.ema) {
                  tipLines.push({
                    label: `E${periods.fast}`,
                    val: hover.emaFast != null ? formatPrice(hover.emaFast) : "—",
                    fill: EMA_FAST_COLOR,
                  });
                  tipLines.push({
                    label: `E${periods.slow}`,
                    val: hover.emaSlow != null ? formatPrice(hover.emaSlow) : "—",
                    fill: EMA_SLOW_COLOR,
                  });
                }
                if (ov.rsi) {
                  tipLines.push({
                    label: "RSI",
                    val: hover.rsi != null ? hover.rsi.toFixed(1) : "—",
                    fill: RSI_COLOR,
                  });
                }
                if (ov.volume && c.v != null) {
                  tipLines.push({ label: "Vol", val: String(Math.round(c.v)) });
                }
                const boxH = 12 + tipLines.length * 15;
                const boxW = 148;
                let bx = hover.x + 12;
                if (bx + boxW > PAD.left + layout.plotW)
                  bx = hover.x - boxW - 12;
                const by = layout.mainTop + 8;
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
                    {tipLines.map((row, i) => (
                      <text
                        key={`${row.label}-${i}`}
                        x={bx + 10}
                        y={by + 14 + i * 15}
                        className={row.title ? "chart-tip-title" : "chart-tip-line"}
                        fill={row.fill || (row.title ? undefined : "#c8c8c8")}
                      >
                        {row.label} {row.val}
                      </text>
                    ))}
                  </g>
                );
              })()}
            </g>
          ) : null}
        </svg>
      </div>

      <div className="chart-legend">
        {ov.ema ? (
          <>
            <span>
              <i className="line fast" /> EMA {periods.fast}
            </span>
            <span>
              <i className="line slow" /> EMA {periods.slow}
            </span>
          </>
        ) : null}
        {ov.levels ? (
          <span>
            <i className="line levels" /> {t(locale, "chartLevelsLegend")}{" "}
            {layout.lookback}
          </span>
        ) : null}
        {ov.volume ? <span>{t(locale, "chartShowVolume")}</span> : null}
        {ov.rsi ? (
          <span>
            <i className="line rsi" /> RSI {layout.rsiPeriod}
          </span>
        ) : null}
        <span>
          <i className="mark entry" /> {t(locale, "chartEntry")}
        </span>
        <span className="muted chart-hint">{t(locale, "chartOverlayHint")}</span>
      </div>
    </section>
  );
}
