/* ============================================================
   STRESS LEDGER — shared components
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;

// thermometer meter on each ledger card
function HeatMeter({ value }){
  return (
    <div className="meter">
      <i style={{ width: Math.max(6, value * 100) + '%' }}></i>
      <div className="meter-ticks">
        {Array.from({ length: 8 }).map((_, i) => <span key={i}></span>)}
      </div>
    </div>
  );
}

function Trend({ kind, delta }){
  const map = {
    worse:  { arrow: '\u2191', txt: 'getting worse' },
    easing: { arrow: '\u2193', txt: 'easing off' },
    steady: { arrow: '\u2192', txt: 'holding steady' },
  };
  const m = map[kind];
  const d = delta > 0 ? `+${delta}` : `${delta}`;
  return (
    <span className={'trend ' + kind}>
      <b>{m.arrow}</b>{m.txt}{kind !== 'steady' ? ` ${d}` : ''}
    </span>
  );
}

// redacted run of blocks (case numbers, "evidence")
function Redact({ n = 4 }){
  return <span className="redact" aria-label="redacted">{'\u2588'.repeat(n)}</span>;
}

// severity glyph for the feed (+1 / +2 / +3)
function SevMark({ sevKey }){
  const sev = SEVERITIES[sevKey];
  return <span className="entry-sev" style={{ color: sev.cssVar }}>+{sev.pts}</span>;
}

// the three quick-log buttons used on each card
function LogButtons({ onLog }){
  return (
    <div className="log-row">
      <button className="logbtn mild"  onClick={() => onLog('mild')}>
        <span className="lbl">Mild</span><span className="pts">+1</span>
      </button>
      <button className="logbtn tense" onClick={() => onLog('tense')}>
        <span className="lbl">Tense</span><span className="pts">+2</span>
      </button>
      <button className="logbtn melt"  onClick={() => onLog('melt')}>
        <span className="lbl">Meltdown</span><span className="pts">+3</span>
      </button>
    </div>
  );
}

// ---- icons (simple line glyphs) -------------------------------------------
function IconLedger({ on }){
  return (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/>
      <path d="M9 12h6M9 15.5h6M9 8.5h2"/>
    </svg>
  );
}
function IconPatterns(){
  return (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

// ============================================================
//  STAMP OVERLAY — the hero moment
// ============================================================
function StampLayer({ stamp }){
  // stamp: null | { sevKey, pts, caseNo, time, seq }
  if (!stamp) return null;
  const sev = SEVERITIES[stamp.sevKey];
  return (
    <div className="stamp-layer live" key={stamp.seq}>
      <div className="splat go" style={{ background: `radial-gradient(circle, ${sev.cssVar}33, transparent 62%)` }}></div>
      <div className="stamp go" style={{ '--rot': stamp.rot + 'deg', color: sev.cssVar, borderColor: sev.cssVar, boxShadow: `inset 0 0 0 2px ${sev.cssVar}59` }}>
        <span className="s-perf" style={{ borderColor: sev.cssVar + '66' }}></span>
        <div className="s-sev">{sev.label}</div>
        <div className="s-pts">+{sev.pts} pts</div>
        <div className="s-filed" style={{ borderColor: sev.cssVar }}>Filed</div>
        <div className="s-meta">NO. {stamp.caseNo} · {stamp.time}</div>
      </div>
    </div>
  );
}

Object.assign(window, {
  HeatMeter, Trend, Redact, SevMark, LogButtons,
  IconLedger, IconPatterns, StampLayer,
});
