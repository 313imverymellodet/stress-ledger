/* ============================================================
   STRESS LEDGER — shared presentational widgets
   ============================================================ */
import React from 'react';
import { SEVERITIES } from '../data.js';

// severity-mix bar: shows what share of a person's score is mild / tense / meltdown
export function HeatMeter({ mix, total }) {
  if (!total) {
    return <div className="meter empty" role="img" aria-label="No incidents on file" />;
  }
  const segs = [
    { key: 'mild', cls: 'seg-mild' },
    { key: 'tense', cls: 'seg-tense' },
    { key: 'melt', cls: 'seg-melt' },
  ].filter(s => mix[s.key] > 0);
  const label =
    `Severity mix: ${mix.mild} mild, ${mix.tense} tense, ${mix.melt} meltdown points`;
  return (
    <div className="meter" role="img" aria-label={label}>
      {segs.map(s => (
        <i
          key={s.key}
          className={s.cls}
          style={{ width: (mix[s.key] / total) * 100 + '%' }}
          title={`${SEVERITIES[s.key].label}: ${mix[s.key]} pts`}
        />
      ))}
    </div>
  );
}

export function Trend({ kind, delta }) {
  const map = {
    worse:  { arrow: '↑', txt: 'getting worse' },
    easing: { arrow: '↓', txt: 'easing off' },
    steady: { arrow: '→', txt: 'holding steady' },
  };
  const m = map[kind];
  const d = delta > 0 ? `+${delta}` : `${delta}`;
  return (
    <span className={'trend ' + kind}>
      <b aria-hidden="true">{m.arrow}</b>
      {m.txt}
      {kind !== 'steady' ? ` ${d}` : ''}
    </span>
  );
}

// redacted run of blocks (case-number "evidence")
export function Redact({ n = 4 }) {
  return (
    <span className="redact" aria-label="redacted">
      {'█'.repeat(n)}
    </span>
  );
}

// severity glyph for the feed (+1 / +2 / +3)
export function SevMark({ sevKey }) {
  const sev = SEVERITIES[sevKey];
  return (
    <span className="entry-sev" style={{ color: sev.cssVar }}>
      +{sev.pts}
    </span>
  );
}

// the three quick-log buttons used on each card (variant="dark" for the banner)
export function LogButtons({ onLog, name, variant }) {
  return (
    <div className={'log-row' + (variant === 'dark' ? ' log-row--dark' : '')}>
      <button className="logbtn mild" onClick={() => onLog('mild')} aria-label={`Log a Mild incident for ${name}`}>
        <span className="lbl">Mild</span>
        <span className="pts">+1</span>
      </button>
      <button className="logbtn tense" onClick={() => onLog('tense')} aria-label={`Log a Tense incident for ${name}`}>
        <span className="lbl">Tense</span>
        <span className="pts">+2</span>
      </button>
      <button className="logbtn melt" onClick={() => onLog('melt')} aria-label={`Log a Meltdown incident for ${name}`}>
        <span className="lbl">Meltdown</span>
        <span className="pts">+3</span>
      </button>
    </div>
  );
}

// ---- nav icons (simple line glyphs) ---------------------------------------
export function IconLedger() {
  return (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 12h6M9 15.5h6M9 8.5h2" />
    </svg>
  );
}
export function IconPatterns() {
  return (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}
