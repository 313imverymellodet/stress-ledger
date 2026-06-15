/* ============================================================
   STRESS LEDGER — app shell + state
   Owns { coworkers, incidents }, persists to localStorage,
   derives everything the views need.
   ============================================================ */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TIME_BLOCKS,
  loadState,
  saveState,
  newId,
  nextEpithet,
  serializeState,
  computePeople,
  computePatterns,
  headerStats,
  triggerUsage,
} from './data.js';
import { Masthead } from './components/Masthead.jsx';
import { PeopleView } from './components/PeopleView.jsx';
import { PatternsView } from './components/PatternsView.jsx';
import { PersonDetail } from './components/PersonDetail.jsx';
import { TagSheet } from './components/TagSheet.jsx';
import { StampLayer } from './components/Stamp.jsx';
import { IconLedger, IconPatterns } from './components/widgets.jsx';

export default function App() {
  const initial = loadState();
  const [coworkers, setCoworkers] = useState(initial.coworkers);
  const [incidents, setIncidents] = useState(initial.incidents);
  const [tab, setTab] = useState('people');
  const [sheet, setSheet] = useState({ open: false, target: null });
  const [stamp, setStamp] = useState(null);
  const [shake, setShake] = useState(false);
  const [freshIds, setFreshIds] = useState([]);
  const [freshCoworkerId, setFreshCoworkerId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [toast, setToast] = useState(null); // { inc } — recently struck incident
  const [now, setNow] = useState(() => Date.now());

  const seqRef = useRef(0);
  const freshTimer = useRef(null);
  const coworkerTimer = useRef(null);
  const toastTimer = useRef(null);

  // persist on every change
  useEffect(() => {
    saveState({ coworkers, incidents });
  }, [coworkers, incidents]);

  // keep relative times honest — re-tick every 60s
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const people = useMemo(() => computePeople(coworkers, incidents, now), [coworkers, incidents, now]);
  const patterns = useMemo(() => computePatterns(incidents), [incidents]);
  const stats = useMemo(() => headerStats(incidents, now), [incidents, now]);
  const usage = useMemo(() => triggerUsage(incidents), [incidents]);

  // the person whose detail "case file" is open (and their rank), if any
  const detailIndex = detailId ? people.findIndex(p => p.id === detailId) : -1;
  const detailPerson = detailIndex >= 0 ? people[detailIndex] : null;

  const peakLabel = patterns.total ? TIME_BLOCKS[patterns.peakBlock].full.toLowerCase() : null;
  const caseNo = useMemo(() => '26-' + String(4000 + incidents.length).slice(-4), [incidents.length]);

  // ---- coworker management --------------------------------------------------
  function addCoworker(name) {
    const c = { id: newId('cw'), name, epithet: nextEpithet(coworkers.length) };
    setCoworkers(prev => [...prev, c]);
    // flag for the highlight + scroll-into-view flourish (session only)
    setFreshCoworkerId(c.id);
    clearTimeout(coworkerTimer.current);
    coworkerTimer.current = setTimeout(() => setFreshCoworkerId(null), 1800);
  }
  function deleteCoworker(id) {
    setCoworkers(prev => prev.filter(c => c.id !== id));
    setIncidents(prev => prev.filter(inc => inc.coworkerId !== id));
    setDetailId(d => (d === id ? null : d)); // close the file if it was open
  }
  function renameCoworker(id, name) {
    const v = name.trim().slice(0, 40);
    if (!v) return;
    setCoworkers(prev => prev.map(c => (c.id === id ? { ...c, name: v } : c)));
  }

  // ---- logging --------------------------------------------------------------
  function handleQuickLog(person, sevKey) {
    setSheet({ open: true, target: { coworkerId: person.id, name: person.name, sevKey } });
  }

  function commit({ sevKey, triggerIds }) {
    const target = sheet.target;
    if (!target) return;
    const ts = Date.now();
    const tags = triggerIds && triggerIds.length ? triggerIds : [null];
    // one incident per tagged offense (skip → a single untagged incident)
    const fresh = tags.map((tid, i) => ({
      id: newId('inc') + '-' + i,
      coworkerId: target.coworkerId,
      severity: sevKey,
      trigger: tid,
      timestamp: ts,
    }));

    setIncidents(prev => [...fresh, ...prev].sort((a, b) => b.timestamp - a.timestamp));
    setSheet({ open: false, target: null });

    // flag freshness for the feed highlight (session only, not persisted)
    const ids = fresh.map(f => f.id);
    setFreshIds(ids);
    clearTimeout(freshTimer.current);
    freshTimer.current = setTimeout(() => setFreshIds([]), 3000);

    // fire the hero stamp
    seqRef.current += 1;
    const rot = -10 + Math.round(Math.random() * 8);
    const d = new Date(ts);
    setStamp({
      sevKey,
      seq: seqRef.current,
      rot,
      caseNo: '26-' + String(4000 + incidents.length + 1).slice(-4),
      time: String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'),
    });
    setShake(true);
    setTimeout(() => setShake(false), 440);
    setTimeout(() => setStamp(null), 1300);
  }

  // strike an incident, but offer a brief restore window (undo grace)
  function strikeIncident(id) {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;
    setIncidents(prev => prev.filter(i => i.id !== id));
    clearTimeout(toastTimer.current);
    setToast({ inc });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }
  function restoreIncident() {
    setToast(t => {
      if (t && t.inc) {
        setIncidents(prev => [t.inc, ...prev].sort((a, b) => b.timestamp - a.timestamp));
      }
      return null;
    });
    clearTimeout(toastTimer.current);
  }

  function clearAll() {
    setCoworkers([]);
    setIncidents([]);
    setFreshIds([]);
  }

  // ---- export / import (move the ledger between devices) --------------------
  function exportData() {
    const text = serializeState(coworkers, incidents);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stress-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function importData(parsed) {
    setCoworkers(parsed.coworkers);
    setIncidents(parsed.incidents);
    setFreshIds([]);
  }

  return (
    <div className={'phone' + (shake ? ' shake' : '')}>
      <Masthead caseNo={caseNo} stats={stats} />

      {tab === 'people' ? (
        <PeopleView
          people={people}
          incidents={incidents}
          freshIds={freshIds}
          freshCoworkerId={freshCoworkerId}
          now={now}
          onLog={handleQuickLog}
          onAdd={addCoworker}
          onDelete={deleteCoworker}
          onStrike={strikeIncident}
          onOpenDetail={setDetailId}
          onClearAll={clearAll}
          onExport={exportData}
          onImport={importData}
        />
      ) : (
        <PatternsView patterns={patterns} peakLabel={peakLabel} people={people} />
      )}

      <nav className="nav">
        <button className={'tab' + (tab === 'people' ? ' on' : '')} onClick={() => setTab('people')} aria-pressed={tab === 'people'}>
          <IconLedger />
          <span className="tx">The Ledger</span>
        </button>
        <button className={'tab' + (tab === 'patterns' ? ' on' : '')} onClick={() => setTab('patterns')} aria-pressed={tab === 'patterns'}>
          <IconPatterns />
          <span className="tx">Patterns</span>
        </button>
      </nav>

      {detailPerson && (
        <PersonDetail
          person={detailPerson}
          rank={detailIndex + 1}
          incidents={incidents}
          now={now}
          onClose={() => setDetailId(null)}
          onLog={handleQuickLog}
          onStrike={strikeIncident}
          onRename={renameCoworker}
          onDelete={deleteCoworker}
        />
      )}

      <TagSheet
        open={sheet.open}
        target={sheet.target}
        usage={usage}
        onClose={() => setSheet({ open: false, target: null })}
        onFile={commit}
      />

      {toast && (
        <div className="toast" role="status">
          <span className="toast-msg">Incident struck</span>
          <button className="toast-undo" onClick={restoreIncident}>Undo</button>
        </div>
      )}

      <StampLayer stamp={stamp} />
    </div>
  );
}
