/* ============================================================
   STRESS LEDGER — data + helpers
   Single source of truth: an incidents[] array.
   People scores, trends, and all Pattern charts derive from it.
   ============================================================ */

// ---- the accused ----------------------------------------------------------
const PEOPLE_META = [
  { id: 'mv', name: 'Marcus V.',     epithet: 'Senior Meeting Extender' },
  { id: 'tb', name: 'Tabitha R.',    epithet: 'Takes credit, leaves crumbs' },
  { id: 'gf', name: 'Greg, Finance', epithet: 'The “quick question” guy' },
  { id: 'dk', name: 'Dana K.',       epithet: 'Reply-all evangelist' },
  { id: 'pn', name: 'Priya N.',      epithet: 'Calendar bandit' },
  { id: 'lo', name: 'Liam O.',       epithet: 'Reads at 11pm, replies never' },
];

// ---- what happened --------------------------------------------------------
const TRIGGERS = [
  { id: 'meeting',  label: 'Meeting that could’ve been an email' },
  { id: 'passagg',  label: 'Passive-aggression' },
  { id: 'credit',   label: 'Took credit' },
  { id: 'replyall', label: 'Reply-all storm' },
  { id: 'quick',    label: '“Quick question”' },
  { id: 'scope',    label: 'Scope creep' },
  { id: 'reschedule', label: 'Rescheduled. Again.' },
  { id: 'vague',    label: 'Vague feedback' },
  { id: 'volunteer', label: 'Volunteered me' },
  { id: 'read',     label: 'Left me on read' },
];
const TRIGGER_LABEL = Object.fromEntries(TRIGGERS.map(t => [t.id, t.label]));

// ---- severity scale -------------------------------------------------------
const SEVERITIES = {
  mild: { key: 'mild', label: 'Mild',     pts: 1, cssVar: 'var(--t-mild)' },
  tense:{ key: 'tense',label: 'Tense',    pts: 2, cssVar: 'var(--t-tense)' },
  melt: { key: 'melt', label: 'Meltdown', pts: 3, cssVar: 'var(--t-melt)' },
};
const SEV_ORDER = ['mild', 'tense', 'melt'];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
// 6 time buckets across the working day
const HOUR_BUCKETS = [
  { lbl: '8a',  lo: 8,  hi: 10 },
  { lbl: '10a', lo: 10, hi: 12 },
  { lbl: '12p', lo: 12, hi: 14 },
  { lbl: '2p',  lo: 14, hi: 16 },
  { lbl: '4p',  lo: 16, hi: 18 },
  { lbl: '6p',  lo: 18, hi: 21 },
];
function hourToBucket(h){
  for (let i = 0; i < HOUR_BUCKETS.length; i++){
    if (h >= HOUR_BUCKETS[i].lo && h < HOUR_BUCKETS[i].hi) return i;
  }
  return h < 8 ? 0 : HOUR_BUCKETS.length - 1;
}

// ---- temperature color ----------------------------------------------------
// t in [0,1] → calm-blue → amber → orange → meltdown-red
function heatColor(t){
  t = Math.max(0, Math.min(1, t));
  const stops = [
    [0.00, [10, 132, 255]],   // systemBlue — calm
    [0.45, [255, 214, 10]],   // systemYellow — mild
    [0.72, [255, 159, 10]],   // systemOrange — tense
    [1.00, [255, 69, 58]],    // systemRed — meltdown
  ];
  for (let i = 1; i < stops.length; i++){
    if (t <= stops[i][0]){
      const [t0, c0] = stops[i - 1], [t1, c1] = stops[i];
      const f = (t - t0) / (t1 - t0);
      const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * f));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  const last = stops[stops.length - 1][1];
  return `rgb(${last[0]},${last[1]},${last[2]})`;
}

