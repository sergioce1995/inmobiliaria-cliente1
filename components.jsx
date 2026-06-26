// ZADI — shared components
// Exposed on window for cross-file use under Babel.

const { useState, useEffect, useRef, useMemo } = React;

// ── Format helpers ─────────────────────────────────────────────
const fmtPrice = (n) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(n);
const priceLabel = (p) => p.type === 'compra' ? `€${fmtPrice(p.price)}` : `€${fmtPrice(p.price)}/mes`;
const priceLabelShort = (p) => {
  if (p.type === 'compra') {
    return p.price >= 1000000 ? `€${(p.price / 1000000).toFixed(2)}M` : `€${Math.round(p.price / 1000)}k`;
  }
  return `€${fmtPrice(p.price)}`;
};

// ── Visual placeholder ──────────────────────────────────────────
// Each property has a `tone` hue. We draw a tinted gradient + a soft
// minimal architectural mark — used as a *fallback* when the photo URL
// fails to load (img errors out and we keep the placeholder visible).
function Placeholder({ tone = 0, kind = 'Piso', size = 'card' }) {
  const a = `hsl(${tone}, 32%, 78%)`;
  const b = `hsl(${(tone + 30) % 360}, 28%, 60%)`;
  const c = `hsl(${(tone + 60) % 360}, 24%, 45%)`;
  const gradient = `linear-gradient(135deg, ${a} 0%, ${b} 60%, ${c} 100%)`;
  return (
    <div className="placeholder" style={{ background: gradient }}>
      <svg viewBox="0 0 200 200" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinejoin="round">
        {kind === 'Villa' || kind === 'Chalet' || kind === 'Casa' || kind === 'Casa rural' ? (
          <g>
            <path d="M30 110 L100 55 L170 110 L170 170 L30 170 Z" fill="rgba(255,255,255,0.12)" />
            <path d="M30 110 L100 55 L170 110" />
            <rect x="55" y="130" width="28" height="40" fill="rgba(255,255,255,0.18)" />
            <rect x="100" y="120" width="50" height="30" fill="rgba(255,255,255,0.18)" />
            <line x1="100" y1="55" x2="100" y2="170" />
          </g>
        ) : kind === 'Ático' || kind === 'Loft' ? (
          <g>
            <rect x="40" y="55" width="120" height="115" fill="rgba(255,255,255,0.12)" />
            <rect x="40" y="55" width="120" height="35" fill="rgba(255,255,255,0.18)" />
            <line x1="100" y1="55" x2="100" y2="170" />
            <line x1="40" y1="125" x2="160" y2="125" />
            <line x1="40" y1="90" x2="160" y2="90" />
          </g>
        ) : kind === 'Dúplex' ? (
          <g>
            <rect x="40" y="60" width="120" height="110" fill="rgba(255,255,255,0.12)" />
            <line x1="40" y1="115" x2="160" y2="115" />
            <rect x="60" y="80" width="30" height="20" fill="rgba(255,255,255,0.18)" />
            <rect x="110" y="80" width="30" height="20" fill="rgba(255,255,255,0.18)" />
            <rect x="60" y="135" width="30" height="20" fill="rgba(255,255,255,0.18)" />
            <rect x="110" y="135" width="30" height="20" fill="rgba(255,255,255,0.18)" />
          </g>
        ) : (
          <g>
            <rect x="40" y="50" width="120" height="120" fill="rgba(255,255,255,0.12)" />
            <line x1="40" y1="100" x2="160" y2="100" />
            <line x1="100" y1="50" x2="100" y2="170" />
            <rect x="60" y="70" width="25" height="20" fill="rgba(255,255,255,0.18)" />
            <rect x="115" y="70" width="25" height="20" fill="rgba(255,255,255,0.18)" />
            <rect x="60" y="120" width="25" height="20" fill="rgba(255,255,255,0.18)" />
            <rect x="115" y="120" width="25" height="20" fill="rgba(255,255,255,0.18)" />
          </g>
        )}
      </svg>
    </div>
  );
}

// Photo with placeholder fallback. The placeholder sits behind the img
// and shows through if the network photo fails (onerror hides the img).
function PropertyImage({ p, className = 'photo' }) {
  const [failed, setFailed] = React.useState(false);
  return (
    <>
      <Placeholder tone={p.tone} kind={p.kind} />
      {p.photo && !failed && (
        <div className={className}>
          <img src={p.photo} alt={p.title} loading="lazy"
               onError={() => setFailed(true)} />
        </div>
      )}
    </>
  );
}

