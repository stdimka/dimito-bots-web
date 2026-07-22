import type { Locale } from "./types";

type PhraseRule = {
  pattern: RegExp;
  en: string | ((match: string, ...groups: string[]) => string);
};

/** Longest / most specific phrases first — avoids partial replacements like «Бот stopped». */
const LOG_PHRASE_RULES: PhraseRule[] = [
  {
    pattern: /Подключено к логам в реальном времени/gi,
    en: "Connected to real-time logs",
  },
  {
    pattern: /Бот (.+?) \((.+?)\) запущен \[(.+?)\]/g,
    en: (_m, name, strategy, mode) =>
      `Bot ${name} (${strategy}) started [${mode}]`,
  },
  {
    pattern: /Бот (.+?) запущен \((.+?)\)/g,
    en: (_m, name, strategy) => `Bot ${name} started (${strategy})`,
  },
  {
    pattern: /Бот (.+?) остановлен/g,
    en: (_m, name) => `Bot ${name} stopped`,
  },
  {
    pattern: /Бот остановлен/g,
    en: "Bot stopped",
  },
  {
    pattern: /🔄 Открытая позиция синхронизирована с Binance/g,
    en: "🔄 Open position synced with Binance",
  },
  {
    pattern: /⏹ Закрыта позиция на Binance без бота: (.+)/g,
    en: (_m, rest) => `⏹ Position closed on Binance without bot: ${rest}`,
  },
  {
    pattern: /📥 Открыта (.+?) @ ([\d.]+)/g,
    en: (_m, side, price) => `📥 Opened ${side} @ ${price}`,
  },
  {
    pattern: /📤 Закрыта (.+?) @ ([\d.]+)/g,
    en: (_m, side, price) => `📤 Closed ${side} @ ${price}`,
  },
  {
    pattern: /PnL:\s*([+\-−]?\d+(?:[.,]\d+)?)\s*USDT/gi,
    en: (_m, pnl) => `PnL: ${pnl} USDT`,
  },
  {
    pattern: /комисси[яи]\s*([+\-−]?\d+(?:[.,]\d+)?)/gi,
    en: (_m, fee) => `fee ${fee}`,
  },
  {
    pattern: /Ошибка анализа:/g,
    en: "Analysis error:",
  },
  {
    pattern: /Бот не открывает новые сделки/g,
    en: "Bot is not opening new trades",
  },
  {
    pattern: /лимит открытых paper-ботов/gi,
    en: "paper open-bots limit",
  },
  {
    pattern: /Открыта позиция/gi,
    en: "Position opened",
  },
  {
    pattern: /Закрыта позиция/gi,
    en: "Position closed",
  },
  {
    pattern: /позиция закрыта/gi,
    en: "position closed",
  },
  {
    pattern: /тейк-профит/gi,
    en: "take profit",
  },
  {
    pattern: /стоп-лосс/gi,
    en: "stop loss",
  },
  {
    pattern: /по сигналу/gi,
    en: "by signal",
  },
  {
    pattern: /Ошибка:/g,
    en: "Error:",
  },
  {
    pattern: /Сигнал/g,
    en: "Signal",
  },
  {
    pattern: /Цена/g,
    en: "Price",
  },
  {
    pattern: /нейтральный/gi,
    en: "neutral",
  },
  {
    pattern: /лонг/gi,
    en: "long",
  },
  {
    pattern: /шорт/gi,
    en: "short",
  },
  {
    pattern: /запущен/gi,
    en: "started",
  },
  {
    pattern: /остановлен/gi,
    en: "stopped",
  },
];

function applyRule(text: string, rule: PhraseRule): string {
  if (typeof rule.en === "string") {
    return text.replace(rule.pattern, rule.en);
  }
  const replacer = rule.en;
  return text.replace(rule.pattern, (match, ...rest) => {
    const groups = rest.slice(0, -2).map(String);
    return replacer(match, ...groups);
  });
}

export function translateLogMessage(message: string, locale: Locale): string {
  if (locale === "ru" || !message) return message;

  let result = message;
  for (const rule of LOG_PHRASE_RULES) {
    // Fresh flags each pass (global regex lastIndex)
    rule.pattern.lastIndex = 0;
    result = applyRule(result, rule);
  }
  return result;
}