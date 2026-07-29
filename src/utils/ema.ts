/** Standard EMA (same idea as TA-Lib / common trading libraries). */
export function computeEma(
  closes: number[],
  period: number,
): (number | null)[] {
  const n = closes.length;
  const out: (number | null)[] = Array(n).fill(null);
  if (period < 1 || n === 0) return out;
  if (n < period) {
    // not enough bars — still smooth from first close for short series
    let ema = closes[0];
    out[0] = ema;
    const k = 2 / (period + 1);
    for (let i = 1; i < n; i++) {
      ema = closes[i] * k + ema * (1 - k);
      out[i] = ema;
    }
    return out;
  }

  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  let ema = sum / period;
  out[period - 1] = ema;
  const k = 2 / (period + 1);
  for (let i = period; i < n; i++) {
    ema = closes[i] * k + ema * (1 - k);
    out[i] = ema;
  }
  return out;
}

export function resolveEmaPeriods(
  params?: Record<string, unknown> | null,
): { fast: number; slow: number } {
  const p = params ?? {};
  const num = (v: unknown, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 2 && n <= 200 ? Math.round(n) : fallback;
  };
  let fast = num(
    p.ema_fast ?? p.ema_short ?? p.fast_period ?? p.fast,
    9,
  );
  let slow = num(
    p.ema_slow ?? p.ema_long ?? p.slow_period ?? p.slow,
    21,
  );
  if (fast > slow) {
    const t = fast;
    fast = slow;
    slow = t;
  }
  if (fast === slow) slow = fast + 12;
  return { fast, slow };
}
