// screen_contacts.jsx
(function () {
  const { useState, useEffect } = React;
  const { Avatar, StatusBadge, Button, Select, Icon, Modal, Input, STATUS_LABEL } = window;
  const fmtEur = window.fmtEur;

  // Modal para crear un lead manualmente (con propiedad de interés opcional)
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
          <h2 className="t-h2" style={{ margin: '0 0 4px' }}>Nuevo interesado</h2>
          <p style={{ color: 'var(--ink-3)', fontSize: 13.5, margin: '0 0 18px' }}>Añade un contacto manualmente a tu base de datos.</p>
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
              {saving ? 'Guardando…' : 'Crear interesado'}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  const STATUS_FILTERS = ['todos', 'nuevo', 'contactado', 'visita', 'negociacion', 'cerrado', 'perdido'];
  const SF_LABEL = { todos: 'Todos', ...STATUS_LABEL };
  const STATUS_ORDER = { nuevo: 0, contactado: 1, visita: 2, cerrado: 3 };

  const fmtVisitShort = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const QUALITY_STYLE = {
    alto:  { label: 'Alto',  bg: '#eaf6e4', color: '#3a7d1f' },
    medio: { label: 'Medio', bg: '#fff3e0', color: '#c77d00' },
    bajo:  { label: 'Bajo',  bg: '#f3f4f6', color: '#9ca3af' },
  };
  function QualityLabel({ lead, visits }) {
    const level = (window.leadScore ? window.leadScore(lead, visits) : { level: 'bajo' }).level;
    const s = QUALITY_STYLE[level] || QUALITY_STYLE.bajo;
    return <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>;
  }

  function ContactsScreen({ leads, setLeads, visits = [], properties = [], extFilter, clearExtFilter, onCreateLead, onUpdateLead, onDeleteLead, onSaveVisit, onDeleteVisit }) {
    const visitForLead = (id) => visits.find((v) => v.lead_id === id && v.status === 'programada');
    const [q, setQ] = useState('');
    const [view, setView] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 860 ? 'grid' : 'table'));
    const [sort, setSort] = useState({ key: 'nombre', dir: 1 });
    const [maxBudget, setMaxBudget] = useState(2000000);
    const [showRange, setShowRange] = useState(false);
    const [city, setCity] = useState('todas');
    const [estado, setEstado] = useState('todos');
    const [tipo, setTipo] = useState('todos');
    const [quality, setQuality] = useState('todos');
    const [openId, setOpenId] = useState(null);
    const [showNew, setShowNew] = useState(false);
    const [selected, setSelected] = useState(new Set());

    // Aplica filtros/lead que llegan desde las sugerencias del Dashboard.
    useEffect(() => {
      if (!extFilter) return;
      if (extFilter.estado) setEstado(extFilter.estado);
      else setEstado('todos');
      if (extFilter.leadId) setOpenId(extFilter.leadId);
    }, [extFilter]);

    const extPropertyId = extFilter && extFilter.propertyId ? extFilter.propertyId : null;
    const extLeadIds = extFilter && extFilter.leadIds ? extFilter.leadIds : null;

    const cities = ['todas', ...Array.from(new Set(leads.map((c) => c.ciudad)))];

    // Contar LEADS que tienen intereses en cada estado (no contar intereses)
    const counts = STATUS_FILTERS.reduce((a, f) => {
      if (f === 'todos') {
        // "Todos" = total de leads únicos
        a[f] = leads.length;
      } else {
        // Para cada estado, contar cuántos LEADS tienen al menos un interés en ese estado
        a[f] = leads.filter(l => (l.intereses || []).some(i => i.estado === f)).length;
      }
      return a;
    }, {});

    const INTEREST_ORDER = { alto: 0, medio: 1, bajo: 2 };
    let rows = leads.filter((c) => {
      const hit = (c.nombre + c.email + c.ciudad).toLowerCase().includes(q.toLowerCase());
      const inBudget = c.presupuesto <= maxBudget;
      const inCity = city === 'todas' || c.ciudad === city;
      // NUEVA ARQUITECTURA: Filtrar por estado de intereses, no de lead
      const inEstado = estado === 'todos' || (c.intereses || []).some(i => i.estado === estado);
      // Filtro de origen: si viene de una recomendación con origen='interesado', excluir captaciones
      const origenFilter = extFilter && extFilter.origen ? extFilter.origen : 'todos';
      const inOrigen = origenFilter === 'todos' || c.origen === origenFilter;
      const inTipo = tipo === 'todos' || (tipo === 'propietario' ? c.origen === 'captacion' : c.origen !== 'captacion');
      const lvl = (window.leadScore ? window.leadScore(c, visits) : { level: 'bajo' }).level;
      const inQuality = quality === 'todos' || lvl === quality;
      const inProperty = !extPropertyId || (Array.isArray(c.propiedades) && c.propiedades.includes(extPropertyId));
      const inLeadIds = !extLeadIds || extLeadIds.includes(c.id);
      return hit && inBudget && inCity && inEstado && inOrigen && inTipo && inQuality && inProperty && inLeadIds;
    });
    rows = [...rows].sort((a, b) => {
      if (sort.key === 'interes') {
        const aLevel = (window.leadScore ? window.leadScore(a, visits) : { level: 'bajo' }).level;
        const bLevel = (window.leadScore ? window.leadScore(b, visits) : { level: 'bajo' }).level;
        return (INTEREST_ORDER[aLevel] - INTEREST_ORDER[bLevel]) * sort.dir;
      }
      let av = a[sort.key], bv = b[sort.key];
      if (sort.key === 'estado') return (STATUS_ORDER[av] - STATUS_ORDER[bv]) * sort.dir;
      if (typeof av === 'number') return (av - bv) * sort.dir;
      return String(av).localeCompare(String(bv)) * sort.dir;
    });

    const open = leads.find((l) => l.id === openId);
    const setStatus = (id, est) => {
      setLeads((ls) => ls.map((l) => l.id === id ? { ...l, estado: est } : l));
      onUpdateLead && onUpdateLead(id, { status: est });
    };
    const addNote = (id, txt) => setLeads((ls) => ls.map((l) => l.id === id
      ? { ...l, interacciones: [{ tipo: 'nota', txt, fecha: 'Ahora' }, ...l.interacciones] } : l));

    const toggleSort = (key) => setSort((s) => s.key === key ? { key, dir: -s.dir } : { key, dir: 1 });
    const toggleSelected = (id) => setSelected((s) => s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set([...s, id]));
    const toggleAllSelected = () => setSelected((s) => s.size === rows.length ? new Set() : new Set(rows.map((l) => l.id)));
    const bulkAction = async (action, param) => {
      const ids = Array.from(selected);
      if (!ids.length) return;
      if (action === 'status') {
        for (const id of ids) onUpdateLead && await onUpdateLead(id, { status: param });
      } else if (action === 'delete') {
        for (const id of ids) onDeleteLead && await onDeleteLead(id);
      } else if (action === 'archive') {
        for (const id of ids) onUpdateLead && await onUpdateLead(id, { status: 'archivado' });
      } else if (action === 'csv') {
        const data = leads.filter((l) => ids.includes(l.id));
        const csv = ['nombre,email,tel,ciudad,estado,presupuesto\n', ...data.map((l) => `${l.nombre},${l.email},${l.tel},${l.ciudad},${l.estado},${l.presupuesto}`)].join('');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      }
      setSelected(new Set());
    };
    const SortHead = ({ k, children, right }) => (
      <th onClick={() => toggleSort(k)} style={right ? { textAlign: 'right' } : null}>
        <span className="th-in" style={right ? { justifyContent: 'flex-end' } : null}>
          {children}
          {sort.key === k && <Icon name="chevronDown" size={13} style={{ transform: sort.dir < 0 ? 'rotate(180deg)' : 'none' }} />}
        </span>
      </th>
    );

    const hasOrigenFilter = extFilter && extFilter.origen;

    return (
      <div className="page">
        <div className="page-head">
          <div className="ph-l">
            <h1 className="t-h1">Base de datos</h1>
            <span className="sub">{rows.length} de {leads.length} contactos</span>
          </div>
          <div className="toolbar">
            <div className="topbar-search" style={{ width: 240 }}>
              <Icon name="search" size={17} />
              <input placeholder="Buscar contactos…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={city} onChange={(e) => setCity(e.target.value)}
              options={cities.map((c) => ({ value: c, label: c === 'todas' ? 'Todas las ciudades' : c }))} />
            <Select value={tipo} onChange={(e) => setTipo(e.target.value)}
              options={[
                { value: 'todos', label: 'Todos los tipos' },
                { value: 'interesado', label: 'Interesados (compra/alquiler)' },
                { value: 'propietario', label: 'Propietarios (captación)' },
              ]} />
            <Select value={quality} onChange={(e) => setQuality(e.target.value)}
              options={[
                { value: 'todos', label: 'Todos los intereses' },
                { value: 'alto', label: '🟢 Interés alto' },
                { value: 'medio', label: '🟡 Interés medio' },
                { value: 'bajo', label: '⚪ Interés bajo' },
              ]} />
            <div style={{ position: 'relative' }}>
              <Button variant="secondary" icon="euro" onClick={() => setShowRange((s) => !s)}>
                Hasta {window.fmtEurShort(maxBudget)}
              </Button>
              {showRange && (
                <div className="pop range-pop">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>
                    <span>0 €</span><span className="tnum">{window.fmtEurShort(maxBudget)}</span>
                  </div>
                  <div className="range-track">
                    <div className="range-fill" style={{ width: (maxBudget / 2000000) * 100 + '%' }} />
                    <input className="range-input" type="range" min="100000" max="2000000" step="50000"
                      value={maxBudget} onChange={(e) => setMaxBudget(+e.target.value)} />
                  </div>
                </div>
              )}
            </div>
            <div className="seg">
              <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}><Icon name="list" size={18} /></button>
              <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}><Icon name="grid" size={18} /></button>
            </div>
            <Button variant="primary" icon="plus" onClick={() => setShowNew(true)}>Nuevo interesado</Button>
          </div>
        </div>

        {/* Filtro por estado */}
        <div className="filter-row">
          {STATUS_FILTERS.map((f) => (
            <button key={f} className={`fchip fchip-${f}${estado === f ? ' active' : ''}`} onClick={() => setEstado(f)}>
              {SF_LABEL[f]} <span className="fc-count">{counts[f]}</span>
            </button>
          ))}
          {hasOrigenFilter && (
            <span className="active-filter">
              Origen: {extFilter.origen}
              <button onClick={() => { clearExtFilter && clearExtFilter(); }}><Icon name="close" size={13} /></button>
            </span>
          )}
          {extPropertyId && (
            <span className="active-filter">
              Propiedad: {(properties.find((p) => p.id === extPropertyId) || {}).titulo || extPropertyId}
              <button onClick={() => { clearExtFilter && clearExtFilter(); }}><Icon name="close" size={13} /></button>
            </span>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="empty card" style={{ padding: '70px 20px' }}>
            <svg className="illus" width="110" height="90" viewBox="0 0 110 90" fill="none">
              <circle cx="48" cy="40" r="26" fill="#eef4fb" stroke="#dbe8f6" strokeWidth="2"/>
              <path d="M66 58l18 18" stroke="#2E75B6" strokeWidth="4" strokeLinecap="round"/>
            </svg>
            <h3>Sin resultados</h3>
            <p>No hay contactos que coincidan con tu búsqueda o filtros.</p>
          </div>
        ) : view === 'table' ? (
          <div className="table-wrap">
            <table className="ztable">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}><input type="checkbox" checked={selected.size === rows.length && rows.length > 0} onChange={toggleAllSelected} style={{ cursor: 'pointer' }} /></th>
                  <SortHead k="nombre">Nombre</SortHead>
                  <SortHead k="email">Email</SortHead>
                  <th>Teléfono</th>
                  <SortHead k="ciudad">Ciudad</SortHead>
                  <SortHead k="interes">Interés</SortHead>
                  <th>Fecha de visita</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const v = visitForLead(c.id);
                  return (
                  <tr key={c.id} style={{ background: selected.has(c.id) ? 'var(--blue-50)' : 'inherit' }}>
                    <td style={{ textAlign: 'center', width: 40 }} onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelected(c.id)} style={{ cursor: 'pointer' }} /></td>
                    <td onClick={() => setOpenId(c.id)}><span className="cell-name"><Avatar name={c.nombre} color={c.avatar} size={32} />{c.nombre}</span></td>
                    <td className="cell-mut">{c.email}</td>
                    <td className="mono">{c.tel}</td>
                    <td>{c.ciudad}</td>
                    <td><QualityLabel lead={c} visits={visits} /></td>
                    <td className="cell-mut">
                      {v
                        ? <span className="badge" style={{ background: 'var(--blue-50)', color: 'var(--blue)' }}><Icon name="calendar" size={12} /> {fmtVisitShort(v.scheduled_for)}</span>
                        : <span style={{ color: 'var(--ink-4)' }}>—</span>}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="contacts-cards">
            {rows.map((c) => (
              <div className="ccard" key={c.id} onClick={() => setOpenId(c.id)} style={{ cursor: 'pointer', background: selected.has(c.id) ? 'var(--blue-50)' : 'inherit', position: 'relative' }}>
                <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelected(c.id)} onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 10, right: 10, cursor: 'pointer' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <Avatar name={c.nombre} color={c.avatar} size={44} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 7 }}>{c.nombre}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-2)' }}><Icon name="phone" size={15} />{c.tel}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 13, borderTop: '1px solid var(--line-2)' }}>
                  <QualityLabel lead={c} visits={visits} />
                  <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{c.fecha}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drawer de detalle */}
        {open && (
          <div className="drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && setOpenId(null)}>
            <div className="drawer">
              <window.LeadDetail lead={open} onStatus={setStatus} onAddNote={addNote} onClose={() => setOpenId(null)}
                visit={visitForLead(open.id)} onSaveVisit={onSaveVisit} onDeleteVisit={onDeleteVisit}
                onUpdateLead={onUpdateLead} onDeleteLead={onDeleteLead} properties={properties} />
            </div>
          </div>
        )}

        <NewLeadModal open={showNew} onClose={() => setShowNew(false)} onCreate={onCreateLead} properties={properties} />

        {/* Barra flotante de acciones masivas */}
        {selected.size > 0 && (
          <div className="bulk-action-bar">
            <span className="bab-info">{selected.size} seleccionado{selected.size > 1 ? 's' : ''}</span>
            <div className="bab-actions">
              <button className="bab-btn" onClick={() => { const s = prompt('Nuevo estado:\nnuevo / contactado / visita / cerrado'); if (s) bulkAction('status', s); }}>Cambiar estado</button>
              <button className="bab-btn" onClick={() => bulkAction('archive')}>Archivar</button>
              <button className="bab-btn danger" onClick={() => { if (confirm(`¿Eliminar ${selected.size} interesado${selected.size > 1 ? 's' : ''}?`)) bulkAction('delete'); }}>Eliminar</button>
              <button className="bab-btn" onClick={() => bulkAction('csv')}>Exportar CSV</button>
              <button className="bab-btn ghost" onClick={() => setSelected(new Set())}>Deseleccionar</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  window.ContactsScreen = ContactsScreen;
})();
