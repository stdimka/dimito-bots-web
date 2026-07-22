import type { Locale } from "./types";
import {
  BOT_DESCRIPTIONS_EN,
  normalizeDescriptionKey,
} from "./botDescriptions";
import { getStrategyGuide } from "./strategyGuides";

/**
 * Localized short description for catalog cards + detail teaser.
 * Prefer educational strategy guide short text (RU/EN), then EN map, then API fallback.
 */
export function getBotDescription(
  strategy: string,
  locale: Locale,
  fallback?: string,
): string {
  const guide = getStrategyGuide(strategy, locale);
  if (guide?.short) return guide.short;

  if (fallback) {
    const key = normalizeDescriptionKey(fallback);
    if (locale === "en" && BOT_DESCRIPTIONS_EN[key]) {
      return BOT_DESCRIPTIONS_EN[key];
    }
    if (locale === "en") {
      // Still Russian from backend — better than nothing if no map entry
      return BOT_DESCRIPTIONS_EN[key] ?? fallback;
    }
    return fallback;
  }

  return locale === "en"
    ? `${strategy} strategy (paper)`
    : `Стратегия ${strategy} (paper)`;
}
