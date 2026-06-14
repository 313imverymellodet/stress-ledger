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
  computePeople,
  computePatterns,
  headerStats,
} from './data.js';
import { Masthead } from './components/Masthead.jsx';
import { PeopleView } from './components/PeopleView.jsx';
import { PatternsView } from './components/PatternsView.jsx';
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
  const [now, setNow] = useState(() => Date.now());

  const seqRef = useRef(0);
  const freshTimer = useRef(null);

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

  const peakLabel = patterns.total ? TIME_BLOCKS[patterns.peakBlock].full.toLowerCase() : null;
  const caseNo = useMemo(() => '26-' + String(4000 + incidents.length).slice(-4), [incidents.length]);

  // ---- coworker management --------------------------------------------------
  function addCoworker(name) {
    setCoworkers(prev => {
      const c = { id: newId('cw'), name, epithet: nextEpithet(prev.length) };
      return [...prev, c];
    });
  }
  function deleteCoworker(id) {
    setCoworkers(prev => prev.filter(c => c.id !== id));
    setIncidents(prev => prev.filter(inc => inc.coworkerId !== id));
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

  function undoIncident(id) {
    setIncidents(prev => prev.filter(inc => inc.id !== id));
  }

  function clearAll() {
    setCoworkers([]);
    setIncidents([]);
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
          now={now}
          onLog={handleQuickLog}
          onAdd={addCoworker}
          onDelete={deleteCoworker}
          onUndo={undoIncident}
          onClearAll={clearAll}
        />
      ) : (
        <PatternsView patterns={patterns} peakLabel={peakLabel} />
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

      <TagSheet
        open={sheet.open}
        target={sheet.target}
        onClose={() => setSheet({ open: false, target: null })}
        onFile={commit}
      />

      <StampLayer stamp={stamp} />
    </div>
  );
}
