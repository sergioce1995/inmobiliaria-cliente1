// screen_dashboard.jsx
(function () {
  const { Icon, Sparkline, Donut, Funnel, LineChart, ComboChart, OpsBarChart, HBars, Tabs, Tooltip, Button } = window;
  const { useState } = React;
  const fmtEur = window.fmtEur;

  function KpiCard({ k }) {
    return (
      <div className="kpi">
        <div className="k-label">
          {k.label}
          {k.info && <Tooltip label={k.info} wide><i className="info-i">i</i></Tooltip>}
        </div>
        <div className="k-val tnum" style={{ marginTop: 10 }}>{k.value}</div>
      </div>
    );
  }

  // KPI simple (sin delta) para la pestaña de operaciones
  function StatCard({ s }) {
    return (
      <div className="kpi">
        <div className="k-label">
          {s.label}
          {s.info && <Tooltip label={s.info} wide><i className="info-i">i</i></Tooltip>}
        </div>
        <div className="k-val tnum" style={{ marginTop: 8 }}>{s.value}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 4 }}>{s.sub}</div>
      </div>
    );
  }

  // ── Simulador de ingresos ──────────────────────────────────────────────
  function IncomeSimulator({ properties }) {
    const sellable = properties.filter((p) => p.estado !== 'Vendido');
    const [sel, setSel] = useState(() => sellable.filter((p) => p.estado === 'Disponible').map((p) => p.id));
    const [comm, setComm] = useState(() => Object.fromEntries(sellable.map((p) => [p.id, p.comision])));
    const [prob, setProb] = useState(100);

    const toggle = (id) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
    const commOf = (p) => Math.round(p.precio * (comm[p.id] ?? p.comision) / 100);
    const total = sellable.filter((p) => sel.includes(p.id)).reduce((s, p) => s + commOf(p), 0);
    const weighted = Math.round(total * prob / 100);

    return (
      <div className="panel sim">
        <div className="panel-head">
          <div>
            <h3>Simulador de ingresos</h3>
          </div>
          <span className="ph-sub">Comisión si cierras estas operaciones</span>
        </div>

        <div className="sim-list">
          {sellable.map((p) => {
            const on = sel.includes(p.id);
            return (
              <div key={p.id} className={`sim-row${on ? ' on' : ''}`}>
                <button className="sim-check" onClick={() => toggle(p.id)}>{on && <Icon name="check" size={14} />}</button>
                <div className="sim-info">
                  <div className="sim-title">{p.titulo}</div>
                  <div className="sim-sub tnum">{fmtEur(p.precio)}</div>
                </div>
                <div className="sim-comm">
                  <div className="sim-comm-in">
                    <input type="number" min="0" max="10" step="0.5" value={comm[p.id] ?? p.comision}
                      onChange={(e) => setComm((c) => ({ ...c, [p.id]: e.target.value === '' ? '' : +e.target.value }))} />
                    <span>%</span>
                  </div>
                  <div className="sim-amount tnum">{fmtEur(commOf(p))}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="sim-prob">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>
            <span>Probabilidad de cierre</span><span className="tnum" style={{ color: 'var(--blue)' }}>{prob}%</span>
          </div>
          <input className="sim-slider" type="range" min="10" max="100" step="5" value={prob} onChange={(e) => setProb(+e.target.value)} />
        </div>

        <div className="sim-total">
          <div>
            <div className="st-label">Ingreso estimado{prob < 100 ? ` (·${prob}%)` : ''}</div>
            <div className="st-sub">{sel.length} {sel.length === 1 ? 'propiedad' : 'propiedades'} seleccionadas</div>
          </div>
          <div className="st-value tnum">{fmtEur(weighted)}</div>
        </div>
      </div>
    );
  }

  // ── Pestaña: Rendimiento (leads) ──
  function PerfView({ analytics, properties, onAction }) {
    return (<>
      <div className="dash-grid">
        <div className="panel">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <h3>Estado de los leads</h3>
              <Tooltip label="Cuántos leads tienes en cada etapa: nuevos, contactados, con visita y cerrados." wide><i className="info-i">i</i></Tooltip>
            </div>
            <span className="ph-sub">{analytics.funnel.reduce((a, f) => a + (f.value || 0), 0)} leads en total</span>
          </div>
          <Funnel data={analytics.funnel} />
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Fuentes de leads</h3></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Donut data={analytics.sources} size={170} thickness={24} unit="%" centerLabel="Fuentes" />
            <div className="legend" style={{ flex: 1 }}>
              {analytics.sources.map((s, i) => (
                <div className="legend-item" key={i}>
                  <span className="ld" style={{ background: s.color }} />
                  <span className="ll">{s.label}</span>
                  <span className="lv">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
        <IncomeSimulator properties={properties} />
      </div>
    </>);
  }

  // ── Pestaña: Operaciones — HERRAMIENTA DE ANÁLISIS INTERACTIVA ──
  function OpsView({ ops }) {
    const { useState, useMemo } = React;
    const meses = ops.meses;
    const [fRegimen, setFRegimen] = useState('todos');   // 'todos' | 'Venta' | 'Alquiler'
    const [fTipo, setFTipo] = useState('todos');
    const [fZona, setFZona] = useState('todos');
    const [fMes, setFMes] = useState('todos');
    const [showV, setShowV] = useState(true);
    const [showA, setShowA] = useState(true);
    const [showC, setShowC] = useState(true);
    const [sort, setSort] = useState({ k: 'comision', dir: -1 });

    // Filtro maestro: TODO se calcula sobre este subconjunto.
    const rows = useMemo(() => ops.raw.filter((o) =>
      (fRegimen === 'todos' || o.regimen === fRegimen) &&
      (fTipo === 'todos' || o.tipo === fTipo) &&
      (fZona === 'todos' || o.zona === fZona) &&
      (fMes === 'todos' || o.mes === fMes)
    ), [fRegimen, fTipo, fZona, fMes, ops.raw]);

    // Agregados derivados del subconjunto filtrado
    const agg = useMemo(() => {
      const ventas = meses.map(() => 0), alquileres = meses.map(() => 0), comisionMes = meses.map(() => 0);
      const tipoMap = {}, zonaOps = {}, zonaIng = {};
      let totalComision = 0, sumVenta = 0, nVenta = 0, sumDias = 0;
      rows.forEach((o) => {
        const mi = o.mesIdx;
        if (o.regimen === 'Venta') { ventas[mi]++; sumVenta += o.precio; nVenta++; }
        else alquileres[mi]++;
        comisionMes[mi] += o.comision / 1000;
        tipoMap[o.tipo] = (tipoMap[o.tipo] || 0) + 1;
        zonaOps[o.zona] = (zonaOps[o.zona] || 0) + 1;
        zonaIng[o.zona] = (zonaIng[o.zona] || 0) + o.comision / 1000;
        totalComision += o.comision;
        sumDias += o.dias;
      });
      return {
        ventas, alquileres, comisionMes: comisionMes.map((v) => Math.round(v)),
        tipos: ops.tipos.map((t) => ({ label: t, value: tipoMap[t] || 0, color: ops.tipoColor[t] })),
        regimen: [
          { label: 'Venta', value: rows.filter((o) => o.regimen === 'Venta').length, color: '#2E75B6' },
          { label: 'Alquiler', value: rows.filter((o) => o.regimen === 'Alquiler').length, color: '#0ea5a3' },
        ],
        zonasOps: ops.zonas.map((z) => ({ label: z, value: zonaOps[z] || 0, color: '#2E75B6' })),
        zonasIng: ops.zonas.map((z) => ({ label: z, value: Math.round(zonaIng[z] || 0), color: '#5cb338' })),
        count: rows.length, totalComision,
        ticket: nVenta ? Math.round(sumVenta / nVenta) : 0,
        dias: rows.length ? Math.round(sumDias / rows.length) : 0,
      };
    }, [rows]);

    // Toggle de filtro: volver a pulsar el mismo valor lo desactiva.
    const tog = (cur, set) => (val) => set(cur === val ? 'todos' : val);
    const anyFilter = fRegimen !== 'todos' || fTipo !== 'todos' || fZona !== 'todos' || fMes !== 'todos';
    const clearAll = () => { setFRegimen('todos'); setFTipo('todos'); setFZona('todos'); setFMes('todos'); };

    const sortedRows = useMemo(() => [...rows].sort((a, b) => {
      const av = a[sort.k], bv = b[sort.k];
      if (typeof av === 'number') return (av - bv) * sort.dir;
      return String(av).localeCompare(String(bv)) * sort.dir;
    }), [rows, sort]);
    const setSortK = (k) => setSort((s) => s.k === k ? { k, dir: -s.dir } : { k, dir: 1 });

    const Chip = ({ active, color, onClick, children }) => (
      <button className={`ops-chip${active ? ' active' : ''}`} onClick={onClick}
        style={active && color ? { background: color, borderColor: color } : null}>
        {color && <span className="ops-chip-dot" style={{ background: active ? '#fff' : color }} />}{children}
      </button>
    );

    return (<>
      {/* ── Barra de multifiltro ── */}
      <div className="ops-filters card">
        <div className="ops-fgroup">
          <span className="ops-flabel">Régimen</span>
          <div className="ops-chips">
            <Chip active={fRegimen === 'Venta'} color="#2E75B6" onClick={() => tog(fRegimen, setFRegimen)('Venta')}>Venta</Chip>
            <Chip active={fRegimen === 'Alquiler'} color="#0ea5a3" onClick={() => tog(fRegimen, setFRegimen)('Alquiler')}>Alquiler</Chip>
          </div>
        </div>
        <div className="ops-fdiv" />
        <div className="ops-fgroup">
          <span className="ops-flabel">Tipo</span>
          <div className="ops-chips">
            {ops.tipos.map((t) => (
              <Chip key={t} active={fTipo === t} color={ops.tipoColor[t]} onClick={() => tog(fTipo, setFTipo)(t)}>{t}</Chip>
            ))}
          </div>
        </div>
        <div className="ops-fdiv" />
        <div className="ops-fgroup">
          <span className="ops-flabel">Ciudad</span>
          <div className="ops-chips">
            {ops.zonas.map((z) => (
              <Chip key={z} active={fZona === z} onClick={() => tog(fZona, setFZona)(z)}>{z}</Chip>
            ))}
          </div>
        </div>
        {anyFilter && (
          <button className="ops-clear" onClick={clearAll}><Icon name="close" size={14} />Limpiar filtros</button>
        )}
      </div>

      {/* Resumen del subconjunto filtrado */}
      <div className="ops-summary">
        <Icon name="filter" size={15} />
        <span>Mostrando <b>{agg.count}</b> {agg.count === 1 ? 'operación' : 'operaciones'}
          {fRegimen !== 'todos' && <> · <b>{fRegimen}</b></>}
          {fTipo !== 'todos' && <> · <b>{fTipo}</b></>}
          {fZona !== 'todos' && <> · <b>{fZona}</b></>}
          {fMes !== 'todos' && <> · <b>{fMes}</b></>}
        </span>
      </div>

      <div className="kpi-row">
        <StatCard s={{ label: 'Operaciones', value: agg.count, sub: anyFilter ? 'con estos filtros' : 'este año', info: 'Número de operaciones que cumplen los filtros activos.' }} />
        <StatCard s={{ label: 'Ingresos por comisión', value: fmtEur(agg.totalComision).replace(' €', '') + ' €', sub: 'suma filtrada', info: 'Suma de comisiones de las operaciones mostradas.' }} />
        <StatCard s={{ label: 'Ticket medio venta', value: agg.ticket ? fmtEur(agg.ticket).replace(' €', '') + ' €' : '—', sub: 'solo ventas', info: 'Precio medio de las ventas dentro del filtro.' }} />
        <StatCard s={{ label: 'Días en cartera', value: agg.dias || '—', sub: 'media hasta cerrar', info: 'Tiempo medio desde publicación hasta cierre.' }} />
      </div>

      {/* Gráfico por mes con series conmutables y clic para filtrar mes */}
      <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="panel">
          <div className="panel-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <h3>Operaciones por mes</h3>
              <Tooltip label="Altura de cada barra = nº de operaciones del mes (ventas + alquileres). Pasa el ratón para ver la comisión. Pulsa una columna para filtrar ese mes; pulsa la leyenda para mostrar/ocultar series." wide><i className="info-i">i</i></Tooltip>
            </div>
            <div className="chart-legend">
              <button className={`cl-item tgl${showV ? '' : ' off'}`} onClick={() => setShowV((v) => !v)}><span className="cl-dot" style={{ background: '#2E75B6' }} />Ventas</button>
              <button className={`cl-item tgl${showA ? '' : ' off'}`} onClick={() => setShowA((v) => !v)}><span className="cl-dot" style={{ background: '#0ea5a3' }} />Alquileres</button>
            </div>
          </div>
          <OpsBarChart meses={meses} ventas={agg.ventas} alquileres={agg.alquileres} comision={agg.comisionMes}
            onMonth={(m) => setFMes(fMes === m ? 'todos' : m)} activeMonth={fMes !== 'todos' ? fMes : null}
            showV={showV} showA={showA} />
        </div>
      </div>

      <div className="dash-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>Por tipo de propiedad</h3>
            <span className="ph-sub">Pulsa para filtrar</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Donut data={agg.tipos} size={170} thickness={24} centerLabel="operaciones"
              onSlice={(l) => setFTipo(fTipo === l ? 'todos' : l)} activeLabel={fTipo !== 'todos' ? fTipo : null} />
            <div className="legend" style={{ flex: 1 }}>
              {agg.tipos.map((s, i) => (
                <div className={`legend-item clickable${fTipo === s.label ? ' on' : ''}`} key={i}
                  onClick={() => setFTipo(fTipo === s.label ? 'todos' : s.label)}>
                  <span className="ld" style={{ background: s.color }} />
                  <span className="ll">{s.label}</span>
                  <span className="lv">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Venta vs. alquiler · por ciudad</h3>
            <span className="ph-sub">Pulsa para filtrar</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 6 }}>
            <HBars data={agg.regimen} unit=" ops"
              onBar={(l) => setFRegimen(fRegimen === l ? 'todos' : l)} activeLabel={fRegimen !== 'todos' ? fRegimen : null} />
            <div style={{ borderTop: '1px solid var(--line-2)', paddingTop: 16 }}>
              <span className="t-eyebrow" style={{ display: 'block', marginBottom: 12 }}>Por ciudad · operaciones</span>
              <HBars data={agg.zonasOps} unit=" ops"
                onBar={(l) => setFZona(fZona === l ? 'todos' : l)} activeLabel={fZona !== 'todos' ? fZona : null} />
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="panel">
          <div className="panel-head">
            <h3>Ingresos por ciudad</h3>
            <span className="ph-sub">Comisión filtrada (miles €) · pulsa para filtrar</span>
          </div>
          <HBars data={agg.zonasIng} unit="k €"
            onBar={(l) => setFZona(fZona === l ? 'todos' : l)} activeLabel={fZona !== 'todos' ? fZona : null} />
        </div>
      </div>

      {/* Tabla de resultados — refleja los filtros */}
      <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="panel-head" style={{ padding: '20px 22px 16px', margin: 0 }}>
            <h3>Detalle de operaciones</h3>
            <span className="ph-sub">{sortedRows.length} resultados</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="ztable ops-table">
              <thead>
                <tr>
                  <th onClick={() => setSortK('id')}>Ref.</th>
                  <th onClick={() => setSortK('tipo')}>Tipo</th>
                  <th onClick={() => setSortK('regimen')}>Régimen</th>
                  <th onClick={() => setSortK('zona')}>Ciudad</th>
                  <th onClick={() => setSortK('mesIdx')}>Mes</th>
                  <th onClick={() => setSortK('precio')} style={{ textAlign: 'right' }}>Precio</th>
                  <th onClick={() => setSortK('comision')} style={{ textAlign: 'right' }}>Comisión</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((o) => (
                  <tr key={o.id}>
                    <td className="cell-mut mono">{o.id}</td>
                    <td><span className="op-tipo"><span className="op-dot" style={{ background: ops.tipoColor[o.tipo] }} />{o.tipo}</span></td>
                    <td><span className={`op-reg ${o.regimen === 'Venta' ? 'v' : 'a'}`}>{o.regimen}</span></td>
                    <td>{o.zona}</td>
                    <td className="cell-mut">{o.mes}</td>
                    <td className="tnum" style={{ textAlign: 'right' }}>{o.regimen === 'Venta' ? fmtEur(o.precio) : fmtEur(o.precio) + '/mes'}</td>
                    <td className="tnum cell-budget" style={{ textAlign: 'right' }}>{fmtEur(o.comision)}</td>
                  </tr>
                ))}
                {sortedRows.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ink-3)' }}>Ninguna operación con estos filtros. Prueba a quitar alguno.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>);
  }

  function DashboardScreen({ analytics, properties, onAction }) {
    const [tab, setTab] = useState('rendimiento');
    const [range, setRange] = useState('30d');
    return (
      <div className="page">
        <div className="page-head">
          <div className="ph-l">
            <h1 className="t-h1">Análisis</h1>
            <span className="sub">{tab === 'rendimiento' ? 'Cómo está funcionando tu cartera de leads' : 'Ventas, alquileres e ingresos por comisión'}</span>
          </div>
          <div className="toolbar">
            {tab === 'rendimiento' && (
              <Tabs value={range} onChange={setRange} options={[
                { value: '7d', label: '7 días' }, { value: '30d', label: '30 días' }, { value: '90d', label: '90 días' },
              ]} />
            )}
          </div>
        </div>

        <div className="dash-tabs">
          <button className={`dash-tab${tab === 'rendimiento' ? ' active' : ''}`} onClick={() => setTab('rendimiento')}>
            <Icon name="dashboard" size={18} />Rendimiento
          </button>
          <button className={`dash-tab${tab === 'operaciones' ? ' active' : ''}`} onClick={() => setTab('operaciones')}>
            <Icon name="trend" size={18} />Operaciones e ingresos
          </button>
        </div>

        {tab === 'rendimiento'
          ? <PerfView analytics={analytics} properties={properties} onAction={onAction} />
          : <OpsView ops={analytics.operaciones} />}
      </div>
    );
  }

  window.DashboardScreen = DashboardScreen;
})();
