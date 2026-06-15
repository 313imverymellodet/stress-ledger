/* ============================================================
   STRESS LEDGER — data model, persistence + derivations
   Single source of truth: { coworkers[], incidents[] }.
   Everything (scores, trends, heat, all charts, header stats)
   derives from the incidents array against real timestamps.
   ============================================================ */

// ---- severity scale -------------------------------------------------------
export const SEVERITIES = {
  mild:  { key: 'mild',  label: 'Mild',     pts: 1, cssVar: 'var(--t-mild)'  },
  tense: { key: 'tense', label: 'Tense',    pts: 2, cssVar: 'var(--t-tense)' },
  melt:  { key: 'melt',  label: 'Meltdown', pts: 3, cssVar: 'var(--t-melt)'  },
};
export const SEV_ORDER = ['mild', 'tense', 'melt'];

// ---- trigger chips (design's in-character set ∪ the spec's list) ----------
export const TRIGGERS = [
  { id: 'meeting',     label: 'Meeting that could’ve been an email' },
  { id: 'quick',       label: '“Quick question”' },
  { id: 'credit',      label: 'Took credit' },
  { id: 'passagg',     label: 'Passive-aggression' },
  { id: 'replyall',    label: 'Reply-all storm' },
  { id: 'emaildm',     label: 'Email / DM' },
  { id: 'deadline',    label: 'Deadline' },
  { id: 'scope',       label: 'Scope creep' },
  { id: 'reschedule',  label: 'Rescheduled. Again.' },
  { id: 'lastminute',  label: 'Last-minute ask' },
  { id: 'dropped',     label: 'Dropped the ball' },
  { id: 'interrupted', label: 'Interrupted' },
  { id: 'micro',       label: 'Micromanaging' },
  { id: 'vague',       label: 'Vague feedback' },
  { id: 'volunteer',   label: 'Volunteered me' },
  { id: 'gossip',      label: 'Gossip' },
  { id: 'negativity',  label: 'Negativity' },
  { id: 'loud',        label: 'Loud' },
  { id: 'read',        label: 'Left me on read' },
];
export const TRIGGER_LABEL = Object.fromEntries(TRIGGERS.map(t => [t.id, t.label]));

// ---- in-character flavour for user-added coworkers ------------------------
const EPITHETS = [
  'Senior Meeting Extender',
  'Takes credit, leaves crumbs',
  'The “quick question” guy',
  'Reply-all evangelist',
  'Calendar bandit',
  'Reads at 11pm, replies never',
  'Master of the vague ask',
  'Scope-creep specialist',
  'Serial rescheduler',
  'Volunteers you, then vanishes',
  'A notification you can’t mute',
  'Open-plan menace',
];
export function nextEpithet(existingCount) {
  return EPITHETS[existingCount % EPITHETS.length];
}

const QUIPS = [
  'Currently winning the war for your nervous system.',
  'Your cortisol’s employee of the month.',
  'Sponsored by every “got a sec?” you’ve ever heard.',
  'Single-handedly funding your evening wind-down tea.',
  'Lives rent-free, reschedules constantly.',
  'Read at 11:04pm. Replied: never.',
  'Holding the title, regrettably.',
];
export function quipFor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return QUIPS[h % QUIPS.length];
}

// ---- weekdays + time-of-day blocks ----------------------------------------
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// 6 contiguous blocks covering all 24h (named per the spec)
export const TIME_BLOCKS = [
  { id: 'early',      short: 'Early', full: 'Early (5–8am)',         test: h => h >= 5 && h < 8 },
  { id: 'morning',    short: 'Morn',  full: 'Morning (8–11am)',      test: h => h >= 8 && h < 11 },
  { id: 'midday',     short: 'Mid',   full: 'Midday (11am–2pm)',     test: h => h >= 11 && h < 14 },
  { id: 'afternoon',  short: 'Aft',   full: 'Afternoon (2–5pm)',     test: h => h >= 14 && h < 17 },
  { id: 'evening',    short: 'Eve',   full: 'Evening (5–9pm)',       test: h => h >= 17 && h < 21 },
  { id: 'afterhours', short: 'Late',  full: 'After-hours (9pm–5am)', test: h => h >= 21 || h < 5 },
];
export function hourToBlock(h) {
  for (let i = 0; i < TIME_BLOCKS.length; i++) if (TIME_BLOCKS[i].test(h)) return i;
  return TIME_BLOCKS.length - 1;
}

// monday-based weekday index: 0 = Mon … 6 = Sun
export function weekdayIndex(ts) {
  return (new Date(ts).getDay() + 6) % 7;
}
function startOfWeek(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back up to Monday
  return d.getTime();
}

