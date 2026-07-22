// screen_dashboard.jsx — Análisis simplificado: solo ingresos económicos reales + simulador
(function () {
  const { Icon, Button } = window;
  const { useState, useMemo } = React;
  const fmtEur = window.fmtEur;

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
          <h3>💰 Simulador de ingresos potenciales</h3>
          <span className="ph-sub">Selecciona propiedades disponibles y estima tu comisión si cierras estas operaciones</span>
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

        {sellable.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            No hay propiedades disponibles. Todas están vendidas o alquiladas.
          </div>
        )}

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

  // ── BANNER DE OPERACIONES APROXIMADAS ─────────────────────────────────
  function ApproximateOperationsNotice({ operations }) {
    const approximate = operations?.filter(op => op.notes && op.notes.includes('histórica generada automáticamente')) || [];
    if (approximate.length === 0) return null;

    return (
      <div style={{
        background: '#fff8f0',
        border: '1px solid #fbbf24',
        borderRadius: 'var(--r-lg)',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        <Icon name="alertCircle" size={20} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#d97706', marginBottom: 4 }}>
            {approximate.length} {approximate.length === 1 ? 'operación aproximada' : 'operaciones aproximadas'}
          </div>
          <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
            Se encontraron propiedades que ya estaban Vendido o Alquilado. Sus operaciones se crearon automáticamente con datos deducidos.
            <br />Revisa los detalles (fecha, precio, comisión) y ajusta si los datos no son exactos.
          </div>
        </div>
      </div>
    );
  }

  // ── OPERACIONES CERRADAS POR MES ───────────────────────────────────────
  function ClosedOperations({ operations, properties, onEditOperation }) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [viewMode, setViewMode] = useState('monthly'); // 'monthly' o 'annual'
    const [editValues, setEditValues] = useState({}); // Estado local para los valores que se están editando
    const [saving, setSaving] = useState({}); // Track pending saves por operación
    const debounceTimers = React.useRef({}); // Timers para debounce

    const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    // Filtrar operaciones del mes seleccionado
    const monthOps = useMemo(() => {
      if (!operations) return [];
      return operations.filter(op => {
        const opDate = new Date(op.operation_date);
        return opDate.getMonth() === currentMonth && opDate.getFullYear() === currentYear;
      });
    }, [operations, currentMonth, currentYear]);

    // Calcular comisiones anuales por mes (considerando editValues locales)
    const annualData = useMemo(() => {
      if (!operations) return [];
      const months = {};
      for (let m = 0; m < 12; m++) {
        months[m] = { ventas: 0, alquileres: 0, comisiones: 0 };
      }
      operations.forEach(op => {
        const opDate = new Date(op.operation_date);
        if (opDate.getFullYear() === currentYear) {
          const m = opDate.getMonth();
          // Usar editValues si existe, sino usar el porcentaje guardado
          const pct = editValues[op.id] !== undefined ? +editValues[op.id] : (op.commission_percentage || 0);
          const commission = op.operation_price * (pct / 100);
          if (op.operation_type === 'sale') months[m].ventas++;
          else months[m].alquileres++;
          months[m].comisiones += commission;
        }
      });
      return months;
    }, [operations, currentYear, editValues]);

    // Calcular comisiones considerando editValues
    const ventas = monthOps.filter(op => op.operation_type === 'sale').length;
    const alquileres = monthOps.filter(op => op.operation_type === 'rental').length;
    const totalComision = monthOps.reduce((s, op) => {
      const pct = editValues[op.id] !== undefined ? +editValues[op.id] : op.commission_percentage;
      return s + (op.operation_price * (pct / 100));
    }, 0);

    const prevMonth = () => {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    };

    const nextMonth = () => {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    };

    const goToToday = () => {
      const now = new Date();
      setCurrentMonth(now.getMonth());
      setCurrentYear(now.getFullYear());
    };

    const getPropertyTitle = (propId) => {
      const prop = properties?.find(p => p.id === propId);
      return prop?.titulo || 'Propiedad desconocida';
    };

    // Actualizar valor local y guardar automáticamente en la BD con debounce
    const updateCommission = (op, newPct) => {
      const numPct = newPct === '' ? '' : +newPct;

      // Actualizar estado local para que el input se actualice en tiempo real
      setEditValues(v => ({ ...v, [op.id]: newPct }));

      // Validar antes de guardar
      if (numPct === '' || numPct < 0 || numPct > 100) return;

      // Limpiar timer anterior si existe
      if (debounceTimers.current[op.id]) {
        clearTimeout(debounceTimers.current[op.id]);
      }

      // Crear nuevo timer (esperar 500ms sin escritura antes de guardar)
      debounceTimers.current[op.id] = setTimeout(() => {
        setSaving(s => ({ ...s, [op.id]: true }));
        // Usar numPct que ya está validado
        const finalPct = numPct;
        const newComm = op.operation_price * (finalPct / 100);

        fetch(`/api/crm/operations/${op.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: 'default-client',
            commission_percentage: finalPct,
            commission_amount: newComm,
          }),
        })
          .then((res) => {
            if (res.ok) {
              setSaving(s => ({ ...s, [op.id]: false }));
              // Mantener editValues para que el input muestre el valor que el usuario escribió
            } else {
              throw new Error('Save failed');
            }
          })
          .catch(err => {
            console.error('Error updating operation:', err);
            setSaving(s => ({ ...s, [op.id]: false }));
          });
      }, 500);
    };

    return (
      <div className="panel">
        <div className="panel-head">
          <h3>✅ Operaciones cerradas</h3>
          <span className="ph-sub">Ingresos reales por mes</span>
        </div>

        {/* Controles de vista */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant={viewMode === 'monthly' ? 'primary' : 'secondary'} size="sm" onClick={() => setViewMode('monthly')}>Mensual</Button>
            <Button variant={viewMode === 'annual' ? 'primary' : 'secondary'} size="sm" onClick={() => setViewMode('annual')}>Anual</Button>
          </div>

          {viewMode === 'monthly' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Button variant="secondary" icon="chevronDown" size={16} onClick={prevMonth} style={{ transform: 'rotate(90deg)' }} />
              <div style={{ fontSize: 16, fontWeight: 600, minWidth: 150, textAlign: 'center', textTransform: 'capitalize' }}>
                {monthName}
              </div>
              <Button variant="secondary" icon="chevronDown" size={16} onClick={nextMonth} style={{ transform: 'rotate(-90deg)' }} />
              <Button variant="secondary" size="sm" onClick={goToToday}>Hoy</Button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Button variant="secondary" icon="chevronDown" size={16} onClick={() => setCurrentYear(currentYear - 1)} style={{ transform: 'rotate(90deg)' }} />
              <div style={{ fontSize: 16, fontWeight: 600, minWidth: 100, textAlign: 'center' }}>
                {currentYear}
              </div>
              <Button variant="secondary" icon="chevronDown" size={16} onClick={() => setCurrentYear(currentYear + 1)} style={{ transform: 'rotate(-90deg)' }} />
              <Button variant="secondary" size="sm" onClick={() => setCurrentYear(today.getFullYear())}>Hoy</Button>
            </div>
          )}
        </div>

        {/* KPIs */}
        {viewMode === 'monthly' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'var(--blue-50)', padding: '16px 12px', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Ventas</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--blue)' }}>{ventas}</div>
            </div>
            <div style={{ background: '#e7f6f5', padding: '16px 12px', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0ea5a3', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Alquileres</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0ea5a3' }}>{alquileres}</div>
            </div>
            <div style={{ background: '#f0fdf4', padding: '16px 12px', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5cb338', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Comisiones</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#5cb338' }}>{fmtEur(totalComision).replace(' €', '')}</div>
            </div>
          </div>
        )}

        {/* Vista mensual o anual */}
        {viewMode === 'monthly' && monthOps.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 700, color: 'var(--ink-2)' }}>Propiedad</th>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 700, color: 'var(--ink-2)' }}>Operación</th>
                  <th style={{ textAlign: 'center', padding: '8px 0', fontWeight: 700, color: 'var(--ink-2)' }}>Fecha</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 700, color: 'var(--ink-2)' }}>Importe</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 700, color: 'var(--ink-2)' }}>% Comisión</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 700, color: 'var(--ink-2)' }}>Comisión</th>
                </tr>
              </thead>
              <tbody>
                {monthOps.map((op, i) => {
                  const opDate = new Date(op.operation_date);
                  const dateStr = opDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const opTypeLabel = op.operation_type === 'sale' ? 'Venta' : 'Alquiler';
                  const isApproximate = op.notes && op.notes.includes('histórica generada automáticamente');
                  const displayPct = editValues[op.id] !== undefined ? editValues[op.id] : op.commission_percentage;
                  const currentComm = op.operation_price * ((editValues[op.id] !== undefined ? +editValues[op.id] : op.commission_percentage) / 100);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--line-2)', backgroundColor: isApproximate ? 'rgba(251, 191, 36, 0.05)' : 'transparent', opacity: saving[op.id] ? 0.6 : 1 }}>
                      <td style={{ padding: '8px 0', color: 'var(--ink)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {getPropertyTitle(op.property_id)}
                          {isApproximate && <span style={{ fontSize: 10, background: '#fbbf24', color: '#92400e', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Aprox.</span>}
                        </div>
                      </td>
                      <td style={{ padding: '8px 0', color: 'var(--ink-2)' }}>{opTypeLabel}</td>
                      <td style={{ padding: '8px 0', textAlign: 'center', color: 'var(--ink-2)' }}>{dateStr}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--ink)', fontWeight: 600, fontFamily: 'monospace' }}>{fmtEur(op.operation_price)}</td>
                      <td style={{ padding: '8px 0', textAlign: 'center' }}>
                        <input type="number" min="0" max="100" step="0.5"
                          value={displayPct}
                          onChange={(e) => updateCommission(op, e.target.value)}
                          style={{ width: 50, padding: '4px', textAlign: 'center', border: '1px solid var(--line)', borderRadius: 4, opacity: saving[op.id] ? 0.6 : 1, cursor: 'text' }} />
                        <span style={{ marginLeft: 4 }}>%</span>
                      </td>
                      <td style={{ padding: '8px 0', textAlign: 'right', color: 'var(--green)', fontWeight: 700, fontFamily: 'monospace' }}>{fmtEur(currentComm)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'monthly' ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            Sin operaciones cerradas este mes.
          </div>
        ) : (
          // Vista anual
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {(() => {
              const monthLabels = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
              return monthLabels.map((label, idx) => {
                const data = annualData[idx];
                const hasData = data.ventas > 0 || data.alquileres > 0;
                return (
                  <div key={idx} style={{
                    padding: '12px',
                    background: hasData ? 'var(--blue-50)' : 'var(--bg)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--r-md)',
                    opacity: hasData ? 1 : 0.5,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 8 }}>{label} {currentYear}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--green)', fontFamily: 'monospace', marginBottom: 8 }}>
                      {fmtEur(data.comisiones)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: '1.4' }}>
                      <div>{data.ventas} venta{data.ventas !== 1 ? 's' : ''}</div>
                      <div>{data.alquileres} alquiler{data.alquileres !== 1 ? 'es' : ''}</div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    );
  }

  // ── DASHBOARD PRINCIPAL ────────────────────────────────────────────────
  function DashboardScreen({ analytics, properties, operations, onAction }) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="t-h1">Análisis</h1>
            <span className="sub">Rendimiento económico de tu negocio inmobiliario</span>
          </div>
        </div>

        {/* Banner de operaciones aproximadas */}
        <ApproximateOperationsNotice operations={operations} />

        {/* Operaciones cerradas — Bloque principal */}
        <div className="dash-grid" style={{ gridTemplateColumns: '1fr', marginBottom: 32 }}>
          <ClosedOperations operations={operations || []} properties={properties} />
        </div>

        {/* Simulador de ingresos potenciales */}
        <div className="dash-grid" style={{ gridTemplateColumns: '1fr' }}>
          <IncomeSimulator properties={properties} />
        </div>
      </div>
    );
  }

  window.DashboardScreen = DashboardScreen;
})();
