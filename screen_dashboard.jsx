// screen_dashboard.jsx — Fase 4: Dashboard simplificado + narrativa inteligente
(function () {
  const { Icon, Funnel, LineChart, HBars, Button, Tooltip } = window;
  const { useState, useMemo } = React;
  const fmtEur = window.fmtEur;

  // ── KPI CARD ──────────────────────────────────────────────────────────
  function KpiCard({ k, onClick }) {
    const commonContent = () => (
      <>
        <div className="k-label">{k.label}</div>
        <div className="k-val tnum" style={{ marginTop: 10 }}>{k.value}</div>
      </>
    );

    if (onClick) {
      return (
        <button onClick={onClick} className="kpi" style={{ cursor: 'pointer', border: 'none', background: 'transparent', padding: 0, width: '100%', textAlign: 'left' }}>
          {commonContent()}
        </button>
      );
    }
    return (
      <div className="kpi">
        {commonContent()}
      </div>
    );
  }

  // ── SIMULADOR DE INGRESOS ─────────────────────────────────────────────
  function IncomeSimulator({ properties }) {
    const sellable = properties.filter((p) => p.estado !== 'Vendido' && p.estado !== 'Alquilado');
    const [sel, setSel] = useState(() => sellable.slice(0, 3).map((p) => p.id));
    const [comm, setComm] = useState(() => Object.fromEntries(sellable.map((p) => [p.id, p.comision || 3])));
    const [prob, setProb] = useState(100);

    const toggle = (id) => setSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
    const commOf = (p) => Math.round(p.precio * (comm[p.id] ?? (p.comision || 3)) / 100);
    const total = sellable.filter((p) => sel.includes(p.id)).reduce((s, p) => s + commOf(p), 0);
    const weighted = Math.round(total * prob / 100);

    return (
      <div className="panel sim">
        <div className="panel-head">
          <h3>💰 Simulador de ingresos</h3>
          <span className="ph-sub">Selecciona propiedades y estima tu comisión</span>
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
                    <input type="number" min="0" max="10" step="0.5" value={comm[p.id] ?? (p.comision || 3)}
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

  // ── RESUMEN INTELIGENTE (Narrativa automática) ─────────────────────────
  function SmartSummary({ analytics, properties }) {
    const lines = [];

    if (analytics.operaciones?.raw) {
      const ops = analytics.operaciones.raw;
      const thisMonth = new Date().getMonth();
      const thisYear = new Date().getFullYear();
      const monthOps = ops.filter(o => {
        const d = new Date(o.created_at);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      });

      const ventas = monthOps.filter(o => o.regimen === 'Venta').length;
      const alquileres = monthOps.filter(o => o.regimen === 'Alquiler').length;

      if (ventas > 0 || alquileres > 0) {
        lines.push(`Este mes has realizado ${ventas} ${ventas === 1 ? 'venta' : 'ventas'} y ${alquileres} ${alquileres === 1 ? 'alquiler' : 'alquileres'}.`);
      }

      const totalComm = monthOps.reduce((s, o) => s + (o.comision || 0), 0);
      if (totalComm > 0) {
        lines.push(`Has generado ${fmtEur(totalComm)} en comisiones.`);
      }

      if (ops.length > 0) {
        const avgDias = Math.round(ops.reduce((s, o) => s + (o.dias || 0), 0) / ops.length);
        if (avgDias > 0) {
          lines.push(`La media de cierre de tus operaciones es de ${avgDias} días.`);
        }
      }
    }

    if (properties.length > 0) {
      const tipos = {};
      properties.forEach(p => { tipos[p.tipo] = (tipos[p.tipo] || 0) + 1; });
      const topTipo = Object.entries(tipos).sort((a, b) => b[1] - a[1])[0];
      if (topTipo) {
        const pct = Math.round(topTipo[1] / properties.length * 100);
        lines.push(`Los ${topTipo[0]}s representan el ${pct}% de tu cartera.`);
      }
    }

    return (
      <div style={{ background: 'linear-gradient(135deg, #f0f6fc, #fbfcfe)', border: '1px solid var(--blue-100)', borderRadius: 'var(--r-lg)', padding: '20px 22px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Icon name="sparkle" size={16} style={{ color: 'var(--blue)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Resumen</span>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lines.length > 0 ? lines.map((line, i) => <p key={i} style={{ margin: 0 }}>{line}</p>) : <p style={{ margin: 0, color: 'var(--ink-3)' }}>Sin datos aún. Agrega operaciones para ver el análisis.</p>}
        </div>
      </div>
    );
  }

  // ── DASHBOARD PRINCIPAL ────────────────────────────────────────────────
  function DashboardScreen({ analytics, properties, onAction }) {
    const activeProps = useMemo(() => properties.filter(p => p.estado !== 'Vendido' && p.estado !== 'Alquilado'), [properties]);
    const soldProps = useMemo(() => properties.filter(p => p.estado === 'Vendido'), [properties]);
    const rentedProps = useMemo(() => properties.filter(p => p.estado === 'Alquilado'), [properties]);

    const captacionesPendientes = useMemo(() => {
      return analytics.captacionesPendientes || 0;
    }, [analytics.captacionesPendientes]);

    // Qué estás vendiendo: por tipo
    const propsByType = useMemo(() => {
      const map = {};
      activeProps.forEach(p => { map[p.tipo] = (map[p.tipo] || 0) + 1; });
      return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([tipo, count]) => ({ label: tipo, value: count }));
    }, [activeProps]);

    // Qué estás vendiendo: por ciudad
    const propsByCity = useMemo(() => {
      const map = {};
      activeProps.forEach(p => { map[p.ciudad] = (map[p.ciudad] || 0) + 1; });
      return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([city, count]) => ({ label: city, value: count }));
    }, [activeProps]);

    // Operaciones cerradas
    const closedOps = useMemo(() => {
      const ops = analytics.operaciones?.raw || [];
      const ventas = ops.filter(o => o.regimen === 'Venta').length;
      const alquileres = ops.filter(o => o.regimen === 'Alquiler').length;
      const comision = ops.reduce((s, o) => s + (o.comision || 0), 0);
      return { ventas, alquileres, comision };
    }, [analytics.operaciones]);

    return (
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="t-h1">Rendimiento</h1>
            <span className="sub">Todo lo que necesitas saber sobre tu negocio inmobiliario</span>
          </div>
        </div>

        {/* Resumen inteligente */}
        <SmartSummary analytics={analytics} properties={activeProps} />

        {/* Resumen del negocio — 4 KPIs clave */}
        <div className="kpi-row">
          <KpiCard k={{ label: 'Propiedades activas', value: activeProps.length }} onClick={() => onAction && onAction({ screen: 'propiedades', estado: 'Disponible' })} />
          <KpiCard k={{ label: 'Captaciones pendientes', value: captacionesPendientes }} onClick={() => onAction && onAction({ screen: 'valoraciones', estado: 'pendiente' })} />
          <KpiCard k={{ label: 'Propiedades vendidas', value: soldProps.length }} onClick={() => onAction && onAction({ screen: 'propiedades', estado: 'Vendido' })} />
          <KpiCard k={{ label: 'Propiedades alquiladas', value: rentedProps.length }} onClick={() => onAction && onAction({ screen: 'propiedades', estado: 'Alquilado' })} />
        </div>

        {/* Estado de los interesados */}
        {analytics.funnel && (
          <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="panel">
              <div className="panel-head">
                <h3>📊 Estado de los interesados</h3>
                <span className="ph-sub">{analytics.funnel.reduce((a, f) => a + (f.value || 0), 0)} interesados en total</span>
              </div>
              <Funnel data={analytics.funnel} />
            </div>
          </div>
        )}

        {/* Qué estás vendiendo */}
        <div className="dash-grid">
          <div className="panel">
            <div className="panel-head"><h3>🏠 Por tipo de propiedad</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {propsByType.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{p.label}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {Array(p.value).fill(0).map((_, j) => (
                        <div key={j} style={{ width: 12, height: 12, background: 'var(--blue)', borderRadius: 2 }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, minWidth: 30, textAlign: 'right', color: 'var(--blue)' }}>{p.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h3>📍 Por ciudad</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {propsByCity.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{p.label}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {Array(p.value).fill(0).map((_, j) => (
                        <div key={j} style={{ width: 12, height: 12, background: '#5cb338', borderRadius: 2 }} />
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, minWidth: 30, textAlign: 'right', color: '#5cb338' }}>{p.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Operaciones cerradas */}
        <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="panel">
            <div className="panel-head"><h3>✅ Operaciones cerradas</h3></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div style={{ background: 'var(--blue-50)', padding: '16px 12px', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Ventas</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--blue)' }}>{closedOps.ventas}</div>
              </div>
              <div style={{ background: '#e7f6f5', padding: '16px 12px', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0ea5a3', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Alquileres</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0ea5a3' }}>{closedOps.alquileres}</div>
              </div>
              <div style={{ background: '#f0fdf4', padding: '16px 12px', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#5cb338', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Comisión</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#5cb338' }}>{fmtEur(closedOps.comision).replace(' €', '')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Simulador de ingresos — más protagonismo */}
        <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
          <IncomeSimulator properties={properties} />
        </div>
      </div>
    );
  }

  window.DashboardScreen = DashboardScreen;
})();
