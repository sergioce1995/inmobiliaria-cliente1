// screen_valoraciones.jsx — Captación: solicitudes de "Vende tu propiedad"
(function () {
  const { useState } = React;
  const { Avatar, Button, Icon, Modal, Input, Select } = window;
  const fmtEur = window.fmtEur;

  const ORDER = { pendiente: 0, valorada: 1, captada: 2, descartada: 3 };
  const AVATAR_COLORS = ['#2E75B6', '#7A5AE0', '#0ea5a3', '#F5A623', '#5cb338', '#e5544b'];

  // Modal para añadir una captación manualmente
  function NewValModal({ open, onClose, onCreate }) {
    const empty = { tipo: 'Piso', propietario: '', email: '', tel: '', direccion: '', ciudad: '', m2: '', hab: '', banos: '', notas: '' };
    const [f, setF] = useState(empty);
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
    const submit = async () => {
      if (!f.propietario || !f.direccion) return;
      setSaving(true);
      const ok = await onCreate({
        tipo: f.tipo,
        propietario: f.propietario,
        email: f.email,
        tel: f.tel,
        direccion: f.direccion,
        ciudad: f.ciudad,
        m2: Number(f.m2) || null,
        hab: Number(f.hab) || null,
        banos: Number(f.banos) || null,
        notas: f.notas,
      });
      setSaving(false);
      if (ok) { setF(empty); onClose(); }
    };
    return (
      <Modal open={open} onClose={onClose} width={560}>
        <div style={{ padding: '22px 24px' }}>
          <h2 className="t-h2" style={{ margin: '0 0 4px' }}>Nueva captación</h2>
          <p style={{ color: 'var(--ink-3)', fontSize: 13.5, margin: '0 0 18px' }}>Registra manualmente una propiedad a captar.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Tipo</label>
              <Select value={f.tipo} onChange={set('tipo')} options={['Piso', 'Casa', 'Villa', 'Ático', 'Chalet', 'Dúplex', 'Local', 'Terreno']} />
            </div>
            <Input label="Propietario *" value={f.propietario} onChange={set('propietario')} placeholder="Juan Pérez" />
            <Input label="Email" value={f.email} onChange={set('email')} placeholder="juan@email.com" />
            <Input label="Teléfono" value={f.tel} onChange={set('tel')} placeholder="+34 600 000 000" />
            <Input label="Dirección *" value={f.direccion} onChange={set('direccion')} placeholder="Calle..." />
            <Input label="Ciudad" value={f.ciudad} onChange={set('ciudad')} placeholder="Adeje" />
            <Input label="m²" type="number" value={f.m2} onChange={set('m2')} placeholder="90" />
            <Input label="Habitaciones" type="number" value={f.hab} onChange={set('hab')} placeholder="3" />
            <Input label="Baños" type="number" value={f.banos} onChange={set('banos')} placeholder="2" />
          </div>
          <div style={{ marginTop: 12 }}>
            <Input label="Notas" textarea rows={2} value={f.notas} onChange={set('notas')} placeholder="Detalles del propietario…" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" icon="check" onClick={submit} disabled={!f.propietario || !f.direccion || saving}>{saving ? 'Guardando…' : 'Crear captación'}</Button>
          </div>
        </div>
      </Modal>
    );
  }

  function ValBadge({ estado }) {
    const VS = window.ZADI_DATA.valStatus[estado];
    return <span className={`badge badge-${VS.cls}`}><span className="bdot" />{VS.label}</span>;
  }

  function ValCard({ v, selected, onClick }) {
    const VS = window.ZADI_DATA.valStatus[v.estado];
    return (
      <div className={`val-card st-${VS.cls}${selected ? ' sel' : ''}`} onClick={onClick}>
        <div className="vc-top">
          <span className="vc-tipo"><Icon name="properties" size={14} />{v.tipo}</span>
          <ValBadge estado={v.estado} />
        </div>
        <div className="vc-addr">{v.direccion}</div>
        <div className="vc-city"><Icon name="location" size={13} />{v.ciudad} · {v.m2} m²{v.hab ? ` · ${v.hab} hab` : ''}</div>
        <div className="vc-foot">
          <span className="vc-owner"><Avatar name={v.propietario} color={v.avatar} size={26} />{v.propietario}</span>
          {v.estimado
            ? <span className="vc-est tnum">{fmtEur(v.estimado)}</span>
            : <span className="vc-date">{v.fecha}</span>}
        </div>
      </div>
    );
  }

  function ValDetail({ v, onStatus, onEstimado, onConvert, onClose, onUpdate, onDelete }) {
    const VS = window.ZADI_DATA.valStatus;
    const [est, setEst] = useState(v.estimado || '');
    const [editing, setEditing] = useState(false);
    const [confirmDel, setConfirmDel] = useState(false);
    const [edit, setEdit] = useState({ propietario: v.propietario, email: v.email, tel: v.tel, tipo: v.tipo, direccion: v.direccion, ciudad: v.ciudad, m2: v.m2, hab: v.hab, banos: v.banos, notas: v.notas });
    React.useEffect(() => {
      setEst(v.estimado || '');
      setEdit({ propietario: v.propietario, email: v.email, tel: v.tel, tipo: v.tipo, direccion: v.direccion, ciudad: v.ciudad, m2: v.m2, hab: v.hab, banos: v.banos, notas: v.notas });
      setEditing(false); setConfirmDel(false);
    }, [v.id]);
    const setE = (k) => (e) => setEdit((f) => ({ ...f, [k]: e.target.value }));
    const saveEdit = async () => {
      if (onUpdate) {
        await onUpdate(v.id, {
          propietario: edit.propietario, email: edit.email, tel: edit.tel, tipo: edit.tipo,
          direccion: edit.direccion, ciudad: edit.ciudad,
          m2: Number(edit.m2) || null, hab: Number(edit.hab) || null, banos: Number(edit.banos) || null,
          notas: edit.notas,
        });
        setEditing(false);
      }
    };
    const OPTS = ['pendiente', 'valorada', 'captada', 'descartada'];
    const COLORS = { pendiente: 'var(--blue)', valorada: 'var(--orange)', captada: 'var(--green)', descartada: 'var(--st-cerrado)' };
    return (
      <div className="card detail" key={v.id}>
        <div className="detail-head">
          <span className="val-ico"><Icon name="properties" size={26} /></span>
          <div className="dh-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 className="t-h2" style={{ margin: 0 }}>{v.tipo} · {v.ciudad}</h2>
              <ValBadge estado={v.estado} />
            </div>
            <div style={{ color: 'var(--ink-3)', fontSize: 13.5, marginTop: 3 }}>{v.direccion} · solicitud {v.fecha}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onUpdate && !editing && <Button variant="secondary" size="sm" icon="edit" onClick={() => setEditing(true)}>Editar</Button>}
            {onDelete && !editing && <Button variant="secondary" size="sm" icon="trash" onClick={() => setConfirmDel(true)}>Eliminar</Button>}
            {onClose && <button className="icon-btn" onClick={onClose}><Icon name="close" size={19} /></button>}
          </div>
        </div>

        {confirmDel && (
          <div style={{ margin: '0 20px 16px', padding: '14px 16px', background: '#fbeaea', border: '1px solid var(--st-cerrado, #e5544b)', borderRadius: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>¿Eliminar esta captación?</div>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 12px' }}>Se quitará de Captación. Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="secondary" size="sm" onClick={() => setConfirmDel(false)}>Cancelar</Button>
              <Button variant="danger" size="sm" icon="trash" onClick={() => onDelete(v)}>Sí, eliminar</Button>
            </div>
          </div>
        )}

        <div className="detail-body">
          {editing ? (
            <div>
              <span className="t-eyebrow" style={{ display: 'block', marginBottom: 12 }}>Editar captación</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Propietario" value={edit.propietario} onChange={setE('propietario')} />
                <div className="field">
                  <label>Tipo</label>
                  <Select value={edit.tipo} onChange={setE('tipo')} options={['Piso', 'Casa', 'Villa', 'Ático', 'Chalet', 'Dúplex', 'Local', 'Terreno', 'Garaje']} />
                </div>
                <Input label="Email" value={edit.email} onChange={setE('email')} />
                <Input label="Teléfono" value={edit.tel} onChange={setE('tel')} />
                <Input label="Dirección" value={edit.direccion} onChange={setE('direccion')} />
                <Input label="Ciudad" value={edit.ciudad} onChange={setE('ciudad')} />
                <Input label="m²" type="number" value={edit.m2} onChange={setE('m2')} />
                <Input label="Habitaciones" type="number" value={edit.hab} onChange={setE('hab')} />
                <Input label="Baños" type="number" value={edit.banos} onChange={setE('banos')} />
              </div>
              <div style={{ marginTop: 12 }}>
                <Input label="Notas" textarea rows={2} value={edit.notas} onChange={setE('notas')} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>
                <Button variant="primary" icon="check" onClick={saveEdit} disabled={!edit.propietario}>Guardar cambios</Button>
              </div>
            </div>
          ) : (<>
          <span className="t-eyebrow" style={{ display: 'block', marginBottom: 12 }}>Propietario</span>
          <div className="val-owner-row">
            <Avatar name={v.propietario} color={v.avatar} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{v.propietario}</div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{v.email}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="sm" icon="phone">Llamar</Button>
              <Button variant="primary" size="sm" icon="mail">Email</Button>
            </div>
          </div>

          <div className="detail-grid" style={{ marginTop: 22 }}>
            <div className="dfield"><span className="k">Tipo</span><span className="v">{v.tipo}</span></div>
            <div className="dfield"><span className="k">Superficie</span><span className="v tnum">{v.m2} m²</span></div>
            <div className="dfield"><span className="k">Teléfono</span><span className="v"><Icon name="phone" size={15} />{v.tel}</span></div>
            <div className="dfield"><span className="k">Habitaciones</span><span className="v">{v.hab || '—'}{v.hab ? ` hab · ${v.banos} baños` : ''}</span></div>
            <div className="dfield" style={{ gridColumn: '1 / -1' }}><span className="k">Dirección</span><span className="v"><Icon name="location" size={15} />{v.direccion}, {v.ciudad}</span></div>
          </div>

          <div className="val-notas">
            <span className="t-eyebrow" style={{ display: 'block', marginBottom: 8 }}>Notas del propietario</span>
            <p>{v.notas}</p>
          </div>

          {/* Valoración estimada */}
          <div style={{ margin: '4px 0 20px' }}>
            <span className="t-eyebrow" style={{ display: 'block', marginBottom: 10 }}>Valoración estimada</span>
            <div className="val-est-row">
              <div className="val-est-input">
                <input type="number" placeholder="0" value={est}
                  onChange={(e) => setEst(e.target.value === '' ? '' : +e.target.value)} />
                <span>€</span>
              </div>
              <Button variant="secondary" icon="send" disabled={!est}
                onClick={() => { onEstimado(v.id, +est); if (v.estado === 'pendiente') onStatus(v.id, 'valorada'); }}>
                Guardar y marcar valorada
              </Button>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <span className="t-eyebrow" style={{ display: 'block', marginBottom: 4 }}>Estado de la captación</span>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 10px' }}>{VS[v.estado].desc}</p>
            <div className="status-select">
              {OPTS.map((s) => (
                <button key={s} className={`st-opt ${VS[s].cls}${v.estado === s ? ' active' : ''}`} onClick={() => onStatus(v.id, s)} title={VS[s].desc}>
                  <span className="od" style={{ background: v.estado === s ? '#fff' : COLORS[s] }} />{VS[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Acción principal: convertir en propiedad de cartera */}
          <div className="val-convert">
            <div>
              <div className="vcv-t"><Icon name="handshake" size={17} />Convertir en propiedad</div>
              <div className="vcv-d">Pasa esta captación a tu cartera de <b>Propiedades</b> y prepárala para publicar.</div>
            </div>
            <Button variant="success" icon="check" disabled={v.estado === 'descartada'}
              onClick={() => onConvert(v)}>Captar propiedad</Button>
          </div>
          </>)}
        </div>
      </div>
    );
  }

  function ValoracionesScreen({ valoraciones, setValoraciones, toast, onCreate, onUpdate, onDelete, onConvert, extFilter }) {
    const FILTERS = ['todos', 'pendiente', 'valorada', 'captada', 'descartada'];
    const VS = window.ZADI_DATA.valStatus;
    const [filter, setFilter] = useState('todos');
    const [openId, setOpenId] = useState(null);
    const [showNew, setShowNew] = useState(false);

    // Aplicar filtro externo si viene
    React.useEffect(() => {
      if (extFilter?.estado) setFilter(extFilter.estado);
    }, [extFilter?.estado]);
    const addValoracion = onCreate; // async → devuelve true/false

    const counts = FILTERS.reduce((a, f) => {
      a[f] = f === 'todos' ? valoraciones.length : valoraciones.filter((v) => v.estado === f).length;
      return a;
    }, {});

    let shown = filter === 'todos' ? valoraciones : valoraciones.filter((v) => v.estado === filter);
    shown = [...shown].sort((a, b) => ORDER[a.estado] - ORDER[b.estado]);

    const open = valoraciones.find((v) => v.id === openId);
    const setStatus = (id, estado) => { onUpdate && onUpdate(id, { estado }); };
    const setEstimado = (id, estimado) => { onUpdate && onUpdate(id, { estimado }); toast('Valoración guardada'); };
    const convert = async (v) => { const ok = onConvert && await onConvert(v.id); if (ok) setOpenId(null); };
    const removeVal = async (v) => { const ok = onDelete && await onDelete(v.id); if (ok) setOpenId(null); };

    return (
      <div className="page">
        <div className="page-head">
          <div className="ph-l">
            <h1 className="t-h1">Captación</h1>
            <span className="sub">Solicitudes de valoración desde «Vende tu propiedad» · {counts.pendiente} pendientes</span>
          </div>
          <Button variant="primary" icon="plus" onClick={() => setShowNew(true)}>Añadir manualmente</Button>
        </div>

        <div className="filter-row">
          {FILTERS.map((f) => (
            <button key={f} className={`fchip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'todos' ? 'Todas' : VS[f].label} <span className="fc-count">{counts[f]}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="empty card" style={{ padding: '70px 20px' }}>
            <svg className="illus" width="116" height="96" viewBox="0 0 116 96" fill="none">
              <path d="M22 46L58 20l36 26" stroke="#2E75B6" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
              <rect x="30" y="44" width="56" height="36" rx="6" fill="#eef4fb" stroke="#dbe8f6" strokeWidth="2"/>
              <circle cx="58" cy="60" r="9" fill="#5cb338"/><path d="M54 60l3 3 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>Sin solicitudes en esta vista</h3>
            <p>Cuando alguien rellene «Vende tu propiedad» en la web, su solicitud aparecerá aquí.</p>
          </div>
        ) : (
          <div className="val-grid">
            {shown.map((v) => (
              <ValCard key={v.id} v={v} selected={open && open.id === v.id} onClick={() => setOpenId(v.id)} />
            ))}
          </div>
        )}

        {open && (
          <div className="drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && setOpenId(null)}>
            <div className="drawer">
              <ValDetail v={open} onStatus={setStatus} onEstimado={setEstimado} onConvert={convert} onClose={() => setOpenId(null)} onUpdate={onUpdate} onDelete={removeVal} />
            </div>
          </div>
        )}

        <NewValModal open={showNew} onClose={() => setShowNew(false)} onCreate={addValoracion} />
      </div>
    );
  }

  window.ValoracionesScreen = ValoracionesScreen;
})();
