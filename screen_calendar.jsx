// screen_calendar.jsx — Calendario de visitas (semana/día), arrastrar para mover
(function () {
  const { useState } = React;
  const { Button, Icon, Modal, Select, Input } = window;

  const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const startOfWeek = (d) => {
    const r = new Date(d);
    const day = (r.getDay() + 6) % 7; // lunes = 0
    r.setDate(r.getDate() - day);
    r.setHours(0, 0, 0, 0);
    return r;
  };
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const slotISO = (day, hour) => { const d = new Date(day); d.setHours(hour, 0, 0, 0); return d.toISOString(); };
  const toLocalInput = (iso) => {
    const d = new Date(iso); if (isNaN(d)) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Modal para crear / editar una visita
  function VisitModal({ open, onClose, leads, properties, initial, onCreate, onMove, onDelete }) {
    const isEdit = initial && initial.id;
    const [leadId, setLeadId] = useState(initial && initial.lead_id || (leads[0] && leads[0].id) || '');
    const [when, setWhen] = useState(toLocalInput(initial && initial.scheduled_for) || '');
    const [propId, setPropId] = useState(initial && initial.property_id || '');
    const [notes, setNotes] = useState(initial && initial.notes || '');

    React.useEffect(() => {
      setLeadId(initial && initial.lead_id || (leads[0] && leads[0].id) || '');
      setWhen(toLocalInput(initial && initial.scheduled_for) || '');
      setPropId(initial && initial.property_id || '');
      setNotes(initial && initial.notes || '');
    }, [initial]);

    const save = () => {
      if (!leadId || !when) return;
      const iso = new Date(when).toISOString();
      if (isEdit) onMove(initial.id, iso);
      else onCreate({ lead_id: leadId, scheduled_for: iso, property_id: propId || null, notes });
      onClose();
    };

    return (
      <Modal open={open} onClose={onClose} width={500}>
        <div style={{ padding: '22px 24px' }}>
          <h2 className="t-h2" style={{ margin: '0 0 16px' }}>{isEdit ? 'Editar visita' : 'Nueva visita'}</h2>
          <div className="field">
            <label>Interesado</label>
            <Select value={leadId} onChange={(e) => setLeadId(e.target.value)} disabled={isEdit}
              options={leads.map((l) => ({ value: l.id, label: l.nombre }))} />
          </div>
          <div style={{ marginTop: 12 }} className="field">
            <label>Fecha y hora</label>
            <input type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          {properties && properties.length > 0 && (
            <div style={{ marginTop: 12 }} className="field">
              <label>Propiedad (opcional)</label>
              <Select value={propId} onChange={(e) => setPropId(e.target.value)}
                options={[{ value: '', label: '— Sin propiedad —' }, ...properties.map((p) => ({ value: p.id, label: p.titulo }))]} />
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <Input label="Notas" textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalles de la visita…" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 20 }}>
            <div>
              {isEdit && <Button variant="secondary" icon="trash" onClick={() => { onDelete(initial.id); onClose(); }}>Eliminar</Button>}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="secondary" onClick={onClose}>Cancelar</Button>
              <Button variant="primary" icon="check" onClick={save} disabled={!leadId || !when}>{isEdit ? 'Guardar' : 'Crear visita'}</Button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  function CalendarScreen({ visits = [], leads = [], properties = [], onCreateVisit, onMoveVisit, onDeleteVisit }) {
    const [view, setView] = useState('week');
    const [anchor, setAnchor] = useState(new Date());
    const [modal, setModal] = useState(null); // { initial } | null
    const [dragId, setDragId] = useState(null);

    const leadName = (id, visit) => { const l = leads.find((x) => x.id === id); if (l) return l.nombre; if (visit && visit.lead_name) return visit.lead_name.replace(/^Visita\s*[·\-]?\s*/i, ''); return 'Interesado'; };

    const days = view === 'week'
      ? Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i))
      : [new Date(anchor)];

    const visitsInCell = (day, hour) => visits.filter((v) => {
      if (v.status !== 'programada') return false;
      const d = new Date(v.scheduled_for);
      return sameDay(d, day) && d.getHours() === hour;
    });

    const onDropSlot = (day, hour) => {
      if (!dragId) return;
      onMoveVisit(dragId, slotISO(day, hour));
      setDragId(null);
    };

    const rangeLabel = view === 'week'
      ? `${days[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : new Date(anchor).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const step = (n) => setAnchor((a) => addDays(a, view === 'week' ? n * 7 : n));

    return (
      <div className="page">
        <div className="page-head">
          <div className="ph-l">
            <h1 className="t-h1">Calendario de visitas</h1>
            <span className="sub">{visits.filter((v) => v.status === 'programada').length} visitas programadas · arrastra para mover</span>
          </div>
          <div className="toolbar">
            <div className="seg">
              <button className={view === 'week' ? 'active' : ''} onClick={() => setView('week')}>Semana</button>
              <button className={view === 'day' ? 'active' : ''} onClick={() => setView('day')}>Día</button>
            </div>
            <Button variant="secondary" onClick={() => step(-1)}><Icon name="chevronDown" size={16} style={{ transform: 'rotate(90deg)' }} /></Button>
            <Button variant="secondary" onClick={() => setAnchor(new Date())}>Hoy</Button>
            <Button variant="secondary" onClick={() => step(1)}><Icon name="chevronDown" size={16} style={{ transform: 'rotate(-90deg)' }} /></Button>
            <Button variant="primary" icon="plus" onClick={() => setModal({ initial: null })}>Nueva visita</Button>
          </div>
        </div>

        <div style={{ fontWeight: 600, color: 'var(--ink-2)', margin: '4px 0 14px', textTransform: 'capitalize' }}>{rangeLabel}</div>

        <div className="cal-wrap" style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 12, background: 'var(--surface, #fff)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `64px repeat(${days.length}, minmax(120px, 1fr))`, minWidth: view === 'week' ? 760 : 360 }}>
            {/* Cabecera */}
            <div style={{ borderBottom: '1px solid var(--line)', borderRight: '1px solid var(--line-2)' }} />
            {days.map((d, i) => {
              const today = sameDay(d, new Date());
              return (
                <div key={i} style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid var(--line)', borderRight: i < days.length - 1 ? '1px solid var(--line-2)' : 'none', background: today ? 'var(--blue-50)' : 'transparent' }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>{DAY_LABELS[(d.getDay() + 6) % 7]}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: today ? 'var(--blue)' : 'var(--ink)' }}>{d.getDate()}</div>
                </div>
              );
            })}

            {/* Filas por hora */}
            {HOURS.map((h) => (
              <React.Fragment key={h}>
                <div style={{ padding: '6px 8px', fontSize: 11.5, color: 'var(--ink-3)', textAlign: 'right', borderRight: '1px solid var(--line-2)', borderBottom: '1px solid var(--line-2)' }}>{h}:00</div>
                {days.map((d, di) => {
                  const cell = visitsInCell(d, h);
                  return (
                    <div key={di}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={() => onDropSlot(d, h)}
                      onClick={() => { if (cell.length === 0) setModal({ initial: { scheduled_for: slotISO(d, h) } }); }}
                      style={{ minHeight: 46, padding: 3, borderRight: di < days.length - 1 ? '1px solid var(--line-2)' : 'none', borderBottom: '1px solid var(--line-2)', cursor: cell.length === 0 ? 'pointer' : 'default', background: dragId ? 'rgba(46,117,182,0.04)' : 'transparent' }}>
                      {cell.map((v) => (
                        <div key={v.id}
                          draggable
                          onDragStart={() => setDragId(v.id)}
                          onDragEnd={() => setDragId(null)}
                          onClick={(e) => { e.stopPropagation(); setModal({ initial: v }); }}
                          style={{ background: 'var(--blue)', color: '#fff', borderRadius: 6, padding: '4px 6px', fontSize: 11, marginBottom: 3, cursor: 'grab', lineHeight: 1.25 }}>
                          <div style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leadName(v.lead_id, v)}</div>
                          <div style={{ opacity: 0.85 }}>{new Date(v.scheduled_for).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {leads.length === 0 && (
          <p style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 14 }}>Aún no tienes interesados. Crea uno en Base de datos para poder programar visitas.</p>
        )}

        {modal && (
          <VisitModal
            open={!!modal}
            onClose={() => setModal(null)}
            leads={leads}
            properties={properties}
            initial={modal.initial}
            onCreate={onCreateVisit}
            onMove={onMoveVisit}
            onDelete={onDeleteVisit}
          />
        )}
      </div>
    );
  }

  window.CalendarScreen = CalendarScreen;
})();
