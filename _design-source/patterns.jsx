/* ============================================================
   STRESS LEDGER — Patterns view
   When stress lands · top triggers · worst day of the week
   ============================================================ */

function PatternsView({ patterns, peakLabel }){
  const { grid, gmax, triggers, tmax, dayTotals, dmax, worstDay, total, meltdowns } = patterns;
  const topTriggers = triggers.slice(0, 6);

  return (
    <div className="scroll">
      {/* headline stats */}
      <div className="stat-strip">
        <div className="stat">
          <b>{total}</b><span className="u">pts</span>
          <span>logged, all time</span>
        </div>
        <div className="stat">
          <b>{meltdowns}</b><span className="u">×</span>
          <span>full meltdowns</span>
        </div>
        <div className="stat">
          <b>{DAYS[worstDay]}</b>
          <span style={{ marginTop: 14 }}>your worst weekday</span>
        </div>
      </div>

      {/* time-of-day heatmap */}
      <div className="panel">
        <div className="panel-title">When stress lands</div>
        <div className="panel-sub">Mon–Fri · 8am → 8pm</div>
        <div className="heatmap">
          {DAYS.map((d, di) => (
            <div className="heat-row" key={d}>
              <div className="heat-daylbl">{d}</div>
              {grid[di].map((v, bi) => (
                <div className="heat-cell" key={bi}
                  style={ v > 0 ? {
                    background: heatColor(v / gmax),
                    boxShadow: `inset 0 0 0 1px rgba(0,0,0,.25)`,
                    opacity: 0.35 + 0.65 * (v / gmax),
                  } : undefined }
                  title={`${d} · ${HOUR_BUCKETS[bi].lbl} · ${v} pts`}></div>
              ))}
            </div>
          ))}
          <div className="heat-axis">
            <span></span>
            {HOUR_BUCKETS.map(b => <span key={b.lbl}>{b.lbl}</span>)}
          </div>
        </div>
        <div className="legend">
          <span>calm</span><div className="bar"></div><span>meltdown</span>
        </div>
        <div className="panel-cap">Peak danger window: {peakLabel}. Consider a wall, or a door.</div>
      </div>

      {/* top triggers */}
      <div className="panel">
        <div className="panel-title">What sets it off</div>
        <div className="panel-sub">Top triggers, by frequency</div>
        {topTriggers.map(t => (
          <div className="trig" key={t.id}>
            <div className="trig-head">
              <span className="trig-label">{t.label}</span>
              <span className="trig-count">{t.count}</span>
            </div>
            <div className="trig-track">
              <div className="trig-fill" style={{ width: Math.max(8, (t.count / tmax) * 100) + '%' }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* worst day of the week */}
      <div className="panel">
        <div className="panel-title">Worst day of the week</div>
        <div className="panel-sub">Total stress points by weekday</div>
        <div className="days">
          {DAYS.map((d, i) => {
            const isWorst = i === worstDay;
            const h = Math.max(5, (dayTotals[i] / dmax) * 100);
            return (
              <div className={'day' + (isWorst ? ' worst' : '')} key={d}>
                <div className="day-bar" style={{
                  height: h + '%',
                  background: isWorst
                    ? 'linear-gradient(180deg,var(--t-melt),var(--ink-deep))'
                    : 'linear-gradient(180deg,#4a3c2b,#332a1e)',
                }}>
                  {isWorst && <div className="worst-stamp">Worst</div>}
                  <div className="day-val">{dayTotals[i]}</div>
                </div>
                <div className="day-lbl">{d}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="spacer"></div>
    </div>
  );
}

Object.assign(window, { PatternsView });