// ── Icons ──────────────────────────────────────────────────────
const Icon = {
  Bed: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 19V8h18v11" /><path d="M3 15h18" /><circle cx="7" cy="12" r="1.5" /></svg>,
  Bath: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3z" /><path d="M6 11V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2" /><path d="M7 18v2M17 18v2" /></svg>,
  Area: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M4 9h4M4 15h4M9 4v4M15 4v4M9 16v4M15 16v4M16 9h4M16 15h4" /></svg>,
  Pin: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>,
  Heart: ({ filled }) => <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 7-3.75A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10z" /></svg>,
  Search: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.65" y2="16.65" /></svg>,
  List: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" /></svg>,
  Map: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z" /><line x1="9" y1="4" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="20" /></svg>,
  Close: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  Chevron: () => <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l4 4 4-4" /></svg>,
  Arrow: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
  Building: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="1" /><line x1="9" y1="7" x2="9" y2="7" /><line x1="15" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="9" y2="11" /><line x1="15" y1="11" x2="15" y2="11" /><path d="M11 21v-4h2v4" /></svg>,
  House: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>,
  Villa: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 11h20l-3-5H5z" /><path d="M4 11v10h16V11" /><rect x="10" y="14" width="4" height="7" /><path d="M6 14h2v3H6zM16 14h2v3h-2z" /></svg>,
  Studio: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="1" /><line x1="3" y1="11" x2="21" y2="11" /></svg>,
  Duplex: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="1" /><line x1="4" y1="12" x2="20" y2="12" /><rect x="7" y="7" width="3" height="2.5" /><rect x="14" y="7" width="3" height="2.5" /><rect x="7" y="14.5" width="3" height="2.5" /><rect x="14" y="14.5" width="3" height="2.5" /></svg>,
  Penthouse: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h18" /><path d="M5 11v10h14V11" /><path d="M7 5h10v6H7z" /><path d="M10 21v-4h4v4" /></svg>,
  Loft: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13" /><path d="M3 21h18" /><line x1="12" y1="8" x2="12" y2="21" /></svg>,
  Rural: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V11l8-7 8 7v10" /><path d="M2 11l10-8 10 8" /><rect x="10" y="13" width="4" height="8" /></svg>,
};

// Map property kind to an icon component
const kindIcons = {
  'Piso': Icon.Building,
  'Ático': Icon.Penthouse,
  'Villa': Icon.Villa,
  'Chalet': Icon.Villa,
  'Dúplex': Icon.Duplex,
  'Estudio': Icon.Studio,
  'Loft': Icon.Loft,
  'Apartamento': Icon.Building,
  'Casa rural': Icon.Rural,
  'Casa': Icon.House,
};

// ── Header ─────────────────────────────────────────────────────
function Header({ favorites, onScrollTo }) {
  return (
    <header className="header">
      <div className="container header-inner">
        <a className="logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Paula Gutiérrez</a>
        <nav className="nav">
          <a onClick={() => onScrollTo('catalogo')}>Catálogo</a>
          <a onClick={() => onScrollTo('vender')}>Vender</a>
          <a onClick={() => onScrollTo('sobre')}>Sobre Nosotros</a>
          <a onClick={() => onScrollTo('contacto')}>Contacto</a>
        </nav>
        <button className="icon-btn" title={`${favorites} favoritos`} aria-label="Favoritos">
          <Icon.Heart filled={favorites > 0} />
        </button>
      </div>
    </header>
  );
}

// ── Hero ───────────────────────────────────────────────────────
// Minimal hero: headline + sub + single live counter pill + CTA.
// Search controls live in the sticky filter bar below — no duplication.
function Hero({ count, onScrollTo }) {
  return (
    <section className="container hero">
      <div className="hero-copy">
        <div className="eyebrow" style={{ marginBottom: '1.25rem' }}>Inmobiliaria · Tenerife</div>
        <h1>Encuentra tu hogar<br /><em>donde vive el sol.</em></h1>
        <div className="hero-cta">
          <button className="hero-btn" onClick={() => onScrollTo('catalogo')}>
            Ver catálogo <Icon.Arrow />
          </button>
          <div className="hero-pill">
            <span className="pulse-dot" />
            <b>{count}</b> propiedades activas
          </div>
        </div>
      </div>
      <div className="hero-visual">
        <img src="/images/hero/paula.jpg" alt="Paula Gutiérrez" onError={(e) => { e.target.style.display = 'none'; }} />
        <div className="hero-tag">
          <b>Paula Gutiérrez</b>
          <span>Tu agente de confianza en Tenerife</span>
        </div>
      </div>
    </section>
  );
}

