/* ============================================================
   STRESS LEDGER — person "case file" detail view
   Tap a coworker → their timeline, signature triggers, mix.
   ============================================================ */
import React, { useState, useEffect, useRef } from 'react';
import { SEVERITIES, TRIGGER_LABEL, relativeTime, personTriggers } from '../data.js';
import { HeatMeter, Trend, LogButtons, SevMark } from './widgets.jsx';

export function PersonDetail({ person, rank, incidents, now, onClose, onLog, onStrike, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(person ? person.name : '');
  const [confirmDel, setConfirmDel] = useState(false);
  const closeRef = useRef(null);

  // reset transient UI when a different person opens
  useEffect(() => {
    if (person) setName(person.name);
    setEditing(false);
    setConfirmDel(false);
  }, [person && person.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape closes; focus the back button on open
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => closeRef.current && closeRef.current.focus(), 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [onClose]);

  if (!person) return null;

  const theirs = incidents.filter(i => i.coworkerId === person.id);
  const trigs = personTriggers(person.id, incidents);
  const tmax = Math.max(1, ...trigs.map(t => t.count));
  const sevCounts = theirs.reduce((a, i) => ((a[i.severity] = (a[i.severity] || 0) + 1), a), {});
  const firstName = person.name.split(/[\s,]/)[0];

  function saveName() {
    const v = name.trim();
    if (v) onRename(person.id, v);
    else setName(person.name);
    setEditing(false);
  }

  return (
    <div className="detail" role="dialog" aria-modal="true" aria-label={`Case file: ${person.name}`}>
      <div className="detail-bar">
        <button ref={closeRef} className="detail-back" onClick={onClose} aria-label="Back to the ledger">
          ‹ <span>The Ledger</span>
        </button>
        <span className="detail-caseno">CASE FILE</span>
      </div>

      <div className="detail-scroll">
        <div className="detail-hero">
          <div className="detail-rankseal"><b>{String(rank).padStart(2, '0')}</b><i>RANKED</i></div>

          {editing ? (
            <form className="detail-rename" onSubmit={e => { e.preventDefault(); saveName(); }}>
              <input
                autoFocus
                className="detail-name-input"
                value={name}
                maxLength={40}
                onChange={e => setName(e.target.value)}
                onBlur={saveName}
                aria-label="Edit name"
              />
            </form>
          ) : (
            <button className="detail-name" onClick={() => setEditing(true)} title="Tap to rename">
              {person.name}<span className="edit-hint">edit</span>
            </button>
          )}
          <div className="detail-epithet">{person.epithet}</div>

          <div className="detail-stats">
            <div className="detail-score"><b>{person.score}</b><span>stress<br />points</span></div>
            <Trend kind={person.trend} delta={person.trendDelta} />
          </div>

          <HeatMeter mix={person.mix} total={person.score} />
          <div className="mix-legend">
            <span><i className="dot-mild" />{sevCounts.mild || 0} mild</span>
            <span><i className="dot-tense" />{sevCounts.tense || 0} tense</span>
            <span><i className="dot-melt" />{sevCounts.melt || 0} meltdown</span>
          </div>

          <LogButtons name={person.name} variant="dark" onLog={sev => onLog(person, sev)} />
        </div>

        {trigs.length > 0 && (
          <div className="panel">
            <div className="panel-title">Signature triggers</div>
            <div className="panel-sub">What {firstName} does to you</div>
            {trigs.slice(0, 6).map(t => (
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
        )}

        <div className="section-head">
          <div className="section-title">Timeline</div>
          <div className="section-meta">{theirs.length} on file</div>
        </div>
        <div className="feed">
          {theirs.length === 0 ? (
            <div className="feed-empty">Nothing on file yet. Suspiciously clean.</div>
          ) : (
            theirs.map(inc => {
              const sev = SEVERITIES[inc.severity];
              const tl = inc.trigger ? TRIGGER_LABEL[inc.trigger] : null;
              return (
                <div className="entry" key={inc.id}>
                  <SevMark sevKey={inc.severity} />
                  <div className="entry-body">
                    <div className="entry-line">{tl ? tl : `${sev.label}, unspecified`}</div>
                    <div className="entry-meta"><span>{relativeTime(inc.timestamp, now)}</span></div>
                  </div>
                  <button className="entry-undo" onClick={() => onStrike(inc.id)} aria-label="Strike this incident">
                    strike
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="records">
          {confirmDel ? (
            <div className="confirm-bar danger-confirm" role="alertdialog" aria-label={`Delete ${person.name}?`}>
              <span className="confirm-q">
                Close <strong>{person.name}</strong>’s file for good? Erases {person.count} incident
                {person.count === 1 ? '' : 's'}.
              </span>
              <div className="confirm-actions">
                <button className="cf-no" onClick={() => setConfirmDel(false)}>Keep</button>
                <button className="cf-yes" onClick={() => onDelete(person.id)}>Strike</button>
              </div>
            </div>
          ) : (
            <button className="danger-btn" onClick={() => setConfirmDel(true)}>
              Strike {firstName} from the record
            </button>
          )}
        </div>
        <div className="spacer" />
      </div>
    </div>
  );
}
