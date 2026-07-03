// lead_detail.jsx — shared lead detail panel (used by Inbox + Base de datos drawer)
(function () {
  const { useState } = React;
  const { Avatar, StatusBadge, Button, Icon, Input } = window;
  const fmtEur = window.fmtEur;
  const STATUS_OPTS = ['nuevo', 'contactado', 'visita', 'negociacion', 'cerrado', 'perdido'];
  const STATUS_COLOR = { nuevo: 'var(--blue)', contactado: 'var(--orange)', visita: '#9333ea', negociacion: '#f59e0b', cerrado: '#10b981', perdido: '#9ca3af' };

  // ISO → valor para <input type="datetime-local"> en hora local
  const toLocalInput = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const fmtVisit = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  function LeadDetail({ lead, onStatus, onAddNote, onClose, visit, onSaveVisit, onDeleteVisit, onUpdateLead, onDeleteLead, properties = [] }) {
    const [note, setNote] = useState('');
    const [visitVal, setVisitVal] = useState(toLocalInput(visit && visit.scheduled_for));
    const [editing, setEditing] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);
    const propIds = (() => {
      if (lead.propiedades && Array.isArray(lead.propiedades) && lead.propiedades.length) return lead.propiedades;
      try { const a = JSON.parse(lead.interes_propiedades || '[]'); if (Array.isArray(a) && a.length) return a; } catch {}
      return lead.propiedad ? [lead.propiedad] : (lead.source_property_id ? [lead.source_property_id] : []);
    })();
    const [edit, setEdit] = useState({ nombre: lead._nombre || lead.nombre || '', apellidos: lead._apellidos || '', email: lead.email || '', telefono: lead.tel || '', propiedades: propIds || [] });
    const [copied, setCopied] = useState(null);
    const copyValue = (type, value) => {
      if (navigator.clipboard) navigator.clipboard.writeText(value);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    };
    React.useEffect(() => {
      const propIds = (() => {
        if (lead.propiedades && Array.isArray(lead.propiedades) && lead.propiedades.length) return lead.propiedades;
        try { const a = JSON.parse(lead.interes_propiedades || '[]'); if (Array.isArray(a) && a.length) return a; } catch {}
        return lead.propiedad ? [lead.propiedad] : (lead.source_property_id ? [lead.source_property_id] : []);
      })();
      setEdit({ nombre: lead._nombre || lead.nombre || '', apellidos: lead._apellidos || '', email: lead.email || '', telefono: lead.tel || '', propiedades: propIds || [] });
      setEditing(false); setConfirmDel(false);
    }, [lead.id]);
    const setE = (k) => (e) => setEdit((f) => ({ ...f, [k]: e.target.value }));
    const toggleProp = (propId) => {
      setEdit((f) => {
        const current = f.propiedades || [];
        const idx = current.indexOf(propId);
        if (idx >= 0) return { ...f, propiedades: current.filter((_, i) => i !== idx) };
        return { ...f, propiedades: [...current, propId] };
      });
    };
    const saveEdit = async () => {
      if (onUpdateLead) {
        const toSave = { ...edit };
        if (edit.propiedades && edit.propiedades.length > 0) toSave.interes_propiedades = JSON.stringify(edit.propiedades);
        const ok = await onUpdateLead(lead.id, toSave);
        if (ok) setEditing(false);
      }
    };
    const doDelete = async () => {
      if (onDeleteLead) { const ok = await onDeleteLead(lead.id); if (ok) { setConfirmDel(false); if (onClose) onClose(); } }
    };
    const SI = window.ZADI_DATA.statusInfo;
    const ref = window.ZADI_DATA.property_ref || {};
    // Calcular propiedades parseando desde interes_propiedades si es necesario
    const propIdsDisplay = (() => {
      if (lead.propiedades && Array.isArray(lead.propiedades) && lead.propiedades.length) return lead.propiedades;
      try { const a = JSON.parse(lead.interes_propiedades || '[]'); if (Array.isArray(a) && a.length) return a; } catch {}
      return lead.propiedad ? [lead.propiedad] : (lead.source_property_id ? [lead.source_property_id] : []);
    })();
    const propNames = propIdsDisplay.map((id) => ref[id]).filter(Boolean);
    const esPropietario = lead.origen === 'captacion';
    const origenLabel = ({ web_form: 'Web · interés en propiedad', captacion: 'Web · captación', manual: 'Alta manual', saved_search: 'Búsqueda guardada', agente_ia: 'Agente IA' })[lead.origen] || lead.origen || 'Web';
    const tipoLead = esPropietario ? 'Propietario · quiere vender / alquilar' : 'Interesado · busca propiedad';
    const telLimpio = (lead.tel || '').replace(/[^\d+]/g, '');
    const send = () => { if (note.trim()) { onAddNote(lead.id, note.trim()); setNote(''); } };
    React.useEffect(() => { setVisitVal(toLocalInput(visit && visit.scheduled_for)); }, [visit && visit.id, visit && visit.scheduled_for]);
    const saveVisit = () => { if (visitVal && onSaveVisit) onSaveVisit(lead.id, new Date(visitVal).toISOString()); };
    const clearVisit = () => { if (visit && onDeleteVisit) { onDeleteVisit(visit.id); setVisitVal(''); } };
    return (
      <div className="card detail" key={lead.id}>
        <div className="detail-head">
          <Avatar name={lead.nombre} color={lead.avatar} size={56} />
          <div className="dh-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, rowGap: 6, flexWrap: 'wrap' }}>
              <h2 className="t-h2" style={{ margin: 0 }}>{lead.nombre}</h2>
              <StatusBadge status={lead.estado} />
              {(() => {
                const lvl = (window.leadScore ? window.leadScore(lead, visit ? [visit] : []) : { level: 'bajo' }).level;
                const q = (window.LEAD_QUALITY || {})[lvl] || { label: '' };
                return <span className="lead-q-chip" title={q.label}><span className={`lead-q ${lvl}`} />{q.label}</span>;
              })()}
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 13.5, marginTop: 3 }}>Interesado desde {lead.fecha}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onUpdateLead && !editing && <Button variant="secondary" size="sm" icon="edit" onClick={() => setEditing(true)}>Editar</Button>}
            {onDeleteLead && !editing && <Button variant="secondary" size="sm" icon="trash" onClick={() => setConfirmDel(true)}>Eliminar</Button>}
            {onClose && <button className="icon-btn" onClick={onClose}><Icon name="close" size={19} /></button>}
          </div>
        </div>

        {/* Acciones rápidas — un click para contactar */}
        {!editing && (telLimpio || lead.email) && (
          <div className="ld-quick-actions">
            {telLimpio && <button className={`ld-qa-btn ld-qa-call${copied === 'tel' ? ' ld-qa-copied' : ''}`} onClick={() => copyValue('tel', lead.tel || telLimpio)}><Icon name="phone" size={16} />{copied === 'tel' ? lead.tel : 'Llamar'}</button>}
            {telLimpio && <a className="ld-qa-btn ld-qa-wa" href={`https://wa.me/${telLimpio.replace('+', '')}`} target="whatsapp" rel="noopener noreferrer"><Icon name="send" size={16} />WhatsApp</a>}
            {lead.email && <button className={`ld-qa-btn ld-qa-mail${copied === 'email' ? ' ld-qa-copied' : ''}`} onClick={() => copyValue('email', lead.email)}><Icon name="mail" size={16} />{copied === 'email' ? lead.email : 'Email'}</button>}
          </div>
        )}

        {confirmDel && (
          <div style={{ margin: '0 0 16px', padding: '14px 16px', background: 'var(--surface-2, #fbeaea)', border: '1px solid var(--st-cerrado, #e5544b)', borderRadius: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>¿Eliminar este interesado?</div>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 12px' }}>Se quitará de tu base de datos junto con su visita programada. Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="secondary" size="sm" onClick={() => setConfirmDel(false)}>Cancelar</Button>
              <Button variant="danger" size="sm" icon="trash" onClick={doDelete}>Sí, eliminar</Button>
            </div>
          </div>
        )}

        <div className="detail-body">
          {editing ? (
            <div style={{ marginBottom: 22 }}>
              <span className="t-eyebrow" style={{ display: 'block', marginBottom: 12 }}>Editar datos del interesado</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <Input label="Nombre" value={edit.nombre} onChange={setE('nombre')} />
                <Input label="Apellidos" value={edit.apellidos} onChange={setE('apellidos')} />
                <Input label="Email" value={edit.email} onChange={setE('email')} />
                <Input label="Teléfono" value={edit.telefono} onChange={setE('telefono')} />
              </div>
              {!esPropietario && properties && properties.length > 0 && (
                <div style={{ marginBottom: 16, padding: '12px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--line)' }}>
                  <span className="t-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Propiedades de interés</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {properties.map((prop) => (
                      <label key={prop.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                        <input type="checkbox" checked={(edit.propiedades || []).includes(prop.id)} onChange={() => toggleProp(prop.id)} style={{ cursor: 'pointer' }} />
                        <span style={{ flex: 1 }}>{prop.titulo}</span>
                        {prop.ciudad && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{prop.ciudad}</span>}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button variant="primary" icon="check" onClick={saveEdit} disabled={!edit.nombre}>Guardar cambios</Button>
              </div>
            </div>
          ) : (
          <div className="detail-grid">
            <div className="dfield" style={{ gridColumn: '1 / -1' }}>
              <span className="k">Tipo de interesado</span>
              <span className="v">
                <span className="badge" style={{ background: esPropietario ? '#fff3e0' : 'var(--blue-50)', color: esPropietario ? '#e89515' : 'var(--blue)' }}>
                  <Icon name={esPropietario ? 'tag' : 'properties'} size={13} /> {tipoLead}
                </span>
              </span>
            </div>
            <div className="dfield"><span className="k">Email</span><span className="v"><Icon name="mail" size={15} />{lead.email}</span></div>
            <div className="dfield"><span className="k">Teléfono</span><span className="v"><Icon name="phone" size={15} />{lead.tel}</span></div>
            <div className="dfield"><span className="k">Origen</span><span className="v"><Icon name="share" size={15} />{origenLabel}</span></div>
            <div className="dfield" style={{ gridColumn: '1 / -1' }}>
              <span className="k">{esPropietario ? 'Quiere captar' : `Propiedades de interés${propNames.length > 1 ? ` (${propNames.length})` : ''}`}</span>
              {esPropietario ? (
                <span className="v"><Icon name="properties" size={15} />Vender / alquilar su propiedad</span>
              ) : propNames.length === 0 ? (
                <span className="v"><Icon name="properties" size={15} />—</span>
              ) : (
                <span className="v" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {propNames.map((n, i) => (
                    <span key={i} className="badge" style={{ background: 'var(--blue-50)', color: 'var(--blue)' }}><Icon name="properties" size={12} /> {n}</span>
                  ))}
                </span>
              )}
            </div>
          </div>
          )}

          {/* Fecha de visita */}
          <div style={{ marginBottom: 20 }}>
            <span className="t-eyebrow" style={{ display: 'block', marginBottom: 8 }}>Fecha de visita</span>
            {visit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="badge" style={{ background: 'var(--blue-50)', color: 'var(--blue)' }}>
                  <Icon name="calendar" size={13} /> {fmtVisit(visit.scheduled_for)}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <input type="datetime-local" className="input" style={{ maxWidth: 230, height: 40 }}
                value={visitVal} onChange={(e) => setVisitVal(e.target.value)} />
              <Button variant="primary" size="sm" icon="check" onClick={saveVisit} disabled={!visitVal}>
                {visit ? 'Actualizar visita' : 'Programar visita'}
              </Button>
              {visit && (
                <Button variant="secondary" size="sm" icon="trash" onClick={clearVisit}>Quitar</Button>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <span className="t-eyebrow" style={{ display: 'block', marginBottom: 4 }}>Cambiar estado</span>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 10px' }}>{SI[lead.estado] ? SI[lead.estado].desc : ''}</p>
            <div className="status-select">
              {STATUS_OPTS.map((s) => (
                <button key={s} className={`st-opt ${s}${lead.estado === s ? ' active' : ''}`} onClick={() => onStatus(lead.id, s)} title={(SI[s] || {}).desc || s}>
                  <span className="od" style={{ background: lead.estado === s ? '#fff' : STATUS_COLOR[s] }} />{(SI[s] || {}).label || s}
                </button>
              ))}
            </div>
          </div>

          <span className="t-eyebrow" style={{ display: 'block', marginBottom: 14 }}>Historial de interacciones</span>
          <div className="timeline">
            {lead.interacciones.map((it, i) => (
              <div className="tl-item" key={i}>
                <div className={`tl-ic ${it.tipo}`}><Icon name={it.tipo} size={17} /></div>
                <div>
                  <div className="tl-txt">{it.txt}</div>
                  <div className="tl-date">{it.fecha}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="note-box">
            <textarea className="input" rows={1} placeholder="Añadir una nota…" value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }} />
            <Button variant="primary" icon="send" onClick={send} disabled={!note.trim()} style={{ height: 42 }}>Enviar</Button>
          </div>
        </div>
      </div>
    );
  }

  window.LeadDetail = LeadDetail;
})();