// ---- seeded generator (stable across reloads) -----------------------------
function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function weightedPick(rand, items, weights){
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++){ r -= weights[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

function buildSeed(){
  const rand = mulberry32(73);
  // per-person offense weight (Marcus the reigning champ)
  const pWeight   = { mv: 11, tb: 8, gf: 7, dk: 5, pn: 4, lo: 3 };
  // each person leans on certain triggers
  const pTriggers = {
    mv: ['meeting','scope','reschedule','meeting','vague'],
    tb: ['credit','passagg','credit','vague'],
    gf: ['quick','quick','replyall','volunteer'],
    dk: ['replyall','passagg','volunteer'],
    pn: ['reschedule','meeting','volunteer'],
    lo: ['read','quick','vague'],
  };
  const dayWeights  = [1.7, 1.1, 1.0, 1.25, 0.6];           // Monday is the enemy
  const hourWeights = [0.7, 1.9, 0.8, 0.9, 1.6, 0.5];       // peaks ~10a and ~4p (bucket index)
  const sevW        = [0.58, 0.30, 0.12];                    // mild common, meltdowns rare
  const peopleIds = PEOPLE_META.map(p => p.id);
  const peopleW   = peopleIds.map(id => pWeight[id]);

  const incidents = [];
  const COUNT = 46;
  for (let i = 0; i < COUNT; i++){
    const week = rand() < 0.55 ? 0 : 1;        // this week vs last week
    const personId = weightedPick(rand, peopleIds, peopleW);
    const bucket = HOUR_BUCKETS[ weightedPick(rand, HOUR_BUCKETS.map((_,i)=>i), hourWeights) ];
    const hour = bucket.lo + Math.floor(rand() * Math.max(1, bucket.hi - bucket.lo));
    const minute = Math.floor(rand() * 60);
    const dayIdx = weightedPick(rand, [0,1,2,3,4], dayWeights);
    const sevKey = weightedPick(rand, SEV_ORDER, sevW);
    const leans = pTriggers[personId];
    const triggerId = leans[Math.floor(rand() * leans.length)];
    incidents.push({
      id: 'seed-' + i, personId, week, dayIdx, hour, minute,
      sevKey, triggerId,
      // sortable pseudo-timestamp: lower = more recent
      _t: week * 10000 + (4 - dayIdx) * 1000 + (20 - hour) * 30 + (60 - minute),
    });
  }
  incidents.sort((a, b) => a._t - b._t);
  return incidents;
}

const INITIAL_INCIDENTS = buildSeed();

// ---- derive people (scores, trend, heat) ----------------------------------
function computePeople(incidents){
  const map = {};
  PEOPLE_META.forEach(p => { map[p.id] = { ...p, score: 0, thisWeek: 0, lastWeek: 0, count: 0, lastT: Infinity }; });
  incidents.forEach(inc => {
    const m = map[inc.personId]; if (!m) return;
    const pts = SEVERITIES[inc.sevKey].pts;
    m.score += pts; m.count += 1;
    if (inc.week === 0) m.thisWeek += pts; else m.lastWeek += pts;
    if (inc._t < m.lastT) m.lastT = inc._t;
  });
  const arr = Object.values(map);
  const max = Math.max(1, ...arr.map(p => p.score));
  arr.forEach(p => {
    p.heat = p.score / max;                         // 0..1 for meter
    const d = p.thisWeek - p.lastWeek;
    p.trend = Math.abs(d) <= 1 ? 'steady' : (d > 0 ? 'worse' : 'easing');
    p.trendDelta = d;
  });
  arr.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return arr;
}

// ---- derive patterns -------------------------------------------------------
function computePatterns(incidents){
  // time-of-day heatmap: [day][bucket] = weighted count
  const grid = DAYS.map(() => HOUR_BUCKETS.map(() => 0));
  const trig = {}; TRIGGERS.forEach(t => trig[t.id] = 0);
  const dayTotals = DAYS.map(() => 0);
  let total = 0, meltdowns = 0;
  incidents.forEach(inc => {
    const pts = SEVERITIES[inc.sevKey].pts;
    grid[inc.dayIdx][hourToBucket(inc.hour)] += pts;
    if (inc.triggerId) trig[inc.triggerId] += 1;
    dayTotals[inc.dayIdx] += pts;
    total += pts;
    if (inc.sevKey === 'melt') meltdowns += 1;
  });
  const gmax = Math.max(1, ...grid.flat());
  const triggers = TRIGGERS.map(t => ({ ...t, count: trig[t.id] }))
                           .filter(t => t.count > 0)
                           .sort((a, b) => b.count - a.count);
  const tmax = Math.max(1, ...triggers.map(t => t.count));
  const dmax = Math.max(1, ...dayTotals);
  const worstDay = dayTotals.indexOf(dmax);
  // find peak window for the caption
  let peakBucket = 0, peakVal = -1;
  HOUR_BUCKETS.forEach((_, bi) => {
    const colSum = grid.reduce((s, row) => s + row[bi], 0);
    if (colSum > peakVal){ peakVal = colSum; peakBucket = bi; }
  });
  return { grid, gmax, triggers, tmax, dayTotals, dmax, worstDay, total, meltdowns, peakBucket };
}

function relTime(inc){
  if (inc.fresh) return 'JUST NOW';
  const day = DAYS[inc.dayIdx].toUpperCase();
  const hh = String(inc.hour).padStart(2, '0');
  const mm = String(inc.minute).padStart(2, '0');
  return (inc.week === 1 ? 'LAST ' : '') + day + ' · ' + hh + ':' + mm;
}

Object.assign(window, {
  PEOPLE_META, TRIGGERS, TRIGGER_LABEL, SEVERITIES, SEV_ORDER,
  DAYS, HOUR_BUCKETS, hourToBucket, heatColor,
  INITIAL_INCIDENTS, computePeople, computePatterns, relTime,
});
