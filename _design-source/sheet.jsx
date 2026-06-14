/* ============================================================
   STRESS LEDGER — "What happened?" tag-picker sheet
   ============================================================ */

function TagSheet({ open, target, onClose, onFile }){
  // target: { personId, name, sevKey } | null
  const [sevKey, setSevKey] = useState('tense');
  const [picked, setPicked] = useState([]);

  // sync severity from the button that opened the sheet
  useEffect(() => {
    if (open && target){
      setSevKey(target.sevKey || 'tense');
      setPicked([]);
    }
  }, [open, target]);

  function toggleChip(id){
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function file(withTags){
    onFile({ sevKey, triggerIds: withTags ? picked : [] });
  }

  const name = target ? target.name : '';

  return (
    <React.Fragment>
      <div className={'scrim' + (open ? ' open' : '')} onClick={onClose}
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}></div>
      <div className={'sheet' + (open ? ' open' : '')} role="dialog" aria-modal="true"
        style={{ transform: open ? 'translateY(0)' : 'translateY(102%)' }}>
        <div className="sheet-grip"></div>

        <div className="sheet-q">What<br/>happened?</div>
        <div className="sheet-who">
          <span className="dot"></span>
          Filing against <strong style={{ marginLeft: 4 }}>{name || '\u2014'}</strong>
        </div>

        {/* severity */}
        <div className="sheet-label">How bad was it</div>
        <div className="sev-pick">
          {SEV_ORDER.map(k => (
            <button key={k}
              className={'sev-opt ' + k + (sevKey === k ? ' on' : '')}
              onClick={() => setSevKey(k)}>
              <span className="l">{SEVERITIES[k].label}</span>
              <span className="p">+{SEVERITIES[k].pts}</span>
            </button>
          ))}
        </div>

        {/* triggers */}
        <div className="sheet-label">Tag the offense {picked.length ? `· ${picked.length} selected` : '· optional'}</div>
        <div className="chips">
          {TRIGGERS.map(t => (
            <button key={t.id}
              className={'chip' + (picked.includes(t.id) ? ' on' : '')}
              onClick={() => toggleChip(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="sheet-foot">
          <button className="file-btn" onClick={() => file(true)}>
            File it <span className="arrow">{'\u25B8'}</span>
          </button>
          <button className="skip-btn" onClick={() => file(false)}>
            skip the paperwork
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { TagSheet });
