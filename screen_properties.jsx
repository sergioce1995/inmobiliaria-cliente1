// screen_properties.jsx
(function () {
  const { useState, useRef, useEffect } = React;
  const { Avatar, Button, IconButton, Icon, Modal } = window;
  const fmtEur = window.fmtEur;

  // PropertyDetail inline
  function PropertyDetail({ property, leads = [], visits = [], properties = [], onClose, onAction, initialTab = null }) {
    const [expandedSection, setExpandedSection] = useState(initialTab || null);
    const interesados = leads.filter((l) => {
      if (l.origen === 'captacion') return false; // Excluir captaciones (propietarios)
      try {
        const ips = JSON.parse(l.interes_propiedades || '[]');
        if (Array.isArray(ips)) return ips.some((ip) => (typeof ip === 'object' ? ip.id : ip) === property.id);
      } catch {}
      return false;
    });
    const sinContactar = interesados.filter((l) => l.estado === 'nuevo');
    const contactadosSinVisita = interesados.filter((l) => l.estado === 'contactado' && !visits.some((v) => v.lead_id === l.id && v.property_id === property.id));
    const conVisita = interesados.filter((l) => visits.some((v) => v.lead_id === l.id && v.property_id === property.id));
    const propVisits = visits.filter((v) => v.property_id === property.id);
    const compatibles = window.compatibleLeads ? window.compatibleLeads(property, leads, properties) : [];
    const { StatusBadge } = window;
    const SI = window.ZADI_DATA?.statusInfo || {};

    const kpiBtn = { cursor: 'pointer', borderRadius: 12, padding: '14px 8px', textAlign: 'center', border: 'none', background: 'transparent', transition: 'all .18s ease', flex: 1 };
    const toggleSection = (s) => setExpandedSection((v) => v === s ? null : s);

    return (
      <div className="card detail" key={property.id}>
        <div className="detail-head">
          <div>
            <h2 className="t-h2" style={{ margin: 0, marginBottom: 4 }}>{property.titulo}</h2>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{property.zona || property.ciudad} · {property.precio_venta ? fmtEur(property.precio_venta) : property.precio ? fmtEur(property.precio) : '—'}</div>
          </div>
          {onClose && <button className="icon-btn" onClick={onClose}><Icon name="close" size={19} /></button>}
        </div>

        <div className="pd-kpis" style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
          {/* Sin contactar */}
          <button className="pd-kpi" style={kpiBtn} onClick={() => toggleSection('sinContactar')} title="Pendientes de contactar">
            <div style={{ fontSize: 28, fontWeight: 800, color: sinContactar.length > 0 ? '#dc2626' : 'var(--ink-3)' }}>{sinContactar.length}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>Sin contactar</div>
            {sinContactar.length > 0 && <div style={{ fontSize: 10, color: '#dc2626', marginTop: 4, fontWeight: 600 }}>Contactar <Icon name="arrowRight" size={10} /></div>}
          </button>

          {/* Contactados sin visita */}
          <button className="pd-kpi" style={kpiBtn} onClick={() => toggleSection('contactadosSinVisita')} title="Contactados sin visita">
            <div style={{ fontSize: 28, fontWeight: 800, color: contactadosSinVisita.length > 0 ? '#f59e0b' : 'var(--ink-3)' }}>{contactadosSinVisita.length}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>Sin visita</div>
            {contactadosSinVisita.length > 0 && <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 4, fontWeight: 600 }}>Agendar <Icon name="arrowRight" size={10} /></div>}
          </button>

          {/* Con visita */}
          <button className="pd-kpi" style={kpiBtn} onClick={() => toggleSection('conVisita')} title="Con visita programada">
            <div style={{ fontSize: 28, fontWeight: 800, color: conVisita.length > 0 ? '#10b981' : 'var(--ink-3)' }}>{conVisita.length}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>Con visita</div>
            {conVisita.length > 0 && <div style={{ fontSize: 10, color: '#10b981', marginTop: 4, fontWeight: 600 }}>Ver <Icon name="arrowRight" size={10} /></div>}
          </button>

          {/* Compatibles */}
          <button className="pd-kpi" style={kpiBtn} onClick={() => toggleSection('compatibles')} title="Clientes compatibles">
            <div style={{ fontSize: 28, fontWeight: 800, color: compatibles.length > 0 ? '#7c3aed' : 'var(--ink-3)' }}>{compatibles.length}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>Compatibles</div>
            {compatibles.length > 0 && <div style={{ fontSize: 10, color: '#7c3aed', marginTop: 4, fontWeight: 600 }}>Enviar <Icon name="arrowRight" size={10} /></div>}
          </button>
        </div>

        <div className="detail-body">
          {expandedSection === 'interesados' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Interesados ({interesados.length})</div>
              {interesados.length === 0 ? <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Ningún lead interesado registrado.</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {interesados.map((l) => (
                    <button key={l.id} className="pd-lead-row" onClick={() => onAction && onAction({ screen: 'contactos', leadId: l.id })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface-2, #f7f8fa)', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <window.Avatar name={l.nombre} color={l.avatar || '#2E75B6'} size={28} />
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{l.nombre}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{l.email}</div></div>
                      <StatusBadge status={l.estado || l.status} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {expandedSection === 'sinContactar' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#dc2626' }}>Pendientes de contactar ({sinContactar.length})</div>
              {sinContactar.length === 0 ? <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Todos los interesados han sido contactados.</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {sinContactar.map((l) => (
                    <button key={l.id} className="pd-lead-row" onClick={() => onAction && onAction({ screen: 'contactos', leadId: l.id })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <window.Avatar name={l.nombre} color={l.avatar || '#2E75B6'} size={28} />
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{l.nombre}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{l.email} · {l.tel}</div></div>
                      <Icon name="phone" size={16} style={{ color: '#dc2626' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {expandedSection === 'contactadosSinVisita' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#f59e0b' }}>Contactados sin visita ({contactadosSinVisita.length})</div>
              {contactadosSinVisita.length === 0 ? <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Todos los contactados tienen visitas programadas.</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {contactadosSinVisita.map((l) => (
                    <button key={l.id} className="pd-lead-row" onClick={() => onAction && onAction({ screen: 'contactos', leadId: l.id })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#fffbeb', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <window.Avatar name={l.nombre} color={l.avatar || '#2E75B6'} size={28} />
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{l.nombre}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{l.email} · {l.tel}</div></div>
                      <Icon name="calendar" size={16} style={{ color: '#f59e0b' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {expandedSection === 'conVisita' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: '#10b981' }}>Con visita ({conVisita.length})</div>
              {conVisita.length === 0 ? <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Sin visitas con este interesado.</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {conVisita.map((l) => {
                    const lvis = visits.filter((v) => v.lead_id === l.id && v.property_id === property.id);
                    return (
                      <div key={l.id}>
                        <button onClick={() => onAction && onAction({ screen: 'contactos', leadId: l.id })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                          <window.Avatar name={l.nombre} color={l.avatar || '#2E75B6'} size={28} />
                          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{l.nombre}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{l.email}</div></div>
                        </button>
                        {lvis.map((v) => (
                          <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 40px', fontSize: 12, color: 'var(--ink-3)' }}>
                            <Icon name="check" size={14} style={{ color: '#10b981' }} /> {new Date(v.scheduled_for).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {expandedSection === 'visitas' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--green)' }}>Visitas ({propVisits.length})</div>
              {propVisits.length === 0 ? <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Ninguna visita programada para esta propiedad.</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {propVisits.map((v) => {
                    const lead = leads.find((l) => l.id === v.lead_id);
                    return (
                      <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0fdf4', borderRadius: 10 }}>
                        <Icon name="calendar" size={16} style={{ color: 'var(--green)' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{lead ? lead.nombre : (v.lead_name || 'Interesado')}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{new Date(v.scheduled_for).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {expandedSection === 'compatibles' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: '#a78bfa' }}>Compatibles ({compatibles.length})</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 10, fontStyle: 'italic' }}>Estimación basada en el perfil de cada cliente.</div>
              {compatibles.length === 0 ? <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Ningún cliente compatible encontrado.</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {compatibles.slice(0, 10).map((l) => (
                    <button key={l.id} className="pd-lead-row" onClick={() => onAction && onAction({ screen: 'contactos', leadId: l.id })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f5f3ff', borderRadius: 10, border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                      <window.Avatar name={l.nombre} color={l.avatar || '#2E75B6'} size={28} />
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{l.nombre}</div><div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{l.email}</div></div>
                      <Icon name="send" size={16} style={{ color: '#a78bfa' }} />
                    </button>
                  ))}
                  {compatibles.length > 10 && <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', padding: 6 }}>y {compatibles.length - 10} más</div>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const STATUS_CLASS = { 'Disponible': 'disp', 'Reservado': 'res', 'Vendido': 'vend', 'Alquilado': 'alq' };

  // ─── CARD ────────────────────────────────────────────────────────
  function PropCard({ p, onShare, onEdit, onDelete, interesados = 0, onOpenDetail }) {
    const mainImg = p.imagenes && p.imagenes[0] ? p.imagenes[0].url : null;
    return (
      <div className="prop-card" style={{ cursor: 'pointer' }}>
        <div className="prop-img" onClick={() => onOpenDetail && onOpenDetail(p)} style={{ background: mainImg ? `url("${encodeURI(mainImg)}") center/cover` : `linear-gradient(140deg, ${p.tint}1f, ${p.tint}38)`, cursor: 'pointer' }}>
          {!mainImg && <image-slot id={p.slot} shape="rect" placeholder={'Sin foto'}></image-slot>}
          <div className="prop-status"><span className={`prop-pill ${STATUS_CLASS[p.estado]}`}>{p.estado}</span></div>
          <div className="prop-price tnum">{fmtEur(p.precio)}</div>
          {p.imagenes && p.imagenes.length > 1 && (
            <div className="prop-photos-count"><Icon name="eye" size={13} /> {p.imagenes.length} fotos</div>
          )}
        </div>
        <div className="prop-body" onClick={() => onOpenDetail && onOpenDetail(p)} style={{ cursor: 'pointer' }}>
          <div>
            <div className="prop-title">{p.titulo}</div>
            <div className="prop-loc"><Icon name="location" size={14} />{p.zona}{p.zona && p.ciudad ? ', ' : ''}{p.ciudad}</div>
          </div>
          <div className="prop-specs">
            <span className="prop-spec"><Icon name="bed" size={17} />{p.hab}</span>
            <span className="prop-spec"><Icon name="bath" size={17} />{p.banos}</span>
            <span className="prop-spec"><Icon name="area" size={17} />{p.m2} {p.unidad_superficie || 'm²'}</span>
          </div>
          <div className="prop-foot" onClick={(e) => e.stopPropagation()}>
            <div className="prop-actions">
              <button className="prop-action-btn" onClick={(e) => { e.stopPropagation(); onEdit(p); }} title="Editar"><Icon name="edit" size={15} /></button>
              <button className="prop-action-btn danger" onClick={(e) => { e.stopPropagation(); onDelete(p); }} title="Eliminar"><Icon name="trash" size={15} /></button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── SHARE MODAL ─────────────────────────────────────────────────
  function ShareModal({ prop, leads, onClose, onShared }) {
    const [picked, setPicked] = useState([]);
    const toggle = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
    return (
      <Modal open={!!prop} onClose={onClose} width={500}>
        <div className="modal-head">
          <div>
            <h2 className="t-h2" style={{ margin: 0 }}>Compartir propiedad</h2>
            <p style={{ color: 'var(--ink-3)', fontSize: 13.5, margin: '4px 0 0' }}>{prop.titulo} · {prop.zona}</p>
          </div>
          <IconButton name="close" onClick={onClose} />
        </div>
        <div className="modal-body">
          <span className="t-eyebrow" style={{ display: 'block', marginBottom: 12 }}>Selecciona leads ({picked.length})</span>
          {leads.length === 0 ? (
            <p style={{ color: 'var(--ink-3)', textAlign: 'center', padding: 20 }}>No hay leads para compartir todavía</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {leads.map((l) => (
                <div key={l.id} className={`lead-pick${picked.includes(l.id) ? ' picked' : ''}`} onClick={() => toggle(l.id)}>
                  <div className="lp-check">{picked.includes(l.id) && <Icon name="check" size={15} />}</div>
                  <Avatar name={l.nombre} color={l.avatar} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{l.nombre}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{l.ciudad || l.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" icon="send" disabled={!picked.length}
            onClick={() => { onShared(picked.length, prop.titulo); onClose(); }}>
            Enviar a {picked.length || ''} {picked.length === 1 ? 'lead' : 'leads'}
          </Button>
        </div>
      </Modal>
    );
  }

  // ─── DELETE CONFIRM ──────────────────────────────────────────────
  function ConfirmDelete({ prop, onCancel, onConfirm }) {
    const [sending, setSending] = useState(false);
    return (
      <Modal open={true} onClose={onCancel} width={440}>
        <div className="modal-head">
          <h2 className="t-h2" style={{ margin: 0 }}>Eliminar propiedad</h2>
          <IconButton name="close" onClick={onCancel} />
        </div>
        <div className="modal-body">
          <p>¿Seguro que quieres eliminar <strong>«{prop.titulo}»</strong>?</p>
          <p style={{ color: 'var(--ink-3)', fontSize: 13.5, marginTop: 8 }}>Se borrará la propiedad y sus fotos. La acción no se puede deshacer.</p>
        </div>
        <div className="modal-foot">
          <Button variant="ghost" onClick={onCancel} disabled={sending}>Cancelar</Button>
          <Button variant="danger" icon="trash" disabled={sending} onClick={async () => { setSending(true); await onConfirm(); }}>
            {sending ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </div>
      </Modal>
    );
  }

  // ─── FORM (Create + Edit) ────────────────────────────────────────
  const CARACTERISTICAS = [
    { id: 'piscina', label: 'Piscina', icon: '🏊' },
    { id: 'terraza', label: 'Terraza', icon: '🌿' },
    { id: 'garaje', label: 'Garaje', icon: '🚗' },
    { id: 'jardin', label: 'Jardín', icon: '🌳' },
    { id: 'ascensor', label: 'Ascensor', icon: '🛗' },
    { id: 'amueblado', label: 'Amueblado', icon: '🛋️' },
    { id: 'aire', label: 'A/A', icon: '❄️' },
    { id: 'mar', label: 'Vistas mar', icon: '🌊' },
  ];
  const TIPOS = [
    { v: 'piso', l: 'Piso' }, { v: 'casa', l: 'Casa' }, { v: 'villa', l: 'Villa' },
    { v: 'atico', l: 'Ático' }, { v: 'chalet', l: 'Chalet' }, { v: 'duplex', l: 'Dúplex' },
    { v: 'local', l: 'Local' }, { v: 'terreno', l: 'Terreno' }, { v: 'garaje', l: 'Garaje' },
  ];

  function PropertyFormModal({ editing, onClose, onSuccess, toast }) {
    const isEdit = !!editing;
    const [step, setStep] = useState(1);
    const [form, setForm] = useState(() => ({
      titulo: editing?.titulo || '',
      zona: editing?.zona || '',
      ciudad: editing?.ciudad || '',
      tipo: editing?.tipo_raw || editing?.tipo?.toLowerCase() || 'piso',
      regimen: editing ? (editing.precio_alquiler && editing.precio_venta ? 'ambos' : (editing.precio_alquiler ? 'alquiler' : 'venta')) : 'venta',
      precio_venta: editing?.precio_venta || '',
      precio_alquiler: editing?.precio_alquiler || '',
      habitaciones: editing?.hab ?? 1,
      banos: editing?.banos ?? 1,
      metros_cuadrados: editing?.m2 ?? 0,
      unidad_superficie: editing?.unidad_superficie || 'm²',
      descripcion: editing?.descripcion || '',
      caracteristicas: editing?.caracteristicas || [],
      estado: editing?.estado_raw || 'disponible',
    }));
    const [existingImages, setExistingImages] = useState(editing?.imagenes || []);
    const [newImages, setNewImages] = useState([]); // {preview, base64, filename}
    // mainKey identifica la imagen elegida como portada: 'e:<id>' para una existente, 'n:<index>' para una nueva.
    // null = sin cambios (se mantiene el orden actual, donde la primera ya es la principal).
    const [mainKey, setMainKey] = useState(null);
    const [sending, setSending] = useState(false);
    const fileRef = useRef(null);

    const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    // Comprime cada imagen en el navegador: redimensiona a máx. 1600px y reexporta JPEG (~0.8)
    const compressImage = (file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1600;
          let { width, height } = img;
          if (width > MAX || height > MAX) {
            if (width >= height) { height = Math.round(height * MAX / width); width = MAX; }
            else { width = Math.round(width * MAX / height); height = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base = (file.name || 'foto').replace(/\.[^.]+$/, '');
          resolve({ preview: dataUrl, base64: dataUrl.split(',')[1], filename: `${base}.jpg` });
        };
        img.onerror = () => resolve(null);
        img.src = reader.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });

    const MAX_IMAGES = 10;
    const onFilesPicked = async (files) => {
      const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
      const libres = MAX_IMAGES - (existingImages.length + newImages.length);
      if (libres <= 0) { toast(`Máximo ${MAX_IMAGES} fotos por propiedad`); return; }
      let toProcess = arr;
      if (arr.length > libres) {
        toProcess = arr.slice(0, libres);
        toast(`Se añadieron ${libres} (máximo ${MAX_IMAGES} fotos por propiedad)`);
      }
      const processed = (await Promise.all(toProcess.map(compressImage))).filter(Boolean);
      setNewImages((prev) => [...prev, ...processed]);
    };

    const removeNew = (idx) => setNewImages((p) => p.filter((_, i) => i !== idx));
    const removeExisting = async (img) => {
      if (!isEdit) return;
      try {
        await fetch(`/api/crm/properties/${editing.id}/images/${img.id}?client_id=default-client`, { method: 'DELETE' });
        setExistingImages((p) => p.filter((x) => x.id !== img.id));
      } catch (err) {
        toast('Error eliminando imagen');
      }
    };

    const onDrop = (e) => { e.preventDefault(); onFilesPicked(e.dataTransfer.files); };
    const onDragOver = (e) => e.preventDefault();

    const toggleCar = (c) => {
      setForm((f) => ({
        ...f,
        caracteristicas: f.caracteristicas.includes(c)
          ? f.caracteristicas.filter((x) => x !== c)
          : [...f.caracteristicas, c],
      }));
    };

    const canStep1 = form.titulo && (form.zona || form.ciudad) && form.tipo;
    const canStep2 = (form.regimen === 'venta' || form.regimen === 'ambos' ? !!form.precio_venta : true)
      && (form.regimen === 'alquiler' || form.regimen === 'ambos' ? !!form.precio_alquiler : true)
      && form.metros_cuadrados;

    const handleSubmit = async () => {
      setSending(true);
      try {
        let propertyId;
        if (isEdit) {
          const res = await fetch(`/api/crm/properties/${editing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, client_id: 'default-client' }),
          });
          if (!res.ok) { toast('Error al guardar'); setSending(false); return; }
          propertyId = editing.id;
        } else {
          const res = await fetch('/api/crm/properties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...form, client_id: 'default-client' }),
          });
          if (!res.ok) {
            const err = await res.json();
            toast('Error: ' + (err.error || res.statusText));
            setSending(false);
            return;
          }
          const property = await res.json();
          propertyId = property.id;
        }

        // Subir imágenes nuevas (guardamos el id real que devuelve el servidor para poder marcarla como principal)
        const uploadedNewImageIds = [];
        for (let i = 0; i < newImages.length; i++) {
          const img = newImages[i];
          const res = await fetch(`/api/crm/properties/${propertyId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: img.filename,
              base64: img.base64,
              orden: existingImages.length + i,
              client_id: 'default-client',
            }),
          });
          const saved = res.ok ? await res.json() : null;
          uploadedNewImageIds.push(saved?.id || null);
        }

        // Si el usuario eligió una portada distinta de la que ya era principal, la persistimos.
        if (mainKey) {
          let mainImageId = null;
          if (mainKey.startsWith('e:')) mainImageId = mainKey.slice(2);
          else if (mainKey.startsWith('n:')) mainImageId = uploadedNewImageIds[Number(mainKey.slice(2))];
          if (mainImageId) {
            await fetch(`/api/crm/properties/${propertyId}/images/${mainImageId}/set-main?client_id=default-client`, { method: 'PATCH' });
          }
        }

        toast(isEdit ? '✓ Propiedad actualizada' : '✓ Propiedad publicada en la web');
        onSuccess();
        onClose();
      } catch (err) {
        toast('Error: ' + err.message);
      } finally {
        setSending(false);
      }
    };

    return (
      <Modal open={true} onClose={onClose} width={720}>
        <div className="pf-head">
          <div>
            <h2 className="pf-title">{isEdit ? 'Editar propiedad' : 'Nueva propiedad'}</h2>
            <p className="pf-sub">Paso {step} de 3 · {step === 1 ? 'Información básica' : step === 2 ? 'Detalles y precio' : 'Imágenes y publicación'}</p>
          </div>
          <IconButton name="close" onClick={onClose} />
        </div>

        <div className="pf-progress">
          <div className={`pf-step ${step >= 1 ? 'on' : ''}`}>1</div>
          <div className={`pf-bar ${step >= 2 ? 'on' : ''}`} />
          <div className={`pf-step ${step >= 2 ? 'on' : ''}`}>2</div>
          <div className={`pf-bar ${step >= 3 ? 'on' : ''}`} />
          <div className={`pf-step ${step >= 3 ? 'on' : ''}`}>3</div>
        </div>

        <div className="pf-body">
          {step === 1 && (
            <div className="pf-grid">
              <div className="pf-field pf-full">
                <label>Título <span className="req">*</span></label>
                <input type="text" placeholder="Ej. Ático luminoso con terraza" value={form.titulo}
                  onChange={(e) => update('titulo', e.target.value)} />
              </div>
              <div className="pf-field">
                <label>Zona / Barrio</label>
                <input type="text" placeholder="Las Américas, Santa Cruz…" value={form.zona}
                  onChange={(e) => update('zona', e.target.value)} />
              </div>
              <div className="pf-field">
                <label>Ciudad <span className="req">*</span></label>
                <input type="text" placeholder="Tenerife, Adeje, Arona…" value={form.ciudad}
                  onChange={(e) => update('ciudad', e.target.value)} />
              </div>
              <div className="pf-field pf-full">
                <label>Tipo de inmueble</label>
                <div className="pf-tipos">
                  {TIPOS.map((t) => (
                    <button key={t.v} type="button"
                      className={`pf-tipo ${form.tipo === t.v ? 'on' : ''}`}
                      onClick={() => update('tipo', t.v)}>{t.l}</button>
                  ))}
                </div>
              </div>
              <div className="pf-field pf-full">
                <label>Régimen</label>
                <div className="pf-regimen">
                  <button type="button" className={`pf-reg ${form.regimen === 'venta' ? 'on' : ''}`}
                    onClick={() => update('regimen', 'venta')}>Venta</button>
                  <button type="button" className={`pf-reg ${form.regimen === 'alquiler' ? 'on' : ''}`}
                    onClick={() => update('regimen', 'alquiler')}>Alquiler</button>
                  <button type="button" className={`pf-reg ${form.regimen === 'ambos' ? 'on' : ''}`}
                    onClick={() => update('regimen', 'ambos')}>Ambos</button>
                </div>
              </div>
              {isEdit && (
                <div className="pf-field pf-full">
                  <label>Estado</label>
                  <div className="pf-regimen">
                    {['disponible', 'reservado', 'vendido', 'alquilado'].map((s) => (
                      <button key={s} type="button" className={`pf-reg ${form.estado === s ? 'on' : ''}`}
                        onClick={() => update('estado', s)} style={{textTransform: 'capitalize'}}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="pf-grid">
              {(form.regimen === 'venta' || form.regimen === 'ambos') && (
                <div className="pf-field pf-full">
                  <label>Precio de venta (€) <span className="req">*</span></label>
                  <div className="pf-input-icon">
                    <span>€</span>
                    <input type="number" placeholder="450000" value={form.precio_venta}
                      onChange={(e) => update('precio_venta', e.target.value)} />
                  </div>
                </div>
              )}
              {(form.regimen === 'alquiler' || form.regimen === 'ambos') && (
                <div className="pf-field pf-full">
                  <label>Precio alquiler (€/mes) <span className="req">*</span></label>
                  <div className="pf-input-icon">
                    <span>€/mes</span>
                    <input type="number" placeholder="1500" value={form.precio_alquiler}
                      onChange={(e) => update('precio_alquiler', e.target.value)} />
                  </div>
                </div>
              )}
              <div className="pf-field">
                <label>Habitaciones</label>
                <div className="pf-counter">
                  <button type="button" onClick={() => update('habitaciones', Math.max(0, form.habitaciones - 1))}>−</button>
                  <span>{form.habitaciones}</span>
                  <button type="button" onClick={() => update('habitaciones', form.habitaciones + 1)}>+</button>
                </div>
              </div>
              <div className="pf-field">
                <label>Baños</label>
                <div className="pf-counter">
                  <button type="button" onClick={() => update('banos', Math.max(0, form.banos - 1))}>−</button>
                  <span>{form.banos}</span>
                  <button type="button" onClick={() => update('banos', form.banos + 1)}>+</button>
                </div>
              </div>
              <div className="pf-field pf-full">
                <label>Superficie <span className="req">*</span></label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                  <div className="pf-input-icon" style={{ flex: 1 }}>
                    <input type="number" placeholder="120" value={form.metros_cuadrados}
                      onChange={(e) => update('metros_cuadrados', Number(e.target.value))} />
                    <span>{form.unidad_superficie}</span>
                  </div>
                  <div className="pf-tipos" style={{ flex: 'none' }}>
                    <button type="button" className={`pf-tipo ${form.unidad_superficie === 'm²' ? 'on' : ''}`}
                      onClick={() => update('unidad_superficie', 'm²')}>m²</button>
                    <button type="button" className={`pf-tipo ${form.unidad_superficie === 'm' ? 'on' : ''}`}
                      onClick={() => update('unidad_superficie', 'm')}>metros</button>
                  </div>
                </div>
              </div>
              <div className="pf-field pf-full">
                <label>Características</label>
                <div className="pf-caracs">
                  {CARACTERISTICAS.map((c) => (
                    <button key={c.id} type="button"
                      className={`pf-carac ${form.caracteristicas.includes(c.id) ? 'on' : ''}`}
                      onClick={() => toggleCar(c.id)}>
                      <span className="pf-carac-icon">{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pf-field pf-full">
                <label>Descripción</label>
                <textarea placeholder="Describe la propiedad, ubicación, vecindario, reformas…"
                  value={form.descripcion}
                  onChange={(e) => update('descripcion', e.target.value)} />
              </div>
            </div>
          )}

          {step === 3 && (() => {
            const totalImgs = existingImages.length + newImages.length;
            const lleno = totalImgs >= MAX_IMAGES;
            return (
            <div className="pf-images-step">
              <div className="pf-drop" onDrop={lleno ? (e) => e.preventDefault() : onDrop} onDragOver={onDragOver}
                onClick={() => { if (!lleno) fileRef.current?.click(); }}
                style={lleno ? { opacity: 0.55, cursor: 'not-allowed' } : null}>
                <div className="pf-drop-icon">📷</div>
                <h3>{lleno ? `Máximo de ${MAX_IMAGES} fotos alcanzado` : 'Arrastra tus fotos aquí'}</h3>
                <p>{lleno
                  ? 'Elimina alguna foto si quieres añadir otra.'
                  : `o haz clic para seleccionar · JPG, PNG, WebP · se comprimen automáticamente · ${totalImgs}/${MAX_IMAGES} fotos`}</p>
                <input ref={fileRef} type="file" multiple accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => onFilesPicked(e.target.files)} />
              </div>

              {(existingImages.length > 0 || newImages.length > 0) && (() => {
                // Sin selección explícita, la principal es la primera existente (o si no hay, la primera nueva) — igual que hoy en la web.
                const defaultKey = existingImages.length > 0 ? 'e:' + existingImages[0].id : (newImages.length > 0 ? 'n:0' : null);
                const activeKey = mainKey || defaultKey;
                return (
                <div className="pf-imgs-grid">
                  {existingImages.map((img, i) => {
                    const key = 'e:' + img.id;
                    const isMain = activeKey === key;
                    return (
                    <div key={'e'+img.id} className="pf-img-card" style={{ position: 'relative' }}>
                      <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {isMain && <div className="pf-img-badge">★ Principal</div>}
                      <button type="button" className="pf-img-main" onClick={() => setMainKey(key)} title="Marcar como principal" style={{ position: 'absolute', top: 4, right: 28, background: isMain ? '#f59e0b' : 'rgba(255,255,255,0.8)', border: 'none', width: 28, height: 28, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>★</button>
                      <button type="button" className="pf-img-rm" onClick={() => removeExisting(img)}>×</button>
                    </div>
                    );
                  })}
                  {newImages.map((img, i) => {
                    const key = 'n:' + i;
                    const isMain = activeKey === key;
                    return (
                    <div key={'n'+i} className="pf-img-card" style={{ position: 'relative' }}>
                      <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {isMain && <div className="pf-img-badge">★ Principal</div>}
                      <button type="button" className="pf-img-main" onClick={() => setMainKey(key)} title="Marcar como principal" style={{ position: 'absolute', top: 4, right: 28, background: isMain ? '#f59e0b' : 'rgba(255,255,255,0.8)', border: 'none', width: 28, height: 28, borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>★</button>
                      <button type="button" className="pf-img-rm" onClick={() => removeNew(i)}>×</button>
                    </div>
                    );
                  })}
                </div>
                );
              })()}

              {existingImages.length === 0 && newImages.length === 0 && (
                <p className="pf-hint">Puedes publicar sin imágenes, pero las propiedades con fotos reciben hasta 5× más contactos.</p>
              )}
            </div>
            );
          })()}
        </div>

        <div className="pf-foot">
          <Button variant="ghost" onClick={onClose} disabled={sending}>Cancelar</Button>
          <div style={{ flex: 1 }} />
          {step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)} disabled={sending}>Atrás</Button>}
          {step < 3 && (
            <Button variant="primary" onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !canStep1) || (step === 2 && !canStep2)}>
              Continuar
            </Button>
          )}
          {step === 3 && (
            <Button variant="primary" icon="check" onClick={handleSubmit} disabled={sending}>
              {sending ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Publicar propiedad')}
            </Button>
          )}
        </div>
      </Modal>
    );
  }

  // ─── SCREEN ──────────────────────────────────────────────────────
  function PropertiesScreen({ properties, leads = [], visits = [], toast, onRefresh, onOpenLead, extFilter }) {
    const [share, setShare] = useState(null);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [filterEstado, setFilterEstado] = useState('todos');

    // Aplicar filtro externo si viene
    React.useEffect(() => {
      if (!extFilter) return;
      if (extFilter._propertyDetailContext && extFilter._selectedProperty) {
        setSelectedProperty(extFilter._selectedProperty);
      }
      if (extFilter.estado) setFilterEstado(extFilter.estado);
    }, [extFilter]);

    const leadsDe = (propId) => leads.filter((l) => {
      let propIds = [];
      if (l.propiedades && Array.isArray(l.propiedades) && l.propiedades.length) {
        propIds = l.propiedades;
      } else {
        try { const a = JSON.parse(l.interes_propiedades || '[]'); if (Array.isArray(a) && a.length) propIds = a; } catch {}
        if (propIds.length === 0) propIds = l.propiedad ? [l.propiedad] : (l.source_property_id ? [l.source_property_id] : []);
      }
      return propIds.includes(propId);
    });

    const handleDelete = async (prop) => {
      try {
        const res = await fetch(`/api/crm/properties/${prop.id}?client_id=default-client`, { method: 'DELETE' });
        if (res.ok) {
          toast('✓ Propiedad eliminada');
          setConfirmDelete(null);
          onRefresh && onRefresh();
        } else {
          toast('Error al eliminar');
        }
      } catch (err) {
        toast('Error: ' + err.message);
      }
    };

    return (
      <div className="page">
        <div className="page-head">
          <div className="ph-l">
            <h1 className="t-h1">Propiedades</h1>
            <span className="sub">{properties.length} {properties.length === 1 ? 'inmueble' : 'inmuebles'} en cartera</span>
          </div>
          <div className="toolbar">
            <Button variant="primary" icon="plus" onClick={() => { setEditing(null); setShowForm(true); }}>Añadir propiedad</Button>
          </div>
        </div>

        {/* 🎯 Selector de propiedades destacadas (desde recomendación) */}
        {extFilter?._highlightPropertyIds && extFilter._highlightPropertyIds.length > 0 && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: extFilter._compatibleMode ? '#f3e8ff' : '#fff7ed', border: `1px solid ${extFilter._compatibleMode ? '#d8b4fe' : '#fed7aa'}`, borderRadius: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: extFilter._compatibleMode ? '#7c3aed' : '#b45309' }}>
              {extFilter._compatibleMode ? '✉️ Propiedades con compatibles (clic para abrir):' : '📌 Propiedades con oportunidades (clic para abrir):'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {extFilter._highlightPropertyIds.map(propId => {
                const prop = properties.find(p => p.id === propId);
                const isCompat = extFilter._compatibleMode;
                const borderColor = isCompat ? '#d8b4fe' : '#f59e0b';
                const textColor = isCompat ? '#7c3aed' : '#b45309';
                const hoverBg = isCompat ? '#f3e8ff' : '#fef3c7';
                return prop ? (
                  <button
                    key={prop.id}
                    onClick={() => setSelectedProperty(prop)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: `1px solid ${borderColor}`,
                      background: 'white',
                      color: textColor,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 13,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => { e.target.style.background = hoverBg; }}
                    onMouseLeave={(e) => { e.target.style.background = 'white'; }}
                  >
                    {prop.titulo}
                  </button>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Selector de estado */}
        {properties.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {['todos', 'Disponible', 'Reservado', 'Vendido', 'Alquilado'].map((est) => (
              <button
                key={est}
                onClick={() => setFilterEstado(est)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: filterEstado === est ? '2px solid var(--blue)' : '1px solid var(--border-1)',
                  background: filterEstado === est ? 'var(--blue-50)' : 'white',
                  color: filterEstado === est ? 'var(--blue)' : 'var(--ink)',
                  fontWeight: filterEstado === est ? 600 : 500,
                  cursor: 'pointer',
                  fontSize: 13,
                  transition: 'all 0.2s ease',
                }}
              >
                {est === 'todos' ? 'Todos' : est} {est !== 'todos' && `(${properties.filter(p => p.estado === est).length})`}
              </button>
            ))}
          </div>
        )}

        {properties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h2>No hay propiedades todavía</h2>
            <p>Añade tu primera propiedad para empezar. Aparecerá automáticamente publicada en la web.</p>
            <Button variant="primary" icon="plus" onClick={() => { setEditing(null); setShowForm(true); }}>Añadir primera propiedad</Button>
          </div>
        ) : (
          <div className="prop-grid">
            {properties.filter((p) => filterEstado === 'todos' || p.estado === filterEstado).map((p) => (
              <PropCard key={p.id} p={p}
                interesados={leadsDe(p.id).length}
                onOpenDetail={(prop) => setSelectedProperty(prop)}
                onShare={setShare}
                onEdit={(prop) => { setEditing(prop); setShowForm(true); }}
                onDelete={(prop) => setConfirmDelete(prop)} />
            ))}
          </div>
        )}

        {share && (
          <ShareModal prop={share} leads={leads} onClose={() => setShare(null)}
            onShared={(n, title) => toast(`Compartido «${title}» con ${n} ${n === 1 ? 'lead' : 'leads'}`)} />
        )}

        {showForm && (
          <PropertyFormModal
            editing={editing}
            onClose={() => { setShowForm(false); setEditing(null); }}
            onSuccess={() => { onRefresh && onRefresh(); }}
            toast={toast} />
        )}

        {confirmDelete && (
          <ConfirmDelete prop={confirmDelete}
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => handleDelete(confirmDelete)} />
        )}

        {selectedProperty && (
          <div className="drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && setSelectedProperty(null)}>
            <div className="drawer">
              <PropertyDetail
                property={selectedProperty}
                leads={leads}
                visits={visits}
                properties={properties}
                onClose={() => setSelectedProperty(null)}
                onAction={(action) => { setSelectedProperty(null); onOpenLead && action.leadId ? onOpenLead(action.leadId) : null; }}
                initialTab={extFilter?._propertyDetailContext ? extFilter.activeTab : null} />
            </div>
          </div>
        )}

        {/* Legacy modal de interesados - mantener si es necesario */}
        {false && (() => {
          const lista = leadsDe(null);
          return (
            <Modal open={false} onClose={() => {}} width={520}>
              <div className="modal-head">
                <div>
                  <h2 className="t-h2" style={{ margin: 0 }}>Interesados en esta propiedad</h2>
                </div>
              </div>
              <div style={{ padding: '8px 4px 4px' }}>
                {lista.length === 0 ? (
                  <p style={{ color: 'var(--ink-3)', fontSize: 13.5, padding: '24px 12px', textAlign: 'center' }}>Todavía no hay leads interesados en esta propiedad.</p>
                ) : lista.map((l) => (
                  <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderBottom: '1px solid var(--line-2)' }}>
                    <Avatar name={l.nombre} color={l.avatar} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{l.nombre}</div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{l.email}{l.tel ? ' · ' + l.tel : ''}</div>
                    </div>
                    <span className={`badge badge-${l.estado}`}><span className="bdot" />{(window.STATUS_LABEL && window.STATUS_LABEL[l.estado]) || l.estado}</span>
                  </div>
                ))}
              </div>
            </Modal>
          );
        })()}
      </div>
    );
  }

  window.PropertiesScreen = PropertiesScreen;
})();
