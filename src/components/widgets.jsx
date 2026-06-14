/* ============================================================
   STRESS LEDGER — shared presentational widgets
   ============================================================ */
import React from 'react';
import { SEVERITIES } from '../data.js';

// thermometer meter on each ledger card
export function HeatMeter({ value }) {
  return (
    <div className="meter" role="img" aria-label={`Stress heat ${Math.round(value * 100)}%`}>
      <i style={{ width: Math.max(6, value * 100) + '%' }} />
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

// the three quick-log buttons used on each card
export function LogButtons({ onLog, name }) {
  return (
    <div className="log-row">
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
