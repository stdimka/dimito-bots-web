import { useLocaleStore } from "../stores/localeStore";
import "./LocaleSwitch.css";

type Props = {
  compact?: boolean;
};

export function LocaleSwitch({ compact }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <div className={`locale-switch${compact ? " compact" : ""}`} role="group" aria-label="Language">
      <button
        type="button"
        className={locale === "ru" ? "active" : ""}
        onClick={() => setLocale("ru")}
      >
        RU
      </button>
      <button
        type="button"
        className={locale === "en" ? "active" : ""}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
    </div>
  );
}