// ---- temperature colour ----------------------------------------------------
// t in [0,1] → calm-blue → yellow → orange → meltdown-red (Apple system colors)
export function heatColor(t) {
  t = Math.max(0, Math.min(1, t));
  const stops = [
    [0.00, [10, 132, 255]],
    [0.45, [255, 214, 10]],
    [0.72, [255, 159, 10]],
    [1.00, [255, 69, 58]],
  ];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const f = (t - t0) / (t1 - t0);
      const c = c0.map((v, j) => Math.round(v + (c1[j] - v) * f));
      return `rgb(${c[0]},${c[1]},${c[2]})`;
    }
  }
  const last = stops[stops.length - 1][1];
  return `rgb(${last[0]},${last[1]},${last[2]})`;
}

// ---- ids -------------------------------------------------------------------
export function newId(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---- persistence (localStorage, JSON, fully guarded) ----------------------
const STORAGE_KEY = 'stress-ledger:v1';
const EMPTY = { coworkers: [], incidents: [] };

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return { ...EMPTY };
    return {
      coworkers: Array.isArray(data.coworkers) ? data.coworkers : [],
      incidents: Array.isArray(data.incidents) ? data.incidents : [],
    };
  } catch (e) {
    console.warn('Stress Ledger: could not read saved data — starting fresh.', e);
    return { ...EMPTY };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, coworkers: state.coworkers, incidents: state.incidents }),
    );
    return true;
  } catch (e) {
    console.warn('Stress Ledger: could not save data (storage full or blocked).', e);
    return false;
  }
}

// ---- export / import (move your ledger between devices) -------------------
export function serializeState(coworkers, incidents) {
  return JSON.stringify(
    { version: 1, exportedAt: new Date().toISOString(), coworkers, incidents },
    null,
    2,
  );
}

// Parse + defensively validate an imported file. Throws a friendly Error on
// anything that isn't a usable Stress Ledger export. Unknown/invalid records
// are dropped rather than trusted.
export function parseImport(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That doesn’t look like a valid file (couldn’t read the JSON).');
  }
  if (!data || typeof data !== 'object' || !Array.isArray(data.coworkers) || !Array.isArray(data.incidents)) {
    throw new Error('That file isn’t a Stress Ledger backup — no coworkers/incidents found.');
  }

  const coworkers = [];
  const ids = new Set();
  data.coworkers.forEach(c => {
    if (!c || typeof c.name !== 'string' || !c.name.trim()) return;
    const id = typeof c.id === 'string' && c.id ? c.id : newId('cw');
    if (ids.has(id)) return;
    ids.add(id);
    coworkers.push({
      id,
      name: c.name.trim().slice(0, 40),
      epithet:
        typeof c.epithet === 'string' && c.epithet ? c.epithet : nextEpithet(coworkers.length),
    });
  });

  const incidents = [];
  data.incidents.forEach(inc => {
    if (!inc || typeof inc !== 'object') return;
    if (!SEVERITIES[inc.severity]) return;
    if (!ids.has(inc.coworkerId)) return;
    const ts = Number(inc.timestamp);
    if (!Number.isFinite(ts)) return;
    incidents.push({
      id: typeof inc.id === 'string' && inc.id ? inc.id : newId('inc'),
      coworkerId: inc.coworkerId,
      severity: inc.severity,
      trigger: inc.trigger && TRIGGER_LABEL[inc.trigger] ? inc.trigger : null,
      timestamp: ts,
    });
  });
  incidents.sort((a, b) => b.timestamp - a.timestamp);

  if (!coworkers.length && !incidents.length) {
    throw new Error('That file is empty — nothing to import.');
  }
  return { coworkers, incidents };
}

// ---- derive people (score, this-week vs last-week trend, heat) -------------
export function computePeople(coworkers, incidents, now = Date.now()) {
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = thisWeekStart - 7 * 864e5;

  const map = {};
  coworkers.forEach(c => {
    map[c.id] = {
      ...c, score: 0, count: 0, thisWeek: 0, lastWeek: 0, lastT: -Infinity,
      mix: { mild: 0, tense: 0, melt: 0 }, // points contributed by each severity
    };
  });
  incidents.forEach(inc => {
    const m = map[inc.coworkerId];
    if (!m) return;
    const pts = SEVERITIES[inc.severity].pts;
    m.score += pts;
    m.count += 1;
    m.mix[inc.severity] += pts;
    if (inc.timestamp >= thisWeekStart) m.thisWeek += pts;
    else if (inc.timestamp >= lastWeekStart) m.lastWeek += pts;
    if (inc.timestamp > m.lastT) m.lastT = inc.timestamp;
  });

  const arr = Object.values(map);
  const max = Math.max(1, ...arr.map(p => p.score));
  arr.forEach(p => {
    p.heat = p.score / max;
    const d = p.thisWeek - p.lastWeek;
    p.trend = Math.abs(d) <= 1 ? 'steady' : d > 0 ? 'worse' : 'easing';
    p.trendDelta = d;
  });
  arr.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return arr;
}