function SearchBar({ filters, setFilters, onSearch }) {
  const set = (k, v) => setFilters({ ...filters, [k]: v });
  return (
    <div className="searchbar" role="search">
      <div className="search-field">
        <label>Operación</label>
        <select value={filters.type} onChange={(e) => set('type', e.target.value)}>
          <option value="compra">Comprar</option>
          <option value="alquiler">Alquilar</option>
        </select>
      </div>
      <div className="search-field">
        <label>Zona</label>
        <input type="text" placeholder="Tenerife · cualquier zona"
          value={filters.area} onChange={(e) => set('area', e.target.value)} />
      </div>
      <div className="search-field">
        <label>{filters.type === 'compra' ? 'Precio máx.' : 'Mensualidad máx.'}</label>
        <select value={filters.maxPrice} onChange={(e) => set('maxPrice', e.target.value)}>
          <option value="">Sin límite</option>
          {filters.type === 'compra' ? (
            <>
              <option value="200000">€200.000</option>
              <option value="400000">€400.000</option>
              <option value="600000">€600.000</option>
              <option value="1000000">€1M</option>
              <option value="1500000">€1.5M</option>
            </>
          ) : (
            <>
              <option value="1000">€1.000</option>
              <option value="1500">€1.500</option>
              <option value="2000">€2.000</option>
              <option value="3000">€3.000</option>
            </>
          )}
        </select>
      </div>
      <button className="search-btn" onClick={onSearch}>
        <Icon.Search /> Buscar
      </button>
    </div>
  );
}

// ── Dual range slider ──────────────────────────────────────────
// Two overlaid native sliders + a fill bar between them. Native thumbs
// stay accessible; pointer-events:none on the rail and re-enabled on the
// thumbs only so each thumb is independently grabbable.
function DualRangeSlider({ min, max, step, valueMin, valueMax, onChange, format = (v) => v }) {
  const vMin = valueMin === '' || valueMin == null ? min : Number(valueMin);
  const vMax = valueMax === '' || valueMax == null ? max : Number(valueMax);
  const pct = (v) => ((v - min) / (max - min)) * 100;

  const handleMin = (e) => {
    const v = Math.min(Number(e.target.value), vMax - step);
    onChange({ min: v === min ? '' : v, max: valueMax });
  };
  const handleMax = (e) => {
    const v = Math.max(Number(e.target.value), vMin + step);
    onChange({ min: valueMin, max: v === max ? '' : v });
  };

  return (
    <div className="rangewrap">
      <div className="range-values">
        <div>
          <span className="pop-label">Desde</span>
          <b>{format(vMin)}</b>
        </div>
        <span className="dash" />
        <div style={{ textAlign: 'right' }}>
          <span className="pop-label">Hasta</span>
          <b>{format(vMax)}{vMax === max ? '+' : ''}</b>
        </div>
      </div>
      <div className="rangetrack">
        <div className="range-fill" style={{ left: `${pct(vMin)}%`, right: `${100 - pct(vMax)}%` }} />
        <input type="range" className="range-input" min={min} max={max} step={step}
          value={vMin} onChange={handleMin} aria-label="Mínimo" />
        <input type="range" className="range-input" min={min} max={max} step={step}
          value={vMax} onChange={handleMax} aria-label="Máximo" />
      </div>
    </div>
  );
}

