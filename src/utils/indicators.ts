import { computeEma, resolveEmaPeriods } from "./ema";

export { computeEma, resolveEmaPeriods };

/** Wilder RSI (common trading definition). */
export function computeRsi(
  closes: number[],
  period = 14,
): (number | null)[] {
  const n = closes.length;
  const out: (number | null)[] = Array(n).fill(null);
  if (period < 2 || n < period + 1) return out;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) avgGain += d;
    else avgLoss -= d;
  }
  avgGain /= period;
  avgLoss /= period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < n; i++) {
    const d = closes[i] - closes[i - 1];
    const gain = d > 0 ? d : 0;
    const loss = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export function resolveLookback(params?: Record<string, unknown> | null): number {
  const p = params ?? {};
  const raw = Number(
    p.lookback ?? p.range_bars ?? p.n_bars ?? p.window ?? p.pocket_bars ?? 20,
  );
  if (!Number.isFinite(raw)) return 20;
  return Math.min(80, Math.max(5, Math.round(raw)));
}

export function resolveRsiPeriod(params?: Record<string, unknown> | null): number {
  const p = params ?? {};
  const raw = Number(p.rsi_period ?? p.rsi ?? 14);
  if (!Number.isFinite(raw)) return 14;
  return Math.min(50, Math.max(5, Math.round(raw)));
}

export type ChartOverlays = {
  ema: boolean;
  levels: boolean;
  volume: boolean;
  rsi: boolean;
};

/** Smart defaults so each bot opens with relevant layers. */
export function defaultOverlaysForStrategy(
  strategy?: string | null,
): ChartOverlays {
  const k = (strategy || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");

  const base: ChartOverlays = {
    ema: false,
    levels: false,
    volume: false,
    rsi: false,
  };

  if (
    k.includes("scalp") ||
    k.includes("ema") ||
    k.includes("momentum") ||
    k.includes("pulse") ||
    k.includes("micro_impulse")
  ) {
    base.ema = true;
  }
  if (
    k.includes("range") ||
    k.includes("sweep") ||
    k.includes("hunt") ||
    k.includes("pocket") ||
    k.includes("breakout") ||
    k.includes("liquidity") ||
    k.includes("squeeze") ||
    k.includes("gap")
  ) {
    base.levels = true;
  }
  if (
    k.includes("volume") ||
    k.includes("dry") ||
    k.includes("apex") ||
    k.includes("breakout")
  ) {
    base.volume = true;
  }
  if (
    k.includes("rsi") ||
    k.includes("diverg") ||
    k.includes("apex") ||
    k.includes("scalp") ||
    k.includes("vwap")
  ) {
    base.rsi = true;
  }

  // Fallback: always show something useful
  if (!base.ema && !base.levels && !base.volume && !base.rsi) {
    base.ema = true;
    base.levels = true;
  }
  return base;
}