// ---- derive pattern charts -------------------------------------------------
export function computePatterns(incidents) {
  const grid = DAYS.map(() => TIME_BLOCKS.map(() => 0)); // [day][block] = points
  const trig = {};
  TRIGGERS.forEach(t => (trig[t.id] = 0));
  const dayPts = DAYS.map(() => 0);
  const dayDates = DAYS.map(() => new Set()); // distinct calendar dates per weekday
  let total = 0;
  let meltdowns = 0;

  incidents.forEach(inc => {
    const pts = SEVERITIES[inc.severity].pts;
    const d = new Date(inc.timestamp);
    const di = (d.getDay() + 6) % 7;
    const bi = hourToBlock(d.getHours());
    grid[di][bi] += pts;
    if (inc.trigger && trig[inc.trigger] != null) trig[inc.trigger] += 1;
    dayPts[di] += pts;
    dayDates[di].add(d.toDateString());
    total += pts;
    if (inc.severity === 'melt') meltdowns += 1;
  });

  const gmax = Math.max(1, ...grid.flat());
  const triggers = TRIGGERS.map(t => ({ ...t, count: trig[t.id] }))
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count);
  const tmax = Math.max(1, ...triggers.map(t => t.count));

  // average stress points per occurrence of each weekday
  const dayAvg = dayPts.map((p, i) => (dayDates[i].size ? p / dayDates[i].size : 0));
  const dmax = Math.max(1, ...dayAvg);
  let worstDay = 0;
  dayAvg.forEach((v, i) => {
    if (v > dayAvg[worstDay]) worstDay = i;
  });

  // peak time-of-day block (for the caption)
  let peakBlock = 0;
  let peakVal = -1;
  TIME_BLOCKS.forEach((_, bi) => {
    const colSum = grid.reduce((s, row) => s + row[bi], 0);
    if (colSum > peakVal) {
      peakVal = colSum;
      peakBlock = bi;
    }
  });

  return { grid, gmax, triggers, tmax, dayAvg, dmax, worstDay, total, meltdowns, peakBlock };
}

// ---- header stats ----------------------------------------------------------
export function headerStats(incidents, now = Date.now()) {
  const thisWeekStart = startOfWeek(now);
  let thisWeek = 0;
  let points = 0;
  incidents.forEach(inc => {
    points += SEVERITIES[inc.severity].pts;
    if (inc.timestamp >= thisWeekStart) thisWeek += 1;
  });
  return { thisWeek, total: incidents.length, points };
}

// ---- relative time ("2h ago") ---------------------------------------------
export function relativeTime(ts, now = Date.now()) {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(s / 3600);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(s / 86400);
  if (d === 1) return 'yesterday';
  if (d < 7) return d + 'd ago';
  const w = Math.floor(d / 7);
  if (w < 5) return w + 'w ago';
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ---- per-person derivations (for the detail "case file") ------------------
export function personTriggers(coworkerId, incidents) {
  const t = {};
  TRIGGERS.forEach(x => (t[x.id] = 0));
  incidents.forEach(i => {
    if (i.coworkerId === coworkerId && i.trigger && t[i.trigger] != null) t[i.trigger] += 1;
  });
  return TRIGGERS.map(x => ({ ...x, count: t[x.id] }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count);
}

// usage counts per trigger across all incidents (for floating recents to the top)
export function triggerUsage(incidents) {
  const t = {};
  incidents.forEach(i => {
    if (i.trigger) t[i.trigger] = (t[i.trigger] || 0) + 1;
  });
  return t;
}

// ---- plain-language read-out for the Patterns view ------------------------
export function patternInsights(people, patterns) {
  const { total, dayAvg, worstDay, triggers, meltdowns, peakBlock } = patterns;
  if (!total) return [];
  const out = [];

  // worst weekday vs the average across days that have any data
  const active = dayAvg.filter(v => v > 0);
  const mean = active.length ? active.reduce((s, v) => s + v, 0) / active.length : 0;
  if (mean > 0 && dayAvg[worstDay] >= mean * 1.4 && active.length > 1) {
    const x = Math.round((dayAvg[worstDay] / mean) * 10) / 10;
    out.push(`${FULL_DAYS[worstDay]}s run about ${x}× your average day.`);
  }

  // dominant trigger share
  if (triggers.length) {
    const top = triggers[0];
    const tagged = triggers.reduce((s, t) => s + t.count, 0);
    const share = Math.round((top.count / tagged) * 100);
    if (share >= 30) out.push(`“${top.label}” drives ${share}% of your tagged incidents.`);
  }

  // top stressor's share of all points
  if (people.length && people[0].score > 0) {
    const allPts = people.reduce((s, p) => s + p.score, 0);
    const share = Math.round((people[0].score / allPts) * 100);
    if (share >= 35 && people.length > 1) {
      out.push(`${people[0].name} alone accounts for ${share}% of your stress points.`);
    }
  }

  // meltdown note, with timing if we have it
  if (meltdowns > 0) {
    const when = TIME_BLOCKS[peakBlock] ? ` — most often ${TIME_BLOCKS[peakBlock].full.split(' ')[0].toLowerCase()}` : '';
    out.push(`${meltdowns} full meltdown${meltdowns === 1 ? '' : 's'} on record${when}.`);
  }

  return out.slice(0, 3);
}
