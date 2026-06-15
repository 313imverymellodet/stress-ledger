# Stress Ledger

A private, single-user web app for keeping a (mock-)confidential record of **which coworker stresses you out most**.

Log incidents at three severities, tag what happened, and watch the rankings, trends, and patterns surface. It's styled like a wry "personal incident record" — cream receipt cards, a red-ink brand, a rubber-stamp "Filed" moment on every log.

> **Everything stays on your device.** No backend, no login, no server, no analytics. All data lives in your browser's `localStorage` as JSON. Clearing your browser data (or hitting **Shred the whole file**) wipes it.

---

## Quick start

Requires [Node.js](https://nodejs.org) 18+ (ships with `npm`).

```bash
npm install      # install dependencies (first time only)
npm run dev      # start the dev server
```

Then open the URL it prints (default **http://localhost:5173**) in your browser.

> If port 5173 is taken, Vite will pick the next free port — or run `npm run dev -- --port 3000`.

## Build for production

```bash
npm run build    # outputs a static site to dist/
npm run preview  # serve the production build locally to check it
```

`dist/` is a fully static bundle — host it on any static host (Netlify, GitHub Pages, S3, a plain file server). The build uses a relative base path, so it works from any sub-path. There is nothing to configure and no server-side component.

---

## How to use it

- **The Ledger** (first tab)
  - **Add a name** to start a case file on a coworker.
  - Each card shows their total **stress points**, a **heat meter**, a **trend** (this week vs. last week — *getting worse / easing off / holding steady*), and how many incidents are on file.
  - Tap **Mild (+1)**, **Tense (+2)**, or **Meltdown (+3)** to open the **"What happened?"** sheet. Pick a severity, tap any **trigger chips** that apply (or **skip the paperwork**), and **File it**.
  - The **Recent Incidents** feed lists your latest entries with a relative timestamp and an **undo** button.
  - **✕** on a card strikes that coworker from the record (with a confirm step).
  - Under **Move the file between devices**: **Back up** downloads your whole ledger as a JSON file, **Restore** loads one back in, and **Shred the whole file** wipes everything (with a confirm step).
- **Patterns** (second tab)
  - **When stress lands** — a heatmap of stress points by weekday × time-of-day block (Early / Morning / Midday / Afternoon / Evening / After-hours).
  - **What sets it off** — your most frequent triggers.
  - **Worst day of the week** — average stress points per weekday.

The header always shows **incidents this week · all-time incidents filed · total stress points**.

### Moving your ledger between devices

There's no account and no server, so data doesn't sync automatically — you move it yourself with a backup file:

1. On the device that has your ledger, scroll to **Move the file between devices** and tap **Back up**. This downloads `stress-ledger-YYYY-MM-DD.json`.
2. Get that file onto the other device (AirDrop, email it to yourself, a USB stick, your cloud drive — whatever).
3. On the other device, open the app and tap **Restore**, then pick the file.
   - If that device is empty, it loads straight in.
   - If it already has data, you'll get a confirm showing both counts — **Restore replaces that device's ledger** (it doesn't merge).

Imported files are validated defensively: anything that isn't a real Stress Ledger backup is rejected with a message, and individual records with bad/unknown fields are dropped rather than trusted. The same backup file is also your safety net against clearing browser data.

---

## Data & privacy

- State is one JSON object under the `localStorage` key **`stress-ledger:v1`**:
  ```jsonc
  {
    "version": 1,
    "coworkers": [{ "id": "...", "name": "...", "epithet": "..." }],
    "incidents": [{ "id": "...", "coworkerId": "...", "severity": "mild|tense|melt", "trigger": "meeting|...|null", "timestamp": 1718400000000 }]
  }
  ```
- All reads/writes are wrapped in `try/catch`. If storage is unavailable or corrupt, the app starts from a clean empty state rather than crashing.
- Logging an incident with multiple trigger chips files **one incident per chip** (each tagged offense is its own line); logging with no chips files a single untagged incident.

## Accessibility & responsive

- **Mobile-first, with a real desktop layout** — on phones it's a single column; at **≥880px** it becomes a centered, framed **two-column** layout (ledger cards beside the recent feed; the heatmap beside the trigger/weekday charts) with scaled-up type, so desktop isn't just zoomed-in mobile.
- Pinch-zoom is allowed, interactive controls are **≥44px** touch targets, and muted text meets **WCAG AA** contrast (≥4.5:1).
- Keyboard accessible with visible focus rings; the logging sheet closes on **Esc**, moves focus inward on open, and **returns focus** to the button that opened it on close.
- Honors **`prefers-reduced-motion`** (drops the stamp slam, shake, and splat).
- Coworker names are rendered as text (never as HTML), so they can't inject markup.

---

## Project layout

```
index.html              # app entry (loads the Anton display font + the React app)
vite.config.js          # Vite + React, relative base for portable static builds
src/
  main.jsx              # React root
  App.jsx               # app shell + state, localStorage persistence, derivations
  data.js               # model, persistence, time/score/pattern helpers (no React)
  styles.css            # the full design system (ported from the design export)
  components/
    Masthead.jsx        # brand + header stats
    PeopleView.jsx      # banner, add coworker, ledger cards, feed, reset
    PatternsView.jsx    # heatmap, top triggers, worst-weekday charts
    TagSheet.jsx        # "What happened?" slide-up sheet
    Stamp.jsx           # the "Filed" stamp overlay
    widgets.jsx         # heat meter, trend pill, severity mark, log buttons, icons
_design-source/         # the original Claude Design export, kept for reference
```

## Stack

[React 18](https://react.dev) + [Vite 5](https://vitejs.dev). No other runtime dependencies.
