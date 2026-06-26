// charts.jsx — lightweight hand-built SVG charts. Exposed on window.
(function () {
  const { useState, useEffect, useRef } = React;

  function useInView(threshold = 0.2) {
    const ref = useRef(null);
    const [seen, setSeen] = useState(false);
    useEffect(() => {
      if (seen) return;
      // Hidden/paused tab: skip the reveal animation and show the end-state.
      if (document.hidden) { setSeen(true); return; }
      if (!ref.current) return;
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => e.isIntersecting && setSeen(true));
      }, { threshold });
      io.observe(ref.current);
      // Safety net in case IO never fires.
      const tm = setTimeout(() => setSeen(true), 1200);
      return () => { io.disconnect(); clearTimeout(tm); };
    }, [seen]);
    return [ref, seen];
  }

  // ---------- Sparkline ----------
  function Sparkline({ data, color = '#2E75B6', w = 96, h = 32 }) {
    const min = Math.min(...data), max = Math.max(...data);
    const rng = max - min || 1;
    const pts = data.map((v, i) => [
      (i / (data.length - 1)) * w,
      h - 3 - ((v - min) / rng) * (h - 6),
    ]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = `${d} L ${w} ${h} L 0 ${h} Z`;
    const id = 'sg' + color.replace('#', '');
    return (
      <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.18" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.8" fill={color} />
      </svg>
    );
  }

  // ---------- Donut ----------
  function Donut({ data, size = 190, thickness = 26, onSlice, activeLabel, centerLabel, unit = '' }) {
    const [ref, seen] = useInView();
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const r = (size - thickness) / 2;
    const c = 2 * Math.PI * r;
    let acc = 0;
    const [hover, setHover] = useState(null);
    const activeI = data.findIndex((d) => d.label === activeLabel);
    const shown = hover !== null ? hover : (activeI >= 0 ? activeI : null);
    return (
      <div ref={ref} style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {data.map((d, i) => {
            const frac = d.value / total;
            const dash = frac * c;
            const dim = (activeI >= 0 && activeI !== i) || (hover !== null && hover !== i);
            const seg = (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={d.color} strokeWidth={shown === i ? thickness + 5 : thickness}
                strokeDasharray={`${seen ? dash : 0} ${c}`} strokeDashoffset={-acc}
                strokeLinecap="butt"
                style={{ transition: 'stroke-dasharray .9s var(--ease) ' + (i * 0.06) + 's, stroke-width .2s, opacity .2s', cursor: onSlice ? 'pointer' : 'default', opacity: dim ? 0.32 : 1 }}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                onClick={() => onSlice && onSlice(d.label)} />
            );
            acc += dash;
            return seg;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div className="tnum" style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.03em', color: 'var(--ink)' }}>
            {shown !== null ? data[shown].value + unit : total + unit}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, maxWidth: size - thickness * 2, textAlign: 'center', lineHeight: 1.2 }}>
            {shown !== null ? data[shown].label : (centerLabel || 'Total')}
          </div>
        </div>
      </div>
    );
  }

  // ---------- Funnel ----------
  function Funnel({ data }) {
    const [ref, seen] = useInView();
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((d, i) => {
          const pct = Math.min((d.value / max) * 100, 100);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 120, flex: 'none', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', textAlign: 'right' }}>{d.label}</div>
              <div style={{ flex: 1, position: 'relative', height: 38, minWidth: 0 }}>
                <div style={{
                  height: '100%', width: seen ? (d.value > 0 ? pct + '%' : '0%') : '0%', background: d.color,
                  borderRadius: 9, display: 'flex', alignItems: 'center', paddingLeft: 14, minWidth: d.value > 0 ? 34 : 0,
                  transition: 'width .9s var(--ease) ' + (i * 0.09) + 's', boxShadow: 'var(--sh-xs)',
                }}>
                  <span className="tnum" style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{d.value}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ---------- Line chart ----------
  function LineChart({ data, w = 620, h = 220, color = '#2E75B6' }) {
    const [ref, seen] = useInView();
    const pad = { l: 34, r: 12, t: 14, b: 26 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const max = Math.max(...data) * 1.1, min = 0;
    const rng = max - min || 1;
    const X = (i) => pad.l + (i / (data.length - 1)) * iw;
    const Y = (v) => pad.t + ih - ((v - min) / rng) * ih;
    // smooth path
    let d = `M ${X(0)} ${Y(data[0])}`;
    for (let i = 1; i < data.length; i++) {
      const x0 = X(i - 1), y0 = Y(data[i - 1]), x1 = X(i), y1 = Y(data[i]);
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    const area = `${d} L ${X(data.length - 1)} ${pad.t + ih} L ${X(0)} ${pad.t + ih} Z`;
    const gridY = [0, 0.25, 0.5, 0.75, 1].map((f) => pad.t + ih - f * ih);
    const len = 1400;
    const labels = ['', 'Feb', '', 'Mar', '', 'Abr', '', 'May', '', 'Jun', '', 'Jul'];
    return (
      <svg ref={ref} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="lcg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.16" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridY.map((y, i) => (
          <line key={i} x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--line-2)" strokeWidth="1" />
        ))}
        {[0, 0.5, 1].map((f, i) => (
          <text key={i} x={pad.l - 8} y={pad.t + ih - f * ih + 4} textAnchor="end" fontSize="10.5" fill="var(--ink-4)" fontWeight="600">{Math.round(f * max)}</text>
        ))}
        <path d={area} fill="url(#lcg)" style={{ opacity: seen ? 1 : 0, transition: 'opacity .8s .4s' }} />
        <path d={d} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round"
          strokeDasharray={len} strokeDashoffset={seen ? 0 : len}
          style={{ transition: 'stroke-dashoffset 1.3s var(--ease)' }} />
        {data.map((v, i) => (
          <circle key={i} cx={X(i)} cy={Y(v)} r="3" fill="#fff" stroke={color} strokeWidth="2"
            style={{ opacity: seen ? 1 : 0, transition: 'opacity .3s ' + (0.6 + i * 0.05) + 's' }} />
        ))}
        {labels.map((l, i) => l ? (
          <text key={i} x={X(i)} y={h - 6} textAnchor="middle" fontSize="10.5" fill="var(--ink-4)" fontWeight="600">{l}</text>
        ) : null)}
      </svg>
    );
  }

  // ---------- Combo bars (ventas/alquileres apiladas) + línea comisión ----------
  function ComboChart({ meses, ventas, alquileres, comision, w = 660, h = 280,
                        onMonth, activeMonth, showVentas = true, showAlquileres = true, showComision = true }) {
    const [ref, seen] = useInView();
    const pad = { l: 36, r: 44, t: 16, b: 28 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const totals = meses.map((_, i) => (showVentas ? ventas[i] : 0) + (showAlquileres ? alquileres[i] : 0));
    const maxBar = Math.max(...totals, 1) * 1.25;
    const maxLine = Math.max(...comision, 1) * 1.2;
    const n = meses.length;
    const slot = iw / n;
    const bw = Math.min(26, slot * 0.5);
    const X = (i) => pad.l + slot * i + slot / 2;
    const YB = (v) => pad.t + ih - (v / maxBar) * ih;
    const YL = (v) => pad.t + ih - (v / maxLine) * ih;
    let d = `M ${X(0)} ${YL(comision[0])}`;
    for (let i = 1; i < n; i++) {
      const x0 = X(i - 1), y0 = YL(comision[i - 1]), x1 = X(i), y1 = YL(comision[i]);
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    const grid = [0, 0.25, 0.5, 0.75, 1];
    const lineLen = 1600;
    return (
      <svg ref={ref} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        {grid.map((f, i) => {
          const y = pad.t + ih - f * ih;
          return <g key={i}>
            <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--line-2)" strokeWidth="1" />
            <text x={pad.l - 8} y={y + 4} textAnchor="end" fontSize="10.5" fill="var(--ink-4)" fontWeight="600">{Math.round(f * maxBar)}</text>
            {showComision && <text x={w - pad.r + 8} y={y + 4} textAnchor="start" fontSize="10.5" fill="#7A5AE0" fontWeight="600">{Math.round(f * maxLine)}k</text>}
          </g>;
        })}
        {meses.map((m, i) => {
          const active = activeMonth === m;
          const dim = activeMonth && !active;
          const vv = showVentas ? ventas[i] : 0;
          const va = showAlquileres ? alquileres[i] : 0;
          const hv = (vv / maxBar) * ih;
          const ha = (va / maxBar) * ih;
          const x = X(i) - bw / 2;
          return (
            <g key={i} onClick={() => onMonth && onMonth(m)} style={{ cursor: onMonth ? 'pointer' : 'default' }}>
              {onMonth && <rect x={X(i) - slot / 2} y={pad.t} width={slot} height={ih} fill={active ? 'rgba(46,117,182,.07)' : 'transparent'} />}
              <g style={{ transform: seen ? 'scaleY(1)' : 'scaleY(0)', transformOrigin: `0 ${pad.t + ih}px`, transition: `transform .7s var(--ease) ${i * 0.04}s`, opacity: dim ? 0.4 : 1 }}>
                {showVentas && <rect x={x} y={YB(vv + va)} width={bw} height={hv} rx="3" fill="#2E75B6" />}
                {showAlquileres && <rect x={x} y={YB(va)} width={bw} height={ha} rx="3" fill="#0ea5a3" />}
              </g>
            </g>
          );
        })}
        {showComision && <path d={d} fill="none" stroke="#7A5AE0" strokeWidth="2.4" strokeLinecap="round"
          strokeDasharray={lineLen} strokeDashoffset={seen ? 0 : lineLen}
          style={{ transition: 'stroke-dashoffset 1.3s var(--ease) .3s' }} />}
        {showComision && comision.map((v, i) => (
          <circle key={i} cx={X(i)} cy={YL(v)} r="3" fill="#fff" stroke="#7A5AE0" strokeWidth="2"
            style={{ opacity: seen ? 1 : 0, transition: `opacity .3s ${0.5 + i * 0.04}s` }} />
        ))}
        {meses.map((m, i) => (
          <text key={i} x={X(i)} y={h - 8} textAnchor="middle" fontSize="10" fontWeight={activeMonth === m ? 700 : 600}
            fill={activeMonth === m ? 'var(--blue)' : 'var(--ink-4)'}>{m}</text>
        ))}
      </svg>
    );
  }

  // ---------- Horizontal bars (zonas) ----------
  function HBars({ data, w = 320, unit = '', accent = '#2E75B6', onBar, activeLabel }) {
    const [ref, seen] = useInView();
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
      <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map((d, i) => {
          const active = activeLabel && d.label === activeLabel;
          const dim = activeLabel && !active;
          return (
            <div key={i} onClick={() => onBar && onBar(d.label)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: onBar ? 'pointer' : 'default', opacity: dim ? 0.4 : 1, transition: 'opacity .2s' }}>
              <div style={{ width: 84, flex: 'none', fontSize: 13, fontWeight: active ? 700 : 600, color: active ? 'var(--blue)' : 'var(--ink-2)' }}>{d.label}</div>
              <div style={{ flex: 1, height: 26, background: 'var(--bg)', borderRadius: 7, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: seen ? (d.value / max) * 100 + '%' : '0%', background: d.color || accent,
                  borderRadius: 7, transition: `width .8s var(--ease) ${i * 0.07}s`, boxShadow: active ? '0 0 0 2px rgba(46,117,182,.25) inset' : 'none' }} />
              </div>
              <div className="tnum" style={{ width: 70, flex: 'none', textAlign: 'right', fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{d.value}{unit}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // ---------- Bars-only chart (operaciones por mes) — barras redondeadas, degradado, tooltip ----------
  function roundedTopRect(x, y, w, h, r) {
    if (h <= 0) return '';
    r = Math.min(r, w / 2, h);
    return `M ${x} ${y + h} L ${x} ${y + r} Q ${x} ${y} ${x + r} ${y} L ${x + w - r} ${y} Q ${x + w} ${y} ${x + w} ${y + r} L ${x + w} ${y + h} Z`;
  }
  function OpsBarChart({ meses, ventas, alquileres, comision, onMonth, activeMonth, showV = true, showA = true, w = 680, h = 300 }) {
    const [ref, seen] = useInView();
    const [hover, setHover] = useState(null);
    const pad = { l: 28, r: 14, t: 26, b: 30 };
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const totals = meses.map((_, i) => (showV ? ventas[i] : 0) + (showA ? alquileres[i] : 0));
    const maxBar = Math.max(...totals, 1);
    const niceMax = Math.max(2, Math.ceil(maxBar / 2) * 2);
    const n = meses.length, slot = iw / n, bw = Math.min(30, slot * 0.56), gap = 2.5;
    const base = pad.t + ih;
    const X = (i) => pad.l + slot * i + slot / 2;
    const sH = (v) => (v / niceMax) * ih;
    const grid = [0, 0.5, 1];
    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4f96d4" /><stop offset="1" stopColor="#2E75B6" /></linearGradient>
            <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1bb8b5" /><stop offset="1" stopColor="#0ea5a3" /></linearGradient>
          </defs>
          {grid.map((f, i) => {
            const y = base - f * ih;
            return <g key={i}>
              <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--line-2)" strokeWidth="1" strokeDasharray={f === 0 ? '0' : '4 5'} />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" fontSize="10.5" fill="var(--ink-4)" fontWeight="600">{Math.round(f * niceMax)}</text>
            </g>;
          })}
          {meses.map((m, i) => {
            const active = activeMonth === m, dim = activeMonth && !active;
            const vv = showV ? ventas[i] : 0, va = showA ? alquileres[i] : 0;
            const hV = sH(vv), hA = sH(va), x = X(i) - bw / 2;
            const bothShown = vv > 0 && va > 0;
            const total = vv + va;
            const topY = base - hV - hA - (bothShown ? gap : 0);
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onClick={() => onMonth && onMonth(m)}
                style={{ cursor: onMonth ? 'pointer' : 'default' }}>
                <rect x={X(i) - slot / 2 + 3} y={pad.t - 6} width={slot - 6} height={ih + 12} rx="9"
                  fill={active ? 'rgba(46,117,182,.08)' : (hover === i ? 'rgba(46,117,182,.05)' : 'transparent')}
                  style={{ transition: 'fill .15s' }} />
                <g style={{ transform: seen ? 'scaleY(1)' : 'scaleY(0)', transformOrigin: `0 ${base}px`, transition: `transform .65s var(--ease) ${i * 0.04}s`, opacity: dim ? 0.4 : 1 }}>
                  {showA && va > 0 && <path d={roundedTopRect(x, base - hV - hA - (bothShown ? gap : 0), bw, hA, 6)} fill="url(#gA)" />}
                  {showV && vv > 0 && <path d={roundedTopRect(x, base - hV, bw, hV, va > 0 ? 0 : 6)} fill="url(#gV)" />}
                </g>
                {total > 0 && (
                  <text x={X(i)} y={topY - 7} textAnchor="middle" fontSize="11" fontWeight="700"
                    fill={active ? 'var(--blue)' : 'var(--ink-3)'} className="tnum"
                    style={{ opacity: seen ? 1 : 0, transition: `opacity .3s ${0.4 + i * 0.04}s` }}>{total}</text>
                )}
                <text x={X(i)} y={h - 8} textAnchor="middle" fontSize="10.5" fontWeight={active ? 700 : 600}
                  fill={active ? 'var(--blue)' : 'var(--ink-4)'}>{m}</text>
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div className="bar-tip" style={{ left: (X(hover) / w) * 100 + '%' }}>
            <div className="bar-tip-mes">{meses[hover]}</div>
            {showV && <div className="bar-tip-row"><span><span className="bt-dot" style={{ background: '#2E75B6' }} />Ventas</span><b>{ventas[hover]}</b></div>}
            {showA && <div className="bar-tip-row"><span><span className="bt-dot" style={{ background: '#0ea5a3' }} />Alquileres</span><b>{alquileres[hover]}</b></div>}
            <div className="bar-tip-row sep"><span>Comisión</span><b className="tnum">{comision[hover]}k €</b></div>
          </div>
        )}
      </div>
    );
  }

  Object.assign(window, { Sparkline, Donut, Funnel, LineChart, ComboChart, OpsBarChart, HBars, useInView });
})();
