/* ============================================================
   STRESS LEDGER — "Filed" stamp overlay (the hero moment)
   ============================================================ */
import React from 'react';
import { SEVERITIES } from '../data.js';

export function StampLayer({ stamp }) {
  // stamp: null | { sevKey, seq, rot, caseNo, time }
  if (!stamp) return null;
  const sev = SEVERITIES[stamp.sevKey];
  return (
    <div className="stamp-layer live" key={stamp.seq} aria-hidden="true">
      <div className="splat go" style={{ background: `radial-gradient(circle, ${sev.cssVar}33, transparent 62%)` }} />
      <div
        className="stamp go"
        style={{
          '--rot': stamp.rot + 'deg',
          color: sev.cssVar,
          borderColor: sev.cssVar,
          boxShadow: `inset 0 0 0 2px ${sev.cssVar}59`,
        }}
      >
        <span className="s-perf" style={{ borderColor: sev.cssVar + '66' }} />
        <div className="s-sev">{sev.label}</div>
        <div className="s-pts">+{sev.pts} pts</div>
        <div className="s-filed" style={{ borderColor: sev.cssVar }}>Filed</div>
        <div className="s-meta">NO. {stamp.caseNo} · {stamp.time}</div>
      </div>
    </div>
  );
}
