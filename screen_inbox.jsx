// screen_inbox.jsx
(function () {
  const { useState, useEffect } = React;
  const { Avatar, StatusBadge, Button, Select, Icon, Modal, Input, STATUS_LABEL } = window;
  const fmtEur = window.fmtEur;

  const FILTERS = ['todos', 'nuevo', 'contactado', 'interesado', 'cerrado'];
  const FILTER_LABEL = { todos: 'Todos', ...STATUS_LABEL };
  const STATUS_ORDER = { nuevo: 0, contactado: 1, interesado: 2, cerrado: 3 };

  const fmtVisitShort = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Modal para crear un lead manualmente
  function NewLeadModal({ open, onClose, onCreate, properties = [] }) {
    const [form, setForm] = useState({ nombre: '', apellidos: '', email: '', telefono: '', notes: '', source_property_id: '' });
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
    const submit = async () => {
      if (!form.nombre || !form.email) return;
      setSaving(true);
      const ok = await onCreate({ ...form, origin: 'manual', source_property_id: form.source_property_id || null });
      setSaving(false);
      if (ok) { setForm({ nombre: '', apellidos: '', email: '', telefono: '', notes: '', source_property_id: '' }); onClose(); }
    };
    return (
      <Modal open={open} onClose={onClose} width={520}>
        <div style={{ padding: '22px 24px' }}>
          <h2 className="t-h2" style={{ margin: '0 0 4px' }}>Nuevo lead</h2>
          <p style={{ color: 'var(--ink-3)', fontSize: 13.5, margin: '0 0 18px' }}>Añade un contacto manualmente a tu bandeja.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Nombre *" value={form.nombre} onChange={set('nombre')} placeholder="María" />
            <Input label="Apellidos" value={form.apellidos} onChange={set('apellidos')} placeholder="García" />
            <Input label="Email *" value={form.email} onChange={set('email')} placeholder="maria@email.com" />
            <Input label="Teléfono" value={form.telefono} onChange={set('telefono')} placeholder="+34 600 000 000" />
          </div>
          <div style={{ marginTop: 12 }} className="field">
            <label>Propiedad de interés (opcional)</label>
            <Select value={form.source_property_id} onChange={set('source_property_id')}
              options={[{ value: '', label: '— Ninguna —' }, ...properties.map((p) => ({ value: p.id, label: p.titulo }))]} />
          </div>
          <div style={{ marginTop: 12 }}>
            <Input label="Notas" textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="Interesada en pisos en Adeje…" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" icon="check" onClick={submit} disabled={!form.nombre || !form.email || saving}>
              {saving ? 'Guardando…' : 'Crear lead'}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  function LeadCard({ lead, selected, onClick, visit }) {
    return (
      <div className={`lead-card st-${lead.estado}${selected ? ' sel' : ''}`} onClick={onClick}>
        <div className="lc-top">
          <Avatar name={lead.nombre} color={lead.avatar} size={42} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="lc-name">{lead.nombre}</div>
            <div className="lc-meta"><Icon name="location" size={13} />{lead.ciudad} · {lead.origen}</div>
          </div>
          <StatusBadge status={lead.estado} pulse />
        </div>
        {visit && (
          <div style={{ marginTop: 8 }}>
            <span className="badge" style={{ background: 'var(--blue-50)', color: 'var(--blue)' }}>
              <Icon name="calendar" size={12} /> Visita: {fmtVisitShort(visit.scheduled_for)}
            </span>
          </div>
        )}
        <div className="lc-foot">
          <span className="lc-budget tnum">{fmtEur(lead.presupuesto)}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{lead.fecha}</span>
          </span>
        </div>
      </div>
    );
  }

  function InboxScreen({ leads, setLeads, visits = [], properties = [], onCreateLead, onUpdateLead, onDeleteLead, onSaveVisit, onDeleteVisit, extFilter, clearExtFilter }) {
    const [showNew, setShowNew] = useState(false);
    const visitForLead = (id) => visits.find((v) => v.lead_id === id && v.status === 'programada');
    const [filter, setFilter] = useState('todos');
    const [sort, setSort] = useState('estado');
    const [selId, setSelId] = useState(leads[0]?.id || null);

    // Aplicar filtro/lead que llega desde una tarea sugerida del Dashboard
    useEffect(() => {
      if (!extFilter) return;
      if (extFilter.estado) setFilter(extFilter.estado);
      if (extFilter.leadId) setSelId(extFilter.leadId);
    }, [extFilter]);

    const counts = FILTERS.reduce((a, f) => {
      a[f] = f === 'todos' ? leads.length : leads.filter((l) => l.estado === f).length;
      return a;
    }, {});

    let shown = filter === 'todos' ? leads : leads.filter((l) => l.estado === filter);
    shown = [...shown].sort((a, b) => {
      if (sort === 'estado') return STATUS_ORDER[a.estado] - STATUS_ORDER[b.estado] || b.score - a.score;
      if (sort === 'score') return b.score - a.score;
      if (sort === 'presupuesto') return b.presupuesto - a.presupuesto;
      return 0; // recientes = orden original
    });
    const selected = leads.find((l) => l.id === selId) || shown[0];

    const setStatus = (id, estado) => {
      setLeads((ls) => ls.map((l) => l.id === id ? { ...l, estado } : l));
      onUpdateLead && onUpdateLead(id, { status: estado });
    };
    const addNote = (id, txt) => setLeads((ls) => ls.map((l) => l.id === id
      ? { ...l, interacciones: [{ tipo: 'nota', txt, fecha: 'Ahora' }, ...l.interacciones] } : l));

    return (
      <div className="page">
        <div className="page-head">
          <div className="ph-l">
            <h1 className="t-h1">Bandeja de leads</h1>
            <span className="sub">{leads.length} leads · {counts.nuevo} nuevos sin contactar</span>
          </div>
          <div className="toolbar">
            <Select value={sort} onChange={(e) => setSort(e.target.value)} options={[
              { value: 'estado', label: 'Ordenar: Estado' },
              { value: 'score', label: 'Ordenar: Puntuación' },
              { value: 'presupuesto', label: 'Ordenar: Presupuesto' },
              { value: 'recientes', label: 'Ordenar: Recientes' },
            ]} />
            <Button variant="primary" icon="plus" onClick={() => setShowNew(true)}>Nuevo lead</Button>
          </div>
        </div>

        <div className="filter-row">
          {FILTERS.map((f) => (
            <button key={f} className={`fchip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {FILTER_LABEL[f]} <span className="fc-count">{counts[f]}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <EmptyInbox onNew={() => setShowNew(true)} />
        ) : (
          <div className="inbox-grid">
            <div className="lead-list">
              {shown.map((l) => (
                <LeadCard key={l.id} lead={l} selected={selected && selected.id === l.id} onClick={() => setSelId(l.id)} visit={visitForLead(l.id)} />
              ))}
            </div>
            {selected && (
              <div className="anim-fade-in">
                <window.LeadDetail lead={selected} onStatus={setStatus} onAddNote={addNote}
                  visit={visitForLead(selected.id)} onSaveVisit={onSaveVisit} onDeleteVisit={onDeleteVisit}
                  onUpdateLead={onUpdateLead} onDeleteLead={onDeleteLead} />
              </div>
            )}
          </div>
        )}

        <NewLeadModal open={showNew} onClose={() => setShowNew(false)} onCreate={onCreateLead} properties={properties} />
      </div>
    );
  }

  function EmptyInbox({ onNew }) {
    return (
      <div className="empty card" style={{ padding: '70px 20px' }}>
        <svg className="illus" width="120" height="100" viewBox="0 0 120 100" fill="none">
          <rect x="18" y="30" width="84" height="56" rx="10" fill="#eef4fb" stroke="#dbe8f6" strokeWidth="2"/>
          <path d="M18 40l42 26 42-26" stroke="#2E75B6" strokeWidth="2" fill="none" strokeLinejoin="round"/>
          <circle cx="60" cy="22" r="9" fill="#5cb338"/>
          <path d="M56 22l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h3>Sin leads en esta vista</h3>
        <p>Cuando lleguen nuevos leads aparecerán aquí. Prueba a cambiar el filtro o crea uno manualmente.</p>
        <Button variant="primary" icon="plus" onClick={onNew}>Nuevo lead</Button>
      </div>
    );
  }

  window.InboxScreen = InboxScreen;
})();
