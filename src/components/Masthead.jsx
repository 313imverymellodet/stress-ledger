/* ============================================================
   STRESS LEDGER — masthead (translucent iOS nav bar)
   Carries the brand + the three header stats.
   ============================================================ */
import React from 'react';

export function Masthead({ caseNo, stats }) {
  return (
    <header className="masthead">
      <div className="mast-top">
        <div>
          <div className="mast-title">STRESS <span className="red">LEDGER</span></div>
          <div className="mast-sub">Personal Incident Record</div>
        </div>
        <div className="conf-stamp">Confidential</div>
      </div>

      <div className="mast-stats" aria-label="Summary statistics">
        <span className="ms"><b>{stats.thisWeek}</b> this week</span>
        <span className="sep" aria-hidden="true">·</span>
        <span className="ms"><b>{stats.total}</b> filed</span>
        <span className="sep" aria-hidden="true">·</span>
        <span className="ms"><b>{stats.points}</b> pts</span>
        <span className="mast-case-no">CASE NO. {caseNo}</span>
      </div>
    </header>
  );
}
