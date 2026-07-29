import { useState } from "react";
import { useLocaleStore } from "../stores/localeStore";
import {
  getCategoryLabel,
  getStrategyGuide,
  t,
} from "../i18n";
import "./StrategyGuidePanel.css";

type Props = {
  strategy: string;
  accentColor?: string;
};

export function StrategyGuidePanel({ strategy, accentColor }: Props) {
  const locale = useLocaleStore((s) => s.locale);
  const guide = getStrategyGuide(strategy, locale);
  const [open, setOpen] = useState(true);
  const accent = accentColor || "var(--primary)";

  if (!guide) {
    return (
      <section className="card guide-panel">
        <h2>{t(locale, "guideTitle")}</h2>
        <p className="muted">{t(locale, "guideMissing")}</p>
      </section>
    );
  }

  const categoryLabel = getCategoryLabel(guide.category, locale);

  return (
    <section className="card guide-panel">
      <button
        type="button"
        className="guide-header"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="guide-header-left">
          <h2>{t(locale, "guideTitle")}</h2>
          <span
            className="guide-cat"
            style={{
              background: `color-mix(in srgb, ${accent} 18%, transparent)`,
              color: accent.startsWith("#") ? accent : "var(--primary)",
            }}
          >
            {categoryLabel}
          </span>
        </div>
        <span className="muted guide-toggle">
          {open ? t(locale, "guideCollapse") : t(locale, "guideExpand")}{" "}
          {open ? "▴" : "▾"}
        </span>
      </button>

      {guide.short ? <p className="guide-short">{guide.short}</p> : null}

      {open ? (
        <div className="guide-body">
          <div className="guide-learn chart">
            <h3>{t(locale, "guideLookChart")}</h3>
            <p>{guide.lookOnChart}</p>
          </div>

          <div className="guide-learn do">
            <h3>{t(locale, "guideWhatToDo")}</h3>
            <p>{guide.whatToDo}</p>
          </div>

          <h3>{t(locale, "guideIdea")}</h3>
          <p>{guide.idea}</p>

          <h3>{t(locale, "guideHow")}</h3>
          <ol>
            {guide.how.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <h3>{t(locale, "guideLong")}</h3>
          <p>{guide.longSignal}</p>

          <h3>{t(locale, "guideShort")}</h3>
          <p>{guide.shortSignal}</p>

          <h3>{t(locale, "guideRisks")}</h3>
          <p className="guide-risk">{guide.risks}</p>

          <h3>{t(locale, "guideWatch")}</h3>
          <p>{guide.watch}</p>

          <div className="guide-tip">
            <strong style={{ color: accent.startsWith("#") ? accent : undefined }}>
              {t(locale, "guidePaperTip")}
            </strong>
            <p>{guide.paperTip}</p>
          </div>

          <p className="guide-disclaimer muted">{t(locale, "guideDisclaimer")}</p>
        </div>
      ) : null}
    </section>
  );
}
