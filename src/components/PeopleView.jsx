/* ============================================================
   STRESS LEDGER — People view ("The Ledger")
   Reigning banner · add coworker · ledger cards · feed · reset
   ============================================================ */
import React, { useState } from 'react';
import { SEVERITIES, TRIGGER_LABEL, quipFor, relativeTime } from '../data.js';
import { HeatMeter, Trend, Redact, SevMark, LogButtons } from './widgets.jsx';

function ReignBanner({ person, hasPeople }) {
  // empty: no coworkers at all
  if (!hasPeople) {
    return (
      <div className="reign empty">
        <div className="reign-kicker">The ledger is open<span className="line" /></div>
        <div className="reign-name sm">No one on file… yet</div>
        <div className="reign-epithet">
          Name the coworker living rent-free in your head. We’ll open a case file and start keeping score.
        </div>
      </div>
    );
  }
  // people exist but nobody has any points yet
  if (!person || person.score === 0) {
    return (
      <div className="reign empty">
        <div className="reign-kicker">No crown yet<span className="line" /></div>
        <div className="reign-name sm">Nobody’s earned it</div>
        <div className="reign-epithet">
          Tap <b>Mild</b>, <b>Tense</b>, or <b>Meltdown</b> on a card below to file the first incident.
        </div>
      </div>
    );
  }
  return (
    <div className="reign">
      <div className="reign-kicker">Reigning stressor<span className="line" /></div>
      <div className="seal"><b>1</b><i>RANKED</i></div>
      <div className="reign-name">{person.name}</div>
      <div className="reign-epithet">{person.epithet}</div>
      <div className="reign-row">
        <div className="reign-score">
          <b>{person.score}</b>
          <span>stress<br />points</span>
        </div>
        <div className="reign-quip">{quipFor(person.id)}</div>
      </div>
    </div>
  );
}

function AddCoworker({ onAdd }) {
  const [name, setName] = useState('');
  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName('');
  }
  return (
    <form className="add-row" onSubmit={submit}>
      <input
        className="add-input"
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Add a name to the ledger…"
        aria-label="New coworker name"
        maxLength={40}
        autoComplete="off"
      />
      <button className="add-btn" type="submit" disabled={!name.trim()}>
        File
      </button>
    </form>
  );
}

function LedgerCard({ person, rank, onLog, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="slip">
      <div className="slip-top">
        <div className="rank">{String(rank).padStart(2, '0')}</div>
        <div className="slip-id">
          <div className="slip-name">{person.name}</div>
          <div className="slip-epithet">{person.epithet}</div>
        </div>
        <div className="slip-score">
          <b>{person.score}</b>
          <span>pts</span>
        </div>
      </div>

      <HeatMeter value={person.heat} />

      <div className="slip-meta-row">
        <Trend kind={person.trend} delta={person.trendDelta} />
        <div className="slip-meta-right">
          <span className="last-hit">{person.count} on file</span>
          <button
            className="slip-del"
            aria-label={`Strike ${person.name} from the record`}
            onClick={() => setConfirming(true)}
          >
            ✕
          </button>
        </div>
      </div>

      {confirming ? (
        <div className="confirm-bar" role="alertdialog" aria-label={`Delete ${person.name}?`}>
          <span className="confirm-q">
            Strike <strong>{person.name}</strong>? Erases {person.count} incident{person.count === 1 ? '' : 's'}.
          </span>
          <div className="confirm-actions">
            <button className="cf-no" onClick={() => setConfirming(false)}>Keep</button>
            <button className="cf-yes" onClick={() => onDelete(person.id)}>Strike</button>
          </div>
        </div>
      ) : (
        <LogButtons name={person.name} onLog={sevKey => onLog(person, sevKey)} />
      )}
    </div>
  );
}

function FeedEntry({ inc, peopleById, fresh, now, onUndo }) {
  const person = peopleById[inc.coworkerId];
  const sev = SEVERITIES[inc.severity];
  const trigLabel = inc.trigger ? TRIGGER_LABEL[inc.trigger] : null;
  return (
    <div className={'entry' + (fresh ? ' fresh' : '')}>
      <SevMark sevKey={inc.severity} />
      <div className="entry-body">
        <div className="entry-line">
          <b>{person ? person.name : 'Unknown'}</b>
          {trigLabel ? (
            <span className="entry-tag"> — {trigLabel.toLowerCase()}</span>
          ) : (
            <span className="entry-tag"> — {sev.label.toLowerCase()}, unspecified</span>
          )}
        </div>
        <div className="entry-meta">
          <span>NO. <Redact n={fresh ? 3 : 4} /></span>
          <span>{relativeTime(inc.timestamp, now)}</span>
          {fresh && <span className="filed-tag">Filed</span>}
        </div>
      </div>
      <button className="entry-undo" onClick={() => onUndo(inc.id)} aria-label="Undo this incident">
        ↩ undo
      </button>
    </div>
  );
}

export function PeopleView({ people, incidents, freshIds, now, onLog, onAdd, onDelete, onUndo, onClearAll }) {
  const [confirmClear, setConfirmClear] = useState(false);
  const reigning = people[0];
  const peopleById = Object.fromEntries(people.map(p => [p.id, p]));
  const feed = incidents.slice(0, 15);

  return (
    <div className="scroll">
      <ReignBanner person={reigning} hasPeople={people.length > 0} />

      <div className="section-head">
        <div className="section-title">The Ledger</div>
        <div className="section-meta">
          {people.length ? `${people.length} on file · by points` : 'open a case file'}
        </div>
      </div>

      <AddCoworker onAdd={onAdd} />

      {people.map((p, i) => (
        <LedgerCard key={p.id} person={p} rank={i + 1} onLog={onLog} onDelete={onDelete} />
      ))}

      <div className="section-head">
        <div className="section-title">Recent Incidents</div>
        <div className="section-meta">{incidents.length} total filed</div>
      </div>
      <div className="feed">
        {feed.length === 0 ? (
          <div className="feed-empty">The record is clean. Suspiciously clean.</div>
        ) : (
          feed.map(inc => (
            <FeedEntry
              key={inc.id}
              inc={inc}
              peopleById={peopleById}
              fresh={freshIds.includes(inc.id)}
              now={now}
              onUndo={onUndo}
            />
          ))
        )}
      </div>

      {(people.length > 0 || incidents.length > 0) && (
        <div className="danger">
          {confirmClear ? (
            <div className="confirm-bar danger-confirm" role="alertdialog" aria-label="Clear all data?">
              <span className="confirm-q">Shred everything? Wipes every coworker and incident on this device.</span>
              <div className="confirm-actions">
                <button className="cf-no" onClick={() => setConfirmClear(false)}>Keep it</button>
                <button
                  className="cf-yes"
                  onClick={() => {
                    onClearAll();
                    setConfirmClear(false);
                  }}
                >
                  Shred
                </button>
              </div>
            </div>
          ) : (
            <button className="danger-btn" onClick={() => setConfirmClear(true)}>
              Shred the whole file
            </button>
          )}
        </div>
      )}

      <div className="spacer" />
    </div>
  );
}
