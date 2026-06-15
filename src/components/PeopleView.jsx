/* ============================================================
   STRESS LEDGER — People view ("The Ledger")
   Reigning banner · add coworker · ledger cards · feed · reset
   ============================================================ */
import React, { useState, useRef, useEffect } from 'react';
import { SEVERITIES, TRIGGER_LABEL, quipFor, relativeTime, parseImport } from '../data.js';
import { HeatMeter, Trend, Redact, SevMark, LogButtons } from './widgets.jsx';

function ReignBanner({ person, hasPeople, onLog, onOpenDetail }) {
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
      <div className="seal"><b>1</b><i>RANKED</i></div>
      <button className="reign-open" onClick={() => onOpenDetail(person.id)} aria-label={`Open ${person.name}’s case file`}>
        <div className="reign-kicker">Reigning stressor<span className="line" /></div>
        <div className="reign-name">{person.name}</div>
        <div className="reign-epithet">{person.epithet}</div>
        <div className="reign-row">
          <div className="reign-score">
            <b>{person.score}</b>
            <span>stress<br />points</span>
          </div>
          <div className="reign-quip">{quipFor(person.id)}</div>
        </div>
      </button>
      <LogButtons name={person.name} variant="dark" onLog={sevKey => onLog(person, sevKey)} />
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

function LedgerCard({ person, rank, fresh, onLog, onDelete, onOpenDetail }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className={'slip' + (fresh ? ' fresh' : '')} data-cwid={person.id}>
      <button className="slip-open" onClick={() => onOpenDetail(person.id)} aria-label={`Open ${person.name}’s case file`}>
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
          <span className="slip-chev" aria-hidden="true">›</span>
        </div>
      </button>

      <HeatMeter mix={person.mix} total={person.score} />

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

function FeedEntry({ inc, peopleById, fresh, now, onStrike }) {
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
      <button className="entry-undo" onClick={() => onStrike(inc.id)} aria-label="Strike this incident">
        strike
      </button>
    </div>
  );
}

export function PeopleView({
  people,
  incidents,
  freshIds,
  freshCoworkerId,
  now,
  onLog,
  onAdd,
  onDelete,
  onStrike,
  onOpenDetail,
  onClearAll,
  onExport,
  onImport,
}) {
  const [confirmClear, setConfirmClear] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const hasData = people.length > 0 || incidents.length > 0;

  // scroll a newly added coworker into view
  useEffect(() => {
    if (!freshCoworkerId || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-cwid="${freshCoworkerId}"]`);
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [freshCoworkerId]);

  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = ''; // let the same file be re-selected later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseImport(String(reader.result));
        setImportError(null);
        if (hasData) {
          setPendingImport(parsed); // confirm before overwriting
        } else {
          onImport(parsed); // empty device — just load it
        }
      } catch (err) {
        setPendingImport(null);
        setImportError(err.message || 'Could not read that file.');
      }
    };
    reader.onerror = () => setImportError('Could not read that file.');
    reader.readAsText(file);
  }

  const reigning = people[0];
  const reignActive = reigning && reigning.score > 0; // banner owns #1 only when earned
  const listPeople = reignActive ? people.slice(1) : people;
  const rankOffset = reignActive ? 2 : 1;
  const peopleById = Object.fromEntries(people.map(p => [p.id, p]));
  const feed = incidents.slice(0, 15);

  return (
    <div className="scroll" ref={scrollRef}>
      <ReignBanner
        person={reigning}
        hasPeople={people.length > 0}
        onLog={onLog}
        onOpenDetail={onOpenDetail}
      />

      <div className="people-grid">
      <div className="col col-ledger">
      <div className="section-head">
        <div className="section-title">The Ledger</div>
        <div className="section-meta">
          {people.length ? `${people.length} on file · by points` : 'open a case file'}
        </div>
      </div>

      <AddCoworker onAdd={onAdd} />

      {listPeople.map((p, i) => (
        <LedgerCard
          key={p.id}
          person={p}
          rank={i + rankOffset}
          fresh={p.id === freshCoworkerId}
          onLog={onLog}
          onDelete={onDelete}
          onOpenDetail={onOpenDetail}
        />
      ))}
      {reignActive && listPeople.length === 0 && (
        <div className="feed-empty">No challengers yet. Add another name above.</div>
      )}

      </div>
      <div className="col col-feed">
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
              onStrike={onStrike}
            />
          ))
        )}
      </div>

      <div className="records">
        <div className="records-head">Move the file between devices</div>
        <div className="data-tools">
          <button className="data-btn" onClick={onExport} disabled={!hasData}>
            ⤓ Back up
          </button>
          <button className="data-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
            ⤒ Restore
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="file-hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={handleFile}
          />
        </div>
        <div className="records-note">
          Back up here, then Restore the downloaded file on your other device. Restoring replaces that device’s ledger.
        </div>

        {importError && (
          <div className="import-msg err" role="alert">
            {importError}
          </div>
        )}

        {pendingImport && (
          <div className="confirm-bar danger-confirm" role="alertdialog" aria-label="Replace data with import?">
            <span className="confirm-q">
              Replace this device’s ledger ({people.length} {people.length === 1 ? 'name' : 'names'} ·{' '}
              {incidents.length} incident{incidents.length === 1 ? '' : 's'}) with the file (
              {pendingImport.coworkers.length} {pendingImport.coworkers.length === 1 ? 'name' : 'names'} ·{' '}
              {pendingImport.incidents.length} incident{pendingImport.incidents.length === 1 ? '' : 's'})?
            </span>
            <div className="confirm-actions">
              <button className="cf-no" onClick={() => setPendingImport(null)}>Cancel</button>
              <button
                className="cf-yes"
                onClick={() => {
                  onImport(pendingImport);
                  setPendingImport(null);
                }}
              >
                Replace
              </button>
            </div>
          </div>
        )}

        {hasData &&
          (confirmClear ? (
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
          ))}
      </div>

      </div>
      </div>

      <div className="spacer" />
    </div>
  );
}
