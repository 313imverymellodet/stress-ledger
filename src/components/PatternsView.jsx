/* ============================================================
   STRESS LEDGER — Patterns view
   When stress lands · top triggers · worst weekday
   ============================================================ */
import React from 'react';
import { DAYS, TIME_BLOCKS, heatColor } from '../data.js';

function fmtAvg(v) {
  return Math.round(v * 10) / 10;
}

export function PatternsView({ patterns, peakLabel }) {
  const { grid, gmax, triggers, tmax, dayAvg, dmax, worstDay, total, meltdowns } = patterns;
  const topTriggers = triggers.slice(0, 6);

  if (total === 0) {
    return (
      <div className="scroll">
        <div className="panel patterns-empty">
          <div className="panel-title">Nothing to chart… yet</div>
          <div className="panel-sub">The record is spotless.</div>
          <p className="panel-cap">
            File a grievance or two over on <b>The Ledger</b> and the patterns surface here — when stress lands,
            what sets it off, and which weekday you should brace for.
          </p>
        </div>
        <div className="spacer" />
      </div>
    );
  }

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
        <div className="panel-sub">All week · by time of day</div>
        <div className="heatmap">
          {DAYS.map((d, di) => (
            <div className="heat-row" key={d}>
              <div className="heat-daylbl">{d}</div>
              {grid[di].map((v, bi) => (
                <div
                  className="heat-cell"
                  key={bi}
                  style={
                    v > 0
                      ? {
                          background: heatColor(v / gmax),
                          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.25)',
                          opacity: 0.35 + 0.65 * (v / gmax),
                        }
                      : undefined
                  }
                  title={`${d} · ${TIME_BLOCKS[bi].full} · ${v} pts`}
                />
              ))}
            </div>
          ))}
          <div className="heat-axis">
            <span />
            {TIME_BLOCKS.map(b => (
              <span key={b.id} title={b.full}>{b.short}</span>
            ))}
          </div>
        </div>
        <div className="legend">
          <span>calm</span><div className="bar" /><span>meltdown</span>
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
              <div className="trig-fill" style={{ width: Math.max(8, (t.count / tmax) * 100) + '%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* worst day of the week */}
      <div className="panel">
        <div className="panel-title">Worst day of the week</div>
        <div className="panel-sub">Average stress points by weekday</div>
        <div className="days">
          {DAYS.map((d, i) => {
            const isWorst = i === worstDay && dayAvg[i] > 0;
            const h = Math.max(5, (dayAvg[i] / dmax) * 100);
            return (
              <div className={'day' + (isWorst ? ' worst' : '')} key={d}>
                <div
                  className="day-bar"
                  style={{
                    height: h + '%',
                    background: isWorst
                      ? 'linear-gradient(180deg,var(--t-melt),var(--ink-deep))'
                      : 'linear-gradient(180deg,#4a3c2b,#332a1e)',
                  }}
                >
                  {isWorst && <div className="worst-stamp">Worst</div>}
                  <div className="day-val">{fmtAvg(dayAvg[i])}</div>
                </div>
                <div className="day-lbl">{d}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="spacer" />
    </div>
  );
}
