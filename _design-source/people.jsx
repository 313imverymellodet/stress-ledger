/* ============================================================
   STRESS LEDGER — People view
   Reigning banner · ledger cards · recent incidents feed
   ============================================================ */

function ReignBanner({ person }){
  if (!person) return null;
  const quips = {
    mv: 'Currently winning the war for your nervous system.',
    tb: 'Your cortisol’s employee of the month.',
    gf: 'Sponsored by every “got a sec?” you’ve ever heard.',
    dk: 'Single-handedly funding your evening wind-down tea.',
    pn: 'Lives rent-free, reschedules constantly.',
    lo: 'Read at 11:04pm. Replied: never.',
  };
  return (
    <div className="reign">
      <div className="reign-kicker">Reigning stressor<span className="line"></span></div>
      <div className="seal"><b>1</b><i>RANKED</i></div>
      <div className="reign-name">{person.name}</div>
      <div className="reign-epithet">{person.epithet}</div>
      <div className="reign-row">
        <div className="reign-score">
          <b>{person.score}</b>
          <span>stress<br/>points</span>
        </div>
        <div className="reign-quip">{quips[person.id] || 'Holding the title, regrettably.'}</div>
      </div>
    </div>
  );
}

function LedgerCard({ person, rank, onLog }){
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
        <span className="last-hit">{person.count} incidents on file</span>
      </div>

      <LogButtons onLog={(sevKey) => onLog(person, sevKey)} />
    </div>
  );
}

function FeedEntry({ inc, people }){
  const person = people.find(p => p.id === inc.personId);
  const sev = SEVERITIES[inc.sevKey];
  const trigLabel = inc.triggerId ? TRIGGER_LABEL[inc.triggerId] : null;
  return (
    <div className={'entry' + (inc.fresh ? ' fresh' : '')}>
      <SevMark sevKey={inc.sevKey} />
      <div className="entry-body">
        <div className="entry-line">
          <b>{person ? person.name : 'Unknown'}</b>
          {trigLabel
            ? <span className="entry-tag"> — {trigLabel.toLowerCase()}</span>
            : <span className="entry-tag"> — {sev.label.toLowerCase()}, unspecified</span>}
        </div>
        <div className="entry-meta">
          <span>NO. <Redact n={inc.fresh ? 3 : 4} /></span>
          <span>{relTime(inc)}</span>
          {inc.fresh && <span className="filed-tag">Filed</span>}
        </div>
      </div>
    </div>
  );
}

function PeopleView({ people, incidents, onLog }){
  const reigning = people[0];
  const feed = incidents.slice(0, 9);
  return (
    <div className="scroll">
      <ReignBanner person={reigning} />

      <div className="section-head">
        <div className="section-title">The Ledger</div>
        <div className="section-meta">{people.length} on file · by points</div>
      </div>
      {people.map((p, i) => (
        <LedgerCard key={p.id} person={p} rank={i + 1} onLog={onLog} />
      ))}

      <div className="section-head">
        <div className="section-title">Recent Incidents</div>
        <div className="section-meta">{incidents.length} total filed</div>
      </div>
      <div className="feed">
        {feed.map(inc => <FeedEntry key={inc.id} inc={inc} people={people} />)}
      </div>
      <div className="spacer"></div>
    </div>
  );
}

Object.assign(window, { PeopleView });
