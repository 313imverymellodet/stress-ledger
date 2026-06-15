/* ============================================================
   STRESS LEDGER — "What happened?" tag-picker sheet
   ============================================================ */
import React, { useState, useEffect, useRef } from 'react';
import { SEVERITIES, SEV_ORDER, TRIGGERS } from '../data.js';

export function TagSheet({ open, target, onClose, onFile }) {
  // target: { coworkerId, name, sevKey } | null
  const [sevKey, setSevKey] = useState('tense');
  const [picked, setPicked] = useState([]);
  const sheetRef = useRef(null);
  const fileBtnRef = useRef(null);
  const triggerRef = useRef(null);
  const wasOpen = useRef(false);

  // sync severity from the button that opened the sheet
  useEffect(() => {
    if (open && target) {
      setSevKey(target.sevKey || 'tense');
      setPicked([]);
    }
  }, [open, target]);

  // close on Escape; move focus into the sheet when it opens.
  // Depends only on `open` so unrelated re-renders don't yank focus around.
  useEffect(() => {
    if (!open) return;
    triggerRef.current = document.activeElement; // the button that opened the sheet
    const onKey = e => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => {
      if (fileBtnRef.current) fileBtnRef.current.focus();
    }, 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // restore focus to the trigger when the sheet closes
  useEffect(() => {
    if (wasOpen.current && !open) {
      const el = triggerRef.current;
      if (el && typeof el.focus === 'function') el.focus();
    }
    wasOpen.current = open;
  }, [open]);

  function toggleChip(id) {
    setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  }
  function file(withTags) {
    onFile({ sevKey, triggerIds: withTags ? picked : [] });
  }

  const name = target ? target.name : '';

  return (
    <>
      <div
        className={'scrim' + (open ? ' open' : '')}
        onClick={onClose}
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
      />
      <div
        ref={sheetRef}
        className={'sheet' + (open ? ' open' : '')}
        role="dialog"
        aria-modal="true"
        aria-label="Log an incident"
        aria-hidden={!open}
        style={{ transform: open ? 'translateY(0)' : 'translateY(102%)' }}
      >
        <div className="sheet-grip" aria-hidden="true" />

        <div className="sheet-q">What<br />happened?</div>
        <div className="sheet-who">
          <span className="dot" aria-hidden="true" />
          Filing against <strong style={{ marginLeft: 4 }}>{name || '—'}</strong>
        </div>

        {/* severity */}
        <div className="sheet-label">How bad was it</div>
        <div className="sev-pick">
          {SEV_ORDER.map(k => (
            <button
              key={k}
              className={'sev-opt ' + k + (sevKey === k ? ' on' : '')}
              aria-pressed={sevKey === k}
              onClick={() => setSevKey(k)}
            >
              <span className="l">{SEVERITIES[k].label}</span>
              <span className="p">+{SEVERITIES[k].pts}</span>
            </button>
          ))}
        </div>

        {/* triggers */}
        <div className="sheet-label">
          Tag the offense {picked.length ? `· ${picked.length} selected` : '· optional'}
        </div>
        <div className="chips">
          {TRIGGERS.map(t => (
            <button
              key={t.id}
              className={'chip' + (picked.includes(t.id) ? ' on' : '')}
              aria-pressed={picked.includes(t.id)}
              onClick={() => toggleChip(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="sheet-foot">
          <button ref={fileBtnRef} className="file-btn" onClick={() => file(true)}>
            File it <span className="arrow" aria-hidden="true">▸</span>
          </button>
          <button className="skip-btn" onClick={() => file(false)}>
            skip the paperwork
          </button>
        </div>
      </div>
    </>
  );
}