// ── Filter chip popover ────────────────────────────────────────
// Popover is rendered into document.body via a portal so it escapes the
// subbar's backdrop-filter stacking context (which otherwise traps it
// behind the Leaflet map regardless of z-index).
function FilterChip({ label, value, hasValue, children, wide }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    // Anchor so the popover sits below + roughly aligned with the chip,
    // but never past the viewport's right edge (popovers can be 320–380px).
    const width = wide ? 380 : 320;
    const left = Math.min(r.left, window.innerWidth - width - 16);
    setPos({ left: Math.max(16, left), top: r.bottom + 8 });
  }, [open, wide]);

  return (
    <>
      <button
        ref={btnRef}
        className={`chip ${hasValue ? 'has-value' : ''}`}
        aria-pressed={open}
        onClick={() => setOpen(!open)}
      >
        {label}{value ? `: ${value}` : ''}
        {hasValue && !open && <span className="chip-dot" />}
        <Icon.Chevron />
      </button>
      {open && ReactDOM.createPortal(
        <>
          <div className="popover-overlay" onClick={() => setOpen(false)} />
          <div className={`popover ${wide ? 'wide' : ''}`} style={{ left: pos.left, top: pos.top }} onClick={(e) => e.stopPropagation()}>
            {typeof children === 'function' ? children(() => setOpen(false)) : children}
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// ── Filter bar with chips ──────────────────────────────────────
function FilterBar({ filters, setFilters, view, setView, count }) {
  const set = (k, v) => setFilters({ ...filters, [k]: v });
  const reset = () => setFilters({
    type: filters.type, area: '', maxPrice: '', minPrice: '',
    rooms: '', kind: '', furnished: '', sort: 'novedad',
  });
  const hasFilters = filters.area || filters.maxPrice || filters.minPrice || filters.rooms || filters.kind || filters.furnished;

  return (
    <div className="subbar">
      <div className="container subbar-inner">
        {/* Tipo de operación: segmented inline */}
        <div className="toggle-view accent" role="tablist" aria-label="Tipo de operación">
          <div className="toggle-thumb" style={{
            transform: `translateX(${filters.type === 'alquiler' ? '100%' : '0'})`,
            width: 'calc(50% - 3px)',
          }} />
          <button aria-pressed={filters.type === 'compra'} onClick={() => set('type', 'compra')}>Comprar</button>
          <button aria-pressed={filters.type === 'alquiler'} onClick={() => set('type', 'alquiler')}>Alquilar</button>
        </div>

        {/* Precio */}
        <FilterChip
          wide
          label="Precio"
          value={
            filters.minPrice || filters.maxPrice
              ? `${filters.minPrice ? `€${fmtPrice(filters.minPrice)}` : ''} – ${filters.maxPrice ? `€${fmtPrice(filters.maxPrice)}` : ''}`
              : ''
          }
          hasValue={!!filters.maxPrice || !!filters.minPrice}
        >
          {(close) => {
            const rng = filters.type === 'compra'
              ? { min: 0, max: 1500000, step: 25000, fmt: (v) => v === 0 ? '€0' : v >= 1000000 ? `€${(v/1000000).toFixed(2)}M` : `€${Math.round(v/1000)}k`, presets: [200000, 400000, 600000, 1000000] }
              : { min: 0, max: 3500, step: 50, fmt: (v) => v === 0 ? '€0' : `€${fmtPrice(v)}`, presets: [1000, 1500, 2000, 3000] };
            return (
              <>
                <div>
                  <div className="pop-title">Rango de precio</div>
                  <div className="pop-sub">{filters.type === 'compra' ? 'Precio total' : 'Mensualidad'}</div>
                </div>
                <DualRangeSlider
                  min={rng.min} max={rng.max} step={rng.step}
                  valueMin={filters.minPrice} valueMax={filters.maxPrice}
                  format={rng.fmt}
                  onChange={({ min, max }) => setFilters({ ...filters, minPrice: min, maxPrice: max })}
                />
                <div className="range-presets">
                  {rng.presets.map(v => (
                    <button key={v} className="pop-choices-btn"
                      aria-pressed={String(filters.maxPrice) === String(v)}
                      onClick={() => set('maxPrice', v)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        background: String(filters.maxPrice) === String(v) ? 'var(--ink)' : 'var(--bg)',
                        color: String(filters.maxPrice) === String(v) ? 'var(--bg)' : 'var(--ink-2)',
                        border: '1px solid ' + (String(filters.maxPrice) === String(v) ? 'var(--ink)' : 'var(--line-2)'),
                        borderRadius: 'var(--r-pill)',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        font: 'inherit',
                      }}>
                      Hasta {rng.fmt(v)}
                    </button>
                  ))}
                </div>
                <div className="pop-actions">
                  <button className="btn-text" onClick={() => setFilters({ ...filters, minPrice: '', maxPrice: '' })}>Limpiar</button>
                  <button className="btn-pill" onClick={close}>Aplicar</button>
                </div>
              </>
            );
          }}
        </FilterChip>

        {/* Habitaciones */}
        <FilterChip
          label="Habitaciones"
          value={filters.rooms ? `${filters.rooms}+` : ''}
          hasValue={!!filters.rooms}
        >
          {(close) => (
            <>
              <div>
                <div className="pop-title">Habitaciones mínimas</div>
                <div className="pop-sub">Selecciona el mínimo</div>
              </div>
              <div className="num-pills">
                {['1', '2', '3', '4', '5'].map(v => (
                  <button key={v}
                    className={`num-pill ${filters.rooms === v ? 'on' : ''}`}
                    onClick={() => { set('rooms', filters.rooms === v ? '' : v); }}>
                    <span>{v === '5' ? '5+' : v}</span>
                    <small>{v === '1' ? 'hab.' : 'hab.'}</small>
                  </button>
                ))}
              </div>
              <div className="pop-actions">
                <button className="btn-text" onClick={() => set('rooms', '')}>Cualquiera</button>
                <button className="btn-pill" onClick={close}>Aplicar</button>
              </div>
            </>
          )}
        </FilterChip>

        {/* Tipo de propiedad */}
        <FilterChip
          wide
          label="Tipo"
          value={filters.kind || ''}
          hasValue={!!filters.kind}
        >
          {(close) => {
            const types = ['Piso', 'Ático', 'Villa', 'Chalet', 'Dúplex', 'Estudio', 'Loft', 'Casa rural', 'Apartamento'];
            return (
              <>
                <div>
                  <div className="pop-title">Tipo de propiedad</div>
                  <div className="pop-sub">Elige uno o desactiva para ver todo</div>
                </div>
                <div className="type-grid">
                  {types.map(t => {
                    const I = kindIcons[t] || Icon.Building;
                    return (
                      <button key={t}
                        className={`type-card ${filters.kind === t ? 'on' : ''}`}
                        onClick={() => { set('kind', filters.kind === t ? '' : t); }}>
                        <I />
                        <span>{t}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="pop-actions">
                  <button className="btn-text" onClick={() => set('kind', '')}>Limpiar</button>
                  <button className="btn-pill" onClick={close}>Aplicar</button>
                </div>
              </>
            );
          }}
        </FilterChip>

        {/* Condicional: amueblado solo en alquiler */}
        {filters.type === 'alquiler' && (
          <FilterChip
            label="Amueblado"
            value={filters.furnished === 'si' ? 'Sí' : filters.furnished === 'no' ? 'No' : ''}
            hasValue={!!filters.furnished}
          >
            {(close) => {
              const opts = [['', 'Cualquiera'], ['si', 'Amueblado'], ['no', 'Sin amueblar']];
              const idx = opts.findIndex(([v]) => v === (filters.furnished || ''));
              return (
                <>
                  <div>
                    <div className="pop-title">Mobiliario</div>
                  </div>
                  <div className="seg2">
                    <div className="seg2-thumb" style={{
                      left: `calc(3px + ${idx} * (100% - 6px) / ${opts.length})`,
                      width: `calc((100% - 6px) / ${opts.length})`,
                    }} />
                    {opts.map(([v, l]) => (
                      <button key={v || 'any'} className={filters.furnished === v ? 'on' : ''}
                        onClick={() => { set('furnished', v); }}>{l}</button>
                    ))}
                  </div>
                </>
              );
            }}
          </FilterChip>
        )}

        {/* Zona */}
        <FilterChip
          label="Zona"
          value={filters.area || ''}
          hasValue={!!filters.area}
        >
          {(close) => {
            const zones = [
              { name: 'Santa Cruz', meta: 'Capital' },
              { name: 'La Laguna', meta: 'Patrimonio UNESCO' },
              { name: 'Costa Adeje', meta: 'Sur turístico' },
              { name: 'Puerto de la Cruz', meta: 'Norte clásico' },
              { name: 'Los Cristianos', meta: 'Frente al mar' },
              { name: 'El Médano', meta: 'Surf & kite' },
              { name: 'La Orotava', meta: 'Histórico' },
              { name: 'Adeje', meta: 'Resort sur' },
            ];
            return (
              <>
                <div>
                  <div className="pop-title">¿Dónde buscas?</div>
                  <div className="pop-sub">Escribe o elige una zona</div>
                </div>
                <input className="input" type="text" placeholder="Buscar zona…"
                  value={filters.area} onChange={(e) => set('area', e.target.value)} autoFocus />
                <div className="zone-list">
                  {zones.filter(z => !filters.area || z.name.toLowerCase().includes(filters.area.toLowerCase())).map(z => (
                    <button key={z.name}
                      className={`zone-item ${filters.area === z.name ? 'on' : ''}`}
                      onClick={() => { set('area', z.name); close(); }}>
                      <span className="zone-mark"><Icon.Pin /></span>
                      <b>{z.name}</b>
                      <span className="zone-meta">{z.meta}</span>
                    </button>
                  ))}
                </div>
                {filters.area && (
                  <div className="pop-actions">
                    <button className="btn-text" onClick={() => { set('area', ''); }}>Limpiar</button>
                    <button className="btn-pill" onClick={close}>Aplicar</button>
                  </div>
                )}
              </>
            );
          }}
        </FilterChip>

        {hasFilters && (
          <button className="btn-text" onClick={reset}>Limpiar filtros</button>
        )}

        <div className="spacer" />
        <div className="result-count">{count} {count === 1 ? 'propiedad' : 'propiedades'}</div>

        {/* Sort */}
        <select className="chip" style={{ paddingRight: '2rem' }} value={filters.sort}
          onChange={(e) => set('sort', e.target.value)}>
          <option value="novedad">Ordenar: Novedad</option>
          <option value="precio-asc">Precio ↑</option>
          <option value="precio-desc">Precio ↓</option>
          <option value="m2">Más grande</option>
        </select>

        {/* Listado / Mapa */}
        <div className="toggle-view accent" role="tablist" aria-label="Vista">
          <div className="toggle-thumb" style={{
            transform: `translateX(${view === 'mapa' ? '100%' : '0'})`,
            width: 'calc(50% - 3px)',
          }} />
          <button aria-pressed={view === 'listado'} onClick={() => setView('listado')}>
            <Icon.List /> Listado
          </button>
          <button aria-pressed={view === 'mapa'} onClick={() => setView('mapa')}>
            <Icon.Map /> Mapa
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Property card ──────────────────────────────────────────────
function PropertyCard({ p, fav, onFav, onOpen }) {
  return (
    <article className="card" onClick={onOpen}>
      <div className="card-media">
        <PropertyImage p={p} />
        <span className={`badge ${p.type === 'alquiler' ? 'alquiler' : ''}`}>
          {p.type === 'compra' ? 'Compra' : 'Alquiler'}
        </span>
      </div>
      <div className="card-body">
        <div className="card-row">
          <span className="card-title">{p.title}</span>
        </div>
        <div className="card-row">
          <div className="card-area"><Icon.Pin /> {p.area}, {p.city.split(' ').slice(-1)[0]}</div>
          <span className="card-price">
            €{fmtPrice(p.price)}{p.type === 'alquiler' && <small>/mes</small>}
          </span>
        </div>
        <div className="card-specs">
          <span><Icon.Bed /> {p.rooms} hab</span>
          <span><Icon.Bath /> {p.baths} baño{p.baths > 1 ? 's' : ''}</span>
          <span><Icon.Area /> {p.m2} m²</span>
        </div>
      </div>
    </article>
  );
}

// ── List view ──────────────────────────────────────────────────
function ListView({ properties, favorites, onFav, onOpen }) {
  if (properties.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--ink-3)' }}>
        <div style={{ fontFamily: 'Syne', fontSize: '1.4rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.5rem' }}>
          Sin resultados
        </div>
        <p>Prueba a ampliar el rango de precio o cambiar la zona.</p>
      </div>
    );
  }
  return (
    <div className="grid">
      {properties.map(p => (
        <PropertyCard key={p.id} p={p}
          fav={favorites.has(p.id)} onFav={onFav}
          onOpen={() => onOpen(p)}
        />
      ))}
    </div>
  );
}

// ── Detail modal ───────────────────────────────────────────────
// Interest form (Nombre, Apellidos, Email, Teléfono) is the only CTA on the
// right side. Submitting POSTs to window.ZADI_SHEETS_URL if configured —
// see comment near the top of app.jsx for how to wire up Google Sheets.
function DetailModal({ property: p, onClose, fav, onFav, onToast }) {
  const [step, setStep] = useState('view'); // 'view' | 'form' | 'sent'
  const [form, setForm] = useState({ nombre: '', apellidos: '', email: '', telefono: '' });
  const [sending, setSending] = useState(false);
  const photos = (p && (p.photos || p.images)) || [];
  const [photoIdx, setPhotoIdx] = useState(0);
  const currentPhoto = photos[photoIdx]?.url || photos[photoIdx];

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const setF = (k, v) => setForm({ ...form, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    const payload = {
      ...form,
      propertyId: p.id,
      propertyTitle: p.title,
      operacion: p.type,
      precio: p.price,
      m2: p.m2,
      habitaciones: p.rooms,
      zona: p.area,
      ciudad: p.city,
      timestamp: new Date().toISOString(),
    };
    try {
      // Enviar lead directo al CRM
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: 'default-client',
          nombre: form.nombre,
          apellidos: form.apellidos,
          email: form.email,
          telefono: form.telefono,
          origin: 'web_form',
          source_property_id: p.id,
          status: 'nuevo',
          notes: `Interés en: ${p.title} (${p.area}) · ${p.type === 'compra' ? 'Venta' : 'Alquiler'} €${p.price}`,
        }),
      });
      if (res.ok) {
        setStep('sent');
        onToast('¡Solicitud enviada! Te contactaremos en breve.');
      } else {
        throw new Error('No se pudo enviar');
      }
    } catch (err) {
      console.warn('[Paula] Lead POST failed:', err);
      onToast('Error al enviar. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (!p) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <Icon.Close />
        </button>
        <div className="modal-media">
          {currentPhoto ? (
            <img src={currentPhoto} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <PropertyImage p={p} />
          )}
          <span className={`badge ${p.type === 'alquiler' ? 'alquiler' : ''}`}>
            {p.type === 'compra' ? 'En venta' : 'En alquiler'} · {p.kind}
          </span>
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setPhotoIdx((photoIdx - 1 + photos.length) % photos.length); }}
                style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
              <button onClick={(e) => { e.stopPropagation(); setPhotoIdx((photoIdx + 1) % photos.length); }}
                style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.92)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
              <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                {photos.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setPhotoIdx(i); }}
                    style={{ width: i === photoIdx ? 24 : 8, height: 8, borderRadius: 4, border: 'none', background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.55)', cursor: 'pointer', transition: 'all 0.2s' }} />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal-body">
          <div>
            <h2 className="modal-title">{p.title}</h2>
            <div className="modal-loc">
              <Icon.Pin /> {p.area} · {p.city}
            </div>
            <p className="modal-desc" style={{ whiteSpace: 'pre-line' }}>{p.description || p.desc || 'Sin descripción disponible.'}</p>
            {Array.isArray(p.features) && p.features.length > 0 && (
              <div className="modal-features">
                <h4>Características destacadas</h4>
                <ul>{p.features.map(f => <li key={f}>{f}</li>)}</ul>
              </div>
            )}
          </div>
          <aside className="modal-side">
            <div className="modal-price">
              €{fmtPrice(p.price)}
              {p.type === 'alquiler' && <small> /mes</small>}
            </div>
            <div className="modal-specs">
              <div><b>{p.rooms}</b><span>Habitaciones</span></div>
              <div><b>{p.baths}</b><span>Baños</span></div>
              <div><b>{p.m2}</b><span>m²</span></div>
            </div>

            {step === 'view' && (
              <>
                <button className="btn-primary" onClick={() => setStep('form')}>
                  Estoy interesado
                </button>
                {p.year && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-3)', paddingTop: '0.25rem' }}>
                    Construcción: {p.year} · Ref. {p.id.toUpperCase()}
                  </div>
                )}
              </>
            )}

            {step === 'form' && (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: '0.95rem' }}>
                  Tus datos de contacto
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: '-0.5rem' }}>
                  Un agente te contactará en menos de 24h.
                </div>
                <div className="field">
                  <label>Nombre</label>
                  <input className="input" required value={form.nombre}
                    onChange={(e) => setF('nombre', e.target.value)} autoFocus />
                </div>
                <div className="field">
                  <label>Apellidos</label>
                  <input className="input" required value={form.apellidos}
                    onChange={(e) => setF('apellidos', e.target.value)} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input className="input" type="email" required value={form.email}
                    onChange={(e) => setF('email', e.target.value)} />
                </div>
                <div className="field">
                  <label>Teléfono</label>
                  <input className="input" type="tel" required value={form.telefono}
                    onChange={(e) => setF('telefono', e.target.value)}
                    placeholder="+34 600 000 000" />
                </div>
                <button className="btn-primary" type="submit" disabled={sending}>
                  {sending ? 'Enviando…' : 'Enviar solicitud'}
                </button>
                <button type="button" className="btn-text" onClick={() => setStep('view')}
                  style={{ marginTop: '-0.4rem' }}>
                  Cancelar
                </button>
              </form>
            )}

            {step === 'sent' && (
              <div className="sent-state">
                <Icon.Check />
                <b style={{ marginTop: '0.5rem' }}>¡Solicitud recibida!</b>
                Te contactaremos en menos de 24h sobre <em>{p.title}</em>.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

// ── Sell section ───────────────────────────────────────────────
function SellSection({ onToast }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', kind: 'Piso', m2: '', price: '', notes: '' });
  const [sent, setSent] = useState(false);
  const set = (k, v) => setForm({ ...form, [k]: v });
  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm/captaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: 'default-client',
          propietario: form.name,
          email: form.email,
          telefono: form.phone,
          tipo: form.kind,
          direccion: form.address,
          ciudad: '',
          metros_cuadrados: form.m2 ? Number(form.m2) : null,
          notas: form.notes,
          origin: 'web',
        }),
      });
      if (!res.ok) throw new Error('No se pudo enviar');
      setSent(true);
      onToast('Solicitud enviada. Un agente te contactará en 24h.');
    } catch (err) {
      console.warn('[Paula] Captación POST failed:', err);
      onToast('Error al enviar. Inténtalo de nuevo.');
    }
  };

  return (
    <section id="vender" className="sell">
      <div className="container sell-inner">
        <div className="sell-copy">
          <div className="eyebrow" style={{ marginBottom: '1rem' }}>Para propietarios</div>
          <h2>Vende tu propiedad <em>sin complicaciones.</em></h2>
          <p>Te acompañamos paso a paso. Valoración gratuita, fotografía profesional y publicación en los principales portales — incluido el nuestro.</p>
          <ol className="sell-list">
            <li><span className="num">1</span><div><h4>Valoración gratuita</h4><p>Visitamos tu propiedad y te damos un precio realista de mercado en 48h.</p></div></li>
            <li><span className="num">2</span><div><h4>Fotografía y plano</h4><p>Sesión profesional, plano detallado y vídeo tour incluidos sin coste.</p></div></li>
            <li><span className="num">3</span><div><h4>Publicación premium</h4><p>Tu propiedad destacada en Paula Gutiérrez y en los principales portales del país.</p></div></li>
            <li><span className="num">4</span><div><h4>Cierre acompañado</h4><p>Gestionamos visitas, negociación y trámite notarial.</p></div></li>
          </ol>
        </div>

        <form className="sell-form" onSubmit={submit}>
          {sent ? (
            <div className="sent-state">
              <b>¡Solicitud recibida!</b>
              Un asesor de Paula Gutiérrez te contactará en menos de 24 horas para agendar la valoración gratuita.
              <div style={{ marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ width: '100%' }} onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', address: '', kind: 'Piso', m2: '', price: '', notes: '' }); }}>
                  Enviar otra propiedad
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3>Cuéntanos sobre tu propiedad</h3>
              <p>Valoración gratuita y sin compromiso</p>
              <div className="field-row">
                <div className="field"><label>Nombre</label><input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
                <div className="field"><label>Teléfono</label><input className="input" type="tel" required value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
              </div>
              <div className="field"><label>Email</label><input className="input" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
              <div className="field"><label>Dirección de la propiedad</label><input className="input" required value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Calle, número, municipio" /></div>
              <div className="field-row">
                <div className="field">
                  <label>Tipo</label>
                  <select className="input" value={form.kind} onChange={(e) => set('kind', e.target.value)}>
                    {['Piso', 'Ático', 'Villa', 'Chalet', 'Dúplex', 'Estudio', 'Casa rural', 'Local'].map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <div className="field"><label>Superficie (m²)</label><input className="input" type="number" value={form.m2} onChange={(e) => set('m2', e.target.value)} /></div>
              </div>
              <div className="field"><label>Notas adicionales</label><textarea className="input" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Reformas recientes, vistas, garaje…" /></div>
              <button className="btn-primary" type="submit">Solicitar valoración gratuita</button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}

// ── Toast ──────────────────────────────────────────────────────
function Toast({ msg }) {
  if (!msg) return null;
  return <div className="toast"><Icon.Check /> {msg}</div>;
}

// Expose
Object.assign(window, {
  fmtPrice, priceLabel, priceLabelShort,
  Placeholder, PropertyImage, Icon, kindIcons,
  Header, Hero, SearchBar,
  FilterBar, PropertyCard, ListView, DetailModal,
  SellSection, Toast,
  DualRangeSlider,
});
