/** English translations keyed by normalized Russian description from the backend. */
export const BOT_DESCRIPTIONS_EN: Record<string, string> = {
  "ROC + SMA + RSI: импульс тренда.": "ROC + SMA + RSI: trend momentum.",
  "EMA + RSI на 1m для быстрых сделок.": "EMA + RSI on 1m for fast trades.",
  "Scalper EMA+RSI на 1m (ETH) — сравнение с BTC.":
    "Scalper EMA+RSI on 1m (ETH) — comparison with BTC.",
  "Scalper EMA+RSI на 1m (SOL) — сравнение с BTC.":
    "Scalper EMA+RSI on 1m (SOL) — comparison with BTC.",
  "Pin Bar и Engulfing с выходом по NEUTRAL.":
    "Pin Bar and Engulfing with exit on NEUTRAL.",
  "Микровозврат после длинной свечи на 1m.":
    "Micro rebound after a long candle on 1m.",
  "Реакция на прокол уровня ликвидности.":
    "Reaction to a liquidity level sweep.",
  "Свежая дивергенция RSI на 15m (ETH).":
    "Fresh RSI divergence on 15m (ETH).",
  "Пробой после сжатия BB/Keltner.":
    "Breakout after BB/Keltner squeeze.",
  "Пробой после засыхания объёма.":
    "Breakout after volume dry-up.",
  "Только пересечение EMA 9/21 на 5m.":
    "EMA 9/21 crossover only on 5m.",
  "Пробой диапазона 10 свечей на 5m.":
    "Breakout of a 10-candle range on 5m.",
  "Микровозврат 1m ETH (crypto_pyth).":
    "Micro rebound 1m ETH (crypto_pyth).",
  "Микровозврат 1m SOL.": "Micro rebound 1m SOL.",
  "Sweep Reaction на 1m ETH.": "Sweep Reaction on 1m ETH.",
  "Контр-вход после перегрева импульса.":
    "Counter-entry after impulse overheating.",
  "Скальпер по срыву ликвидности в стакане.":
    "Scalper on order-book liquidity sweep.",
  "Ложный пробой диапазона.": "False range breakout.",
  "Эхо-отскок после импульса.": "Echo rebound after impulse.",
  "Ловушка микроимпульса.": "Micro-impulse trap.",
  "Ликвидностная дыра в стакане.": "Liquidity gap in the order book.",
  "Тройное совпадение: Bollinger + RSI + разворотная свеча с объёмом (фильтр боковика ADX). R:R 1:2 на 5m.":
    "Triple confluence: Bollinger + RSI + reversal candle with volume (ADX sideways filter). R:R 1:2 on 5m.",
  "Apex Confluence на 5m ETH — сравнение с BTC.":
    "Apex Confluence on 5m ETH — comparison with BTC.",
  "Apex Confluence на 5m SOL — чуть шире SL/TP под волатильность.":
    "Apex Confluence on 5m SOL — slightly wider SL/TP for volatility.",
  "Apex Confluence на 5m TRX — альт с умеренным риском.":
    "Apex Confluence on 5m TRX — alt with moderate risk.",
};

export function normalizeDescriptionKey(text: string): string {
  return text.replace(/\s*\(#\d+\)\.?/g, "").replace(/\s+/g, " ").trim();
}