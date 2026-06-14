/* ============================================================
   STRESS LEDGER — app shell
   ============================================================ */

function Masthead({ caseNo }){
  return (
    <header className="masthead">
      <div className="mast-top">
        <div>
          <div className="mast-title">STRESS <span className="red">LEDGER</span></div>
          <div className="mast-sub">Personal Incident Record</div>
        </div>
        <div className="conf-stamp">Confidential</div>
      </div>
      <div className="mast-case">
        <span>CASE NO. {caseNo}</span>
        <span>·</span>
        <span>PRIVATE — THIS DEVICE ONLY</span>
      </div>
    </header>
  );
}

function App(){
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [tab, setTab] = useState('people');
  const [sheet, setSheet] = useState({ open: false, target: null });
  const [stamp, setStamp] = useState(null);
  const [shake, setShake] = useState(false);
  const seqRef = useRef(0);
  const phoneRef = useRef(null);

  const people = useMemo(() => computePeople(incidents), [incidents]);
  const patterns = useMemo(() => computePatterns(incidents), [incidents]);
  const peakLabel = HOUR_BUCKETS[patterns.peakBucket]
    ? `around ${HOUR_BUCKETS[patterns.peakBucket].lbl.replace('a',' AM').replace('p',' PM')}`
    : 'mid-afternoon';

  // a stable-ish case number with a redaction vibe
  const caseNo = useMemo(() => '26-' + String(4000 + incidents.length).slice(-4), [incidents.length]);

  // open the sheet from a card's quick-log button
  function handleQuickLog(person, sevKey){
    setSheet({ open: true, target: { personId: person.id, name: person.name, sevKey } });
  }

  // commit an incident + fire the stamp
  function commit({ sevKey, triggerIds }){
    const target = sheet.target;
    if (!target) return;
    const now = new Date();
    const dayIdx = Math.min(4, Math.max(0, (now.getDay() + 6) % 7)); // Mon=0..Sun
    const newIncidents = (triggerIds && triggerIds.length ? triggerIds : [null]).map((tid, i) => ({
      id: 'live-' + Date.now() + '-' + i,
      personId: target.personId,
      week: 0,
      dayIdx: dayIdx > 4 ? 4 : dayIdx,
      hour: now.getHours(),
      minute: now.getMinutes(),
      sevKey,
      triggerId: tid,
      fresh: true,
      _t: -Date.now(),       // most recent → sorts to top
    }));

    setIncidents(prev => [...newIncidents, ...prev].sort((a, b) => a._t - b._t));
    setSheet({ open: false, target: null });

    // fire the hero stamp
    seqRef.current += 1;
    const rot = -10 + Math.round(Math.random() * 8); // -10..-2 deg
    setStamp({
      sevKey,
      seq: seqRef.current,
      rot,
      caseNo: '26-' + String(4000 + incidents.length + 1).slice(-4),
      time: String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0'),
    });
    setShake(true);
    setTimeout(() => setShake(false), 440);
    setTimeout(() => setStamp(null), 1300);
  }

  return (
    <div className={'phone' + (shake ? ' shake' : '')} ref={phoneRef}>
      <Masthead caseNo={caseNo} />

      {tab === 'people'
        ? <PeopleView people={people} incidents={incidents} onLog={handleQuickLog} />
        : <PatternsView patterns={patterns} peakLabel={peakLabel} />}

      <nav className="nav">
        <button className={'tab' + (tab === 'people' ? ' on' : '')} onClick={() => setTab('people')}>
          <IconLedger />
          <span className="tx">The Ledger</span>
        </button>
        <button className={'tab' + (tab === 'patterns' ? ' on' : '')} onClick={() => setTab('patterns')}>
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

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
