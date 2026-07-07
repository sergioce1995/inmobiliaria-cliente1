// app.jsx — shell: sidebar, topbar, routing, tweaks
(function () {
  const { useState, useEffect } = React;
  const {
    Icon, Avatar, useToasts,
    LoginScreen, InboxScreen, ContactsScreen, PropertiesScreen, CalendarScreen,
    DashboardScreen, NotificationsScreen, UIKitScreen, ValoracionesScreen, HomeScreen,
    useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle,
  } = window;

  const NAV = [
    { id: 'inicio', label: 'Inicio', icon: 'home', title: 'Inicio' },
    { id: 'contactos', label: 'Base de datos', icon: 'contacts', title: 'Base de datos' },
    { id: 'propiedades', label: 'Propiedades', icon: 'properties', title: 'Propiedades' },
    { id: 'calendario', label: 'Calendario', icon: 'calendar', title: 'Calendario de visitas' },
    { id: 'valoraciones', label: 'Captación', icon: 'tag', title: 'Captación' },
    { id: 'dashboard', label: 'Análisis', icon: 'dashboard', title: 'Análisis' },
    { id: 'notificaciones', label: 'Notificaciones', icon: 'bell', title: 'Notificaciones' },
    { id: 'uikit', label: 'UI Kit', icon: 'kit', title: 'UI Kit' },
  ];

  const FONTS = {
    'Onest': "'Onest', system-ui, sans-serif",
    'Hanken': "'Hanken Grotesk', system-ui, sans-serif",
    'Sistema': "system-ui, -apple-system, 'Segoe UI', sans-serif",
  };
  const ACCENTS = {
    '#2E75B6': { d: '#1e5a96', l: '#eef4fb', l2: '#dbe8f6' },
    '#7A5AE0': { d: '#5f3fc4', l: '#f1edfc', l2: '#e3dafa' },
    '#0ea5a3': { d: '#0b827f', l: '#e7f6f5', l2: '#c9ebea' },
  };

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    font: 'Onest',
    accent: '#2E75B6',
    sidebarSolid: false,
    cardElevation: true,
  }/*EDITMODE-END*/;

  function Sidebar({ screen, setScreen, collapsed, setCollapsed, newCount, valPending, user = {}, mobileOpen, onCloseMobile }) {
    return (
      <>
        <div className={`sidebar-backdrop${mobileOpen ? ' open' : ''}`} onClick={onCloseMobile} />
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
          <div className="sb-brand">
            <div className="sb-logo">Z</div>
            {!collapsed && <span className="name">ZADI<span> ·</span></span>}
          </div>
          <button className="sb-collapse" onClick={() => setCollapsed((c) => !c)}>
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={15} />
          </button>
          <nav className="sb-nav">
            {NAV.map((n, i) => n.sec ? (
              <div className="sb-section" key={i}>{n.sec}</div>
            ) : (
              <button key={n.id} className={`sb-item${screen === n.id ? ' active' : ''}`} onClick={() => { setScreen(n.id); onCloseMobile && onCloseMobile(); }}
                title={collapsed ? n.label : undefined}>
                <Icon name={n.icon} size={20} />
                <span className="lbl">{n.label}</span>
                {n.id === 'contactos' && newCount > 0 && <span className="count">{newCount}</span>}
                {n.id === 'valoraciones' && valPending > 0 && <span className="count">{valPending}</span>}
              </button>
            ))}
          </nav>
          <div className="sb-foot">
            <div className="sb-user">
              <Avatar name={user.nombre || 'Usuario'} color="#2E75B6" size={36} />
              <div className="uinfo">
                <div className="n">{user.nombre || 'Usuario'}</div>
                <div className="r">{user.role === 'admin' ? 'Administrador' : 'Agente'}</div>
              </div>
              {!collapsed && <Icon name="chevronDown" size={16} style={{ marginLeft: 'auto', color: 'var(--ink-3)' }} />}
            </div>
          </div>
        </aside>
      </>
    );
  }

  function Topbar({ title, onLogout, onGo, notifications = [], user = {}, onMenuClick }) {
    const [menu, setMenu] = useState(false);
    const [bell, setBell] = useState(false);
    const notifs = notifications;
    const newCount = notifications.length;
    useEffect(() => {
      const h = () => { setMenu(false); setBell(false); };
      if (menu || bell) { window.addEventListener('click', h); return () => window.removeEventListener('click', h); }
    }, [menu, bell]);
    return (
      <header className="topbar">
        <button className="mobile-menu-btn" onClick={onMenuClick}><Icon name="menu" size={20} /></button>
        <div className="crumbs">
          <span>ZADI</span><Icon name="chevronRight" size={14} /><span className="cur">{title}</span>
        </div>
        <div className="topbar-spacer" />
        <div style={{ position: 'relative' }}>
          <button className="icon-btn bordered bell-btn" onClick={(e) => { e.stopPropagation(); setBell((b) => !b); setMenu(false); }}>
            <Icon name="bell" size={19} />
            {newCount > 0 && <span className="bell-badge">{newCount}</span>}
          </button>
          {bell && (
            <div className="dropdown" style={{ width: 320 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '8px 12px', fontWeight: 700, fontSize: 14 }}>Notificaciones</div>
              <div className="dd-sep" />
              {notifs.length === 0 ? (
                <div style={{ padding: '18px 12px', fontSize: 13, color: 'var(--ink-3)', textAlign: 'center' }}>Sin notificaciones</div>
              ) : notifs.slice(0, 6).map((n, i) => (
                <button className="dd-item" key={i} style={{ height: 'auto', padding: '9px 12px', alignItems: 'flex-start' }} onClick={() => { onGo(n.screen || 'notificaciones'); setBell(false); }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--blue-50)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon name={n.icon} size={16} /></span>
                  <span style={{ textAlign: 'left' }}>
                    <span style={{ display: 'block', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.35 }}>{n.txt}</span>
                    <span style={{ fontSize: 11.5, color: 'var(--ink-4)' }}>{n.fecha}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="user-menu">
          <button className="user-chip" onClick={(e) => { e.stopPropagation(); setMenu((m) => !m); setBell(false); }}>
            <Avatar name={user.nombre || 'Usuario'} color="#2E75B6" size={28} />
            <span className="un">{(user.nombre || 'Usuario').split(' ')[0]}</span>
            <Icon name="chevronDown" size={15} style={{ color: 'var(--ink-3)' }} />
          </button>
          {menu && (
            <div className="dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="dd-head">
                <Avatar name={user.nombre || 'Usuario'} color="#2E75B6" size={40} />
                <div><div style={{ fontWeight: 700, fontSize: 14 }}>{user.nombre || 'Usuario'}</div><div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{user.email}</div></div>
              </div>
              <div className="dd-sep" />
              <button className="dd-item"><Icon name="user" size={18} />Mi perfil</button>
              <button className="dd-item" onClick={() => onGo('notificaciones')}><Icon name="settings" size={18} />Configuración</button>
              <div className="dd-sep" />
              <button className="dd-item danger" onClick={onLogout}><Icon name="logout" size={18} />Cerrar sesión</button>
            </div>
          )}
        </div>
      </header>
    );
  }

  function App() {
    const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
    const [logged, setLogged] = useState(false);
    const [user, setUser] = useState({ nombre: '', email: '', role: '' });
    const [screen, setScreen] = useState('inicio');
    const [collapsed, setCollapsed] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    // Asegurar que ZADI_DATA existe
    const zadiData = window.ZADI_DATA || { leads: [], valoraciones: [], properties: [], analytics: { kpis: [], funnel: [], sources: [], trend: [], insights: [] }, notifications: [] };
    const [leads, setLeads] = useState(zadiData.leads || []);
    const [valoraciones, setValoraciones] = useState(zadiData.valoraciones || []);
    const [properties, setProperties] = useState([]);
    const [visits, setVisits] = useState([]);
    const [extFilter, setExtFilter] = useState(null);
    const [pushToast, toastNode] = useToasts();

    // ── VISITAS ──────────────────────────────────────────────
    const loadVisits = async () => {
      try {
        const res = await fetch('/api/crm/visits?client_id=default-client');
        const data = await res.json();
        setVisits(data.visits || []);
      } catch (err) {
        console.error('Error loading visits:', err);
      }
    };

    // Crea o actualiza la visita de un lead. Si ya tiene visita programada, la mueve.
    const saveVisit = async (leadId, scheduledFor, opts = {}) => {
      try {
        const existing = visits.find((v) => v.lead_id === leadId && v.status === 'programada');
        const lead = leads.find((l) => l.id === leadId);
        if (existing) {
          await fetch(`/api/crm/visits/${existing.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_id: 'default-client', scheduled_for: scheduledFor, ...opts }),
          });
        } else {
          await fetch('/api/crm/visits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: 'default-client',
              lead_id: leadId,
              property_id: opts.property_id || null,
              scheduled_for: scheduledFor,
              title: opts.title || (lead ? `Visita · ${lead.nombre}` : 'Visita'),
              notes: opts.notes || '',
              duration_minutes: opts.duration_minutes || 30,
            }),
          });
        }
        await loadVisits();
        // Al programar visita, el lead pasa automáticamente a "Visita" (si estaba nuevo/contactado)
        if (lead && (lead.estado === 'nuevo' || lead.estado === 'contactado')) {
          await fetch(`/api/crm/leads/${leadId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: 'default-client', status: 'visita' }) });
          await loadLeads();
        }
        pushToast('Visita guardada');
      } catch (err) {
        console.error('Error saving visit:', err);
      }
    };

    const deleteVisit = async (visitId) => {
      try {
        await fetch(`/api/crm/visits/${visitId}?client_id=default-client`, { method: 'DELETE' });
        await loadVisits();
        pushToast('Visita eliminada');
      } catch (err) {
        console.error('Error deleting visit:', err);
      }
    };

    // Mueve una visita (drag&drop o edición) a otra fecha/hora.
    const moveVisit = async (visitId, scheduledFor) => {
      try {
        await fetch(`/api/crm/visits/${visitId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: 'default-client', scheduled_for: scheduledFor }),
        });
        await loadVisits();
      } catch (err) {
        console.error('Error moving visit:', err);
      }
    };

    // Crea una visita nueva directamente desde el calendario (lead + fecha).
    const createVisit = async ({ lead_id, scheduled_for, property_id, notes, duration_minutes }) => {
      try {
        const lead = leads.find((l) => l.id === lead_id);
        await fetch('/api/crm/visits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: 'default-client',
            lead_id,
            property_id: property_id || null,
            scheduled_for,
            title: lead ? `Visita · ${lead.nombre}` : 'Visita',
            notes: notes || '',
            duration_minutes: duration_minutes || 30,
          }),
        });
        await loadVisits();

        if (lead && property_id) {
          // 🔧 Auto-add property to lead's interes_propiedades if not already present
          const currentProps = lead.interes_propiedades ? JSON.parse(lead.interes_propiedades) : [];
          // Normalizar IDs (algunos pueden ser objetos, otros strings)
          const propIds = currentProps.map(p => typeof p === 'object' ? p.id : p);
          if (!propIds.includes(property_id)) {
            // Guardar solo los IDs (no objetos) para evitar "object object" en UI
            const updatedProps = [...propIds, property_id];
            await fetch(`/api/crm/leads/${lead_id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                client_id: 'default-client',
                interes_propiedades: JSON.stringify(updatedProps),
              }),
            });
          }
        }

        if (lead && (lead.estado === 'nuevo' || lead.estado === 'contactado')) {
          await fetch(`/api/crm/leads/${lead_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: 'default-client', status: 'visita' }) });
          await loadLeads();
        }
        pushToast('Visita creada');
      } catch (err) {
        console.error('Error creating visit:', err);
      }
    };

    // Cargar propiedades reales desde la API (incluye todas: disponible, vendidas, alquiladas, etc.)
    const loadProperties = async () => {
      try {
        const res = await fetch('/api/paula/properties?all=true');
        const data = await res.json();
        const list = (data.properties || []).map((p, i) => {
          const tipoLabel = (p.tipo || p.kind || 'piso').toLowerCase();
          return ({
            id: p.id,
            titulo: p.title || p.titulo || 'Sin título',
            tipo_raw: tipoLabel,
            tipo: tipoLabel.charAt(0).toUpperCase() + tipoLabel.slice(1),
            zona: p.area || p.zona || '',
            ciudad: p.ciudad || '',
            precio: p.price || p.precio_venta || p.precio_alquiler || 0,
            precio_venta: p.type === 'compra' ? (p.price || 0) : null,
            precio_alquiler: p.type === 'alquiler' ? (p.price || 0) : null,
            comision: 3,
            hab: p.rooms ?? p.habitaciones ?? 0,
            banos: p.baths ?? p.banos ?? 0,
            m2: p.m2 ?? p.metros_cuadrados ?? 0,
            unidad_superficie: p.unidad_superficie || 'm²',
            estado: p.estado ? (p.estado.charAt(0).toUpperCase() + p.estado.slice(1).toLowerCase()) : (p.tag === 'reservado' ? 'Reservado' : (p.tag === 'vendido' ? 'Vendido' : (p.tag === 'alquilado' ? 'Alquilado' : 'Disponible'))),
            estado_raw: p.tag || 'disponible',
            web: true,
            views: 0,
            shares: 0,
            slot: `prop${i+1}`,
            tint: ['#2E75B6','#F5A623','#5cb338','#7A5AE0','#e5544b','#0ea5a3'][i % 6],
            descripcion: p.description || p.descripcion || '',
            imagenes: p.photos || p.images || [],
            caracteristicas: p.features || p.caracteristicas || [],
          });
        });
        setProperties(list);
        window.ZADI_DATA.properties = list;
        // Mapa id→título para resolver "Propiedad de interés" en los leads
        const ref = {};
        list.forEach((p) => { ref[p.id] = p.titulo; });
        window.ZADI_DATA.property_ref = ref;
      } catch (err) {
        console.error('Error loading properties:', err);
      }
    };

    // Helper: Obtener las propiedades de interés de un lead (normalizado)
    const getLeadProperties = (lead) => {
      if (!lead) return [];
      try {
        if (lead.propiedades && Array.isArray(lead.propiedades) && lead.propiedades.length) return lead.propiedades;
        const a = JSON.parse(lead.interes_propiedades || '[]');
        if (Array.isArray(a) && a.length) return a;
      } catch {}
      return lead.source_property_id ? [lead.source_property_id] : [];
    };

    // Cargar intereses desde la API
    const loadIntereses = async () => {
      try {
        const res = await fetch('/api/crm/intereses?client_id=default-client');
        const data = await res.json();
        // La API devuelve un array directamente o en data.intereses
        const intereses = Array.isArray(data) ? data : (data.intereses || []);
        window.ZADI_DATA.intereses = intereses;
        console.log('✅ Intereses cargados:', intereses.length);
        return intereses;
      } catch (err) {
        console.error('Error loading intereses:', err);
        return [];
      }
    };

    // Cargar leads reales desde la API
    const loadLeads = async () => {
      try {
        // Cargar intereses primero
        const intereses = await loadIntereses();

        const res = await fetch('/api/crm/leads?client_id=default-client');
        const data = await res.json();
        const validStatuses = ['nuevo', 'contactado', 'visita', 'negociacion', 'cerrado', 'perdido'];
        const list = (data.leads || [])
          .filter((l) => validStatuses.includes(l.status))
          .map((l) => {
            // Obtener intereses de este lead
            const leadIntereses = intereses.filter(i => i.lead_id === l.id) || [];
            // Extraer property_ids desde los intereses del lead
            const propsFromIntereses = [...new Set(leadIntereses.map(i => i.property_id).filter(Boolean))];
            // Usar propiedades desde intereses si existen, sino fallback a getLeadProperties
            const propiedades = propsFromIntereses.length > 0 ? propsFromIntereses : getLeadProperties(l);
            return {
              id: l.id,
              nombre: `${l.nombre || ''} ${l.apellidos || ''}`.trim() || 'Sin nombre',
              _nombre: l.nombre || '',
              _apellidos: l.apellidos || '',
              email: l.email || '',
              tel: l.telefono || '',
              estado: l.status || 'nuevo',
              status: l.status || 'nuevo',
              origen: l.origin || 'Web',
              propiedad: l.source_property_id || '',
              propiedades: propiedades,
              interes_propiedades: JSON.stringify(propiedades),
              intereses: leadIntereses, // NUEVO: agregar intereses
              presupuesto: 0,
              ciudad: '',
              created_at: l.created_at || null,
              updated_at: l.updated_at || l.created_at || null,
              fecha: 'Reciente',
              avatar: '#2E75B6',
              score: 80,
              interacciones: [],
            };
          });
        setLeads(list);
      } catch (err) {
        console.error('Error loading leads:', err);
      }
    };

    // ── CAPTACIONES ──────────────────────────────────────────
    const mapCaptacion = (c) => ({
      id: c.id,
      tipo: c.tipo || 'Piso',
      ciudad: c.ciudad || '',
      direccion: c.direccion || '',
      m2: c.metros_cuadrados || 0,
      hab: c.habitaciones || 0,
      banos: c.banos || 0,
      propietario: c.propietario || 'Propietario',
      avatar: '#2E75B6',
      email: c.email || '',
      tel: c.telefono || '',
      estado: c.estado || 'pendiente',
      fecha: 'Reciente',
      notas: c.notas || '',
      estimado: c.estimado || null,
    });

    const loadCaptaciones = async () => {
      try {
        const res = await fetch('/api/crm/captaciones?client_id=default-client');
        const data = await res.json();
        setValoraciones((data.captaciones || []).map(mapCaptacion));
      } catch (err) {
        console.error('Error loading captaciones:', err);
      }
    };

    const createCaptacion = async (form) => {
      try {
        const res = await fetch('/api/crm/captaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: 'default-client',
            propietario: form.propietario,
            email: form.email,
            telefono: form.tel,
            tipo: form.tipo,
            direccion: form.direccion,
            ciudad: form.ciudad,
            metros_cuadrados: form.m2 || null,
            habitaciones: form.hab || null,
            banos: form.banos || null,
            notas: form.notas,
            origin: 'manual',
          }),
        });
        if (!res.ok) throw new Error('No se pudo crear');
        await loadCaptaciones();
        await loadLeads();
        pushToast('Captación añadida');
        return true;
      } catch (err) {
        console.error('Error creating captación:', err);
        pushToast('Error al crear la captación');
        return false;
      }
    };

    const updateCaptacion = async (id, f) => {
      const body = { client_id: 'default-client' };
      if (f.estado !== undefined) body.estado = f.estado;
      if (f.estimado !== undefined) body.estimado = f.estimado;
      if (f.propietario !== undefined) body.propietario = f.propietario;
      if (f.email !== undefined) body.email = f.email;
      if (f.tel !== undefined) body.telefono = f.tel;
      if (f.tipo !== undefined) body.tipo = f.tipo;
      if (f.direccion !== undefined) body.direccion = f.direccion;
      if (f.ciudad !== undefined) body.ciudad = f.ciudad;
      if (f.m2 !== undefined) body.metros_cuadrados = f.m2;
      if (f.hab !== undefined) body.habitaciones = f.hab;
      if (f.banos !== undefined) body.banos = f.banos;
      if (f.notas !== undefined) body.notas = f.notas;
      // Optimista para feedback inmediato
      setValoraciones((vs) => vs.map((v) => v.id === id ? { ...v, ...f } : v));
      try {
        const res = await fetch(`/api/crm/captaciones/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('No se pudo actualizar');
        await loadCaptaciones();
        return true;
      } catch (err) {
        console.error('Error updating captación:', err);
        pushToast('Error al actualizar la captación');
        await loadCaptaciones();
        return false;
      }
    };

    const deleteCaptacion = async (id) => {
      try {
        const res = await fetch(`/api/crm/captaciones/${id}?client_id=default-client`, { method: 'DELETE' });
        if (!res.ok) throw new Error('No se pudo eliminar');
        await loadCaptaciones();
        pushToast('Captación eliminada');
        return true;
      } catch (err) {
        console.error('Error deleting captación:', err);
        pushToast('Error al eliminar la captación');
        return false;
      }
    };

    const convertCaptacion = async (id) => {
      try {
        const res = await fetch(`/api/crm/captaciones/${id}/convertir?client_id=default-client`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: 'default-client' }),
        });
        if (!res.ok) throw new Error('No se pudo convertir');
        await loadCaptaciones();
        await loadProperties();
        pushToast('✓ Captación pasada a Propiedades');
        return true;
      } catch (err) {
        console.error('Error converting captación:', err);
        pushToast('Error al pasar a propiedad');
        return false;
      }
    };

    // Crear un lead manualmente desde el CRM
    const createLead = async (form) => {
      try {
        const res = await fetch('/api/crm/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: 'default-client',
            nombre: form.nombre,
            apellidos: form.apellidos || '',
            email: form.email,
            telefono: form.telefono || '',
            origin: form.origin || 'manual',
            source_property_id: form.source_property_id || null,
            notes: form.notes || '',
          }),
        });
        if (!res.ok) throw new Error('No se pudo crear el interesado');
        await loadLeads();
        pushToast('Interesado creado');
        return true;
      } catch (err) {
        console.error('Error creating lead:', err);
        pushToast('Error al crear el interesado');
        return false;
      }
    };

    // Editar un lead existente
    const updateLead = async (id, fields) => {
      try {
        const res = await fetch(`/api/crm/leads/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: 'default-client', ...fields }),
        });
        if (!res.ok) throw new Error('No se pudo actualizar');
        await loadLeads();
        pushToast('Interesado actualizado');
        return true;
      } catch (err) {
        console.error('Error updating lead:', err);
        pushToast('Error al actualizar el interesado');
        return false;
      }
    };

    // Eliminar (archivar) un lead y sus visitas
    const deleteLead = async (id) => {
      try {
        // Eliminar visitas asociadas
        const lv = visits.filter((v) => v.lead_id === id);
        for (const v of lv) await fetch(`/api/crm/visits/${v.id}?client_id=default-client`, { method: 'DELETE' });

        // Eliminar intereses asociados (evita registros huérfanos)
        const li = allIntereses.filter((i) => i.lead_id === id);
        for (const i of li) await fetch(`/api/crm/intereses/${i.id}?client_id=default-client`, { method: 'DELETE' });

        // Eliminar lead
        const res = await fetch(`/api/crm/leads/${id}?client_id=default-client`, { method: 'DELETE' });
        if (!res.ok) throw new Error('No se pudo eliminar');
        await loadLeads();
        await loadVisits();
        pushToast('Interesado eliminado');
        return true;
      } catch (err) {
        console.error('Error deleting lead:', err);
        pushToast('Error al eliminar el interesado');
        return false;
      }
    };

    // Comprobar sesión existente al cargar (cookie válida → entra directo)
    useEffect(() => {
      fetch('/api/auth/me')
        .then((r) => r.json())
        .then((d) => { if (d.authenticated) { setLogged(true); setUser({ nombre: d.nombre || '', email: d.email || '', role: d.role || 'agente' }); } })
        .catch(() => {});
    }, []);

    const logout = async () => {
      try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
      setLogged(false);
      setScreen('inicio');
    };

    useEffect(() => {
      if (logged) {
        loadProperties();
        loadLeads();
        loadVisits();
        loadCaptaciones();
      }
    }, [logged]);

    // Navegación desde una sugerencia de ZADI IA → Base de datos pre-filtrada.
    const goWithFilter = (action) => {
      setExtFilter(action || null);
      setScreen(action && action.screen ? action.screen : 'contactos');
    };
    const goTo = (s) => { setExtFilter(null); setScreen(s); };
    const goToScreen = (s) => { setScreen(s); }; // Navega sin resetear extFilter

    // ── Navegación contextualizada para recomendaciones ──
    // Cada recomendación abre exactamente el contexto donde se resuelve el problema
    const openPropertyDetail = (propertyId, activeTab = null, leadIds = []) => {
      // Find the property and store it so PropertiesScreen can open it directly
      const prop = properties.find(p => p.id === propertyId);
      if (prop) {
        setScreen('propiedades');
        setExtFilter({
          _propertyDetailContext: true,
          propertyId,
          activeTab,
          leadIds,
          _selectedProperty: prop, // Pass the property object directly
        });
      }
    };

    const openLeadsFiltered = (estado, leadIds = null) => {
      setExtFilter(leadIds ? { estado, leadIds } : { estado });
      setScreen('contactos');
    };

    const handleContextAction = (action) => {
      if (!action || !action._contextType) {
        // Fallback para acciones antiguas
        goWithFilter(action);
        return;
      }

      const type = action._contextType;
      if (type === 'propertyDetail') {
        openPropertyDetail(action.propertyId, action.activeTab, action.leadIds);
      } else if (type === 'leadsFiltered') {
        openLeadsFiltered(action.estado, action.leadIds);
      } else if (type === 'propertiesWithIssues') {
        // Mostrar propiedades con highlight en las que tienen problemas
        setExtFilter({
          _highlightPropertyIds: action.propertyIds,
          _showPropertySelector: true,
        });
        goToScreen('propiedades');
      } else if (type === 'compatibleProperties') {
        // Mostrar propiedades compatibles para enviar información
        setExtFilter({
          _highlightPropertyIds: action.propertyIds,
          _compatibleMode: true,
        });
        goToScreen('propiedades');
      } else if (type === 'calendar') {
        goTo('calendario');
      } else if (type === 'valoraciones') {
        goTo('valoraciones');
      } else if (type === 'properties') {
        goTo('propiedades');
      }
    };

    // apply tweaks → CSS vars
    useEffect(() => {
      const r = document.documentElement.style;
      r.setProperty('--font-ui', FONTS[t.font] || FONTS.Onest);
      const a = ACCENTS[t.accent] || ACCENTS['#2E75B6'];
      r.setProperty('--blue', t.accent);
      r.setProperty('--blue-700', a.d);
      r.setProperty('--blue-600', a.d);
      r.setProperty('--blue-50', a.l);
      r.setProperty('--blue-100', a.l2);
      r.setProperty('--st-nuevo', t.accent);
      r.setProperty('--sh-blue', `0 8px 24px ${t.accent}47`);
    }, [t.font, t.accent]);

    const newCount = leads.filter((l) => l.estado === 'nuevo').length;
    const valPending = valoraciones.filter((v) => v.estado === 'pendiente').length;
    const title = (NAV.find((n) => n.id === screen) || {}).title || '';

    // ── Analítica del Dashboard a partir de datos reales ──
    const dashboardAnalytics = (() => {
      const base = window.ZADI_DATA.analytics;
      // NUEVA ARQUITECTURA: Contar intereses, no leads
      const allIntereses = window.ZADI_DATA.intereses || [];
      const total = leads.length;
      const nuevos = allIntereses.filter((i) => i.estado === 'nuevo').length;
      const contactados = allIntereses.filter((i) => i.estado === 'contactado').length;
      const conVisita = allIntereses.filter((i) => i.estado === 'visita').length;
      const cerrados = allIntereses.filter((i) => i.estado === 'cerrado').length;
      const visitasProg = visits.filter((v) => v.status === 'programada').length;
      // Visitas programadas dentro de la semana en curso (lunes-domingo)
      const now = new Date();
      const lunes = new Date(now); const dow = (lunes.getDay() + 6) % 7;
      lunes.setDate(lunes.getDate() - dow); lunes.setHours(0, 0, 0, 0);
      const domingo = new Date(lunes); domingo.setDate(domingo.getDate() + 7);
      const visitasSemana = visits.filter((v) => {
        if (v.status !== 'programada') return false;
        const d = new Date(v.scheduled_for);
        return d >= lunes && d < domingo;
      }).length;
      const comisionPrevista = properties
        .filter((p) => p.estado === 'Disponible')
        .reduce((s, p) => s + Math.round((p.precio || 0) * (p.comision || 3) / 100), 0);

      const kpis = [
        { label: 'Nuevos sin contactar', value: nuevos, delta: 0, spark: [0, 0, 0, 0, 0, 0, nuevos], info: 'Interesados nuevos que todavía no has contactado.' },
        { label: 'Contactados', value: contactados, delta: 0, spark: [0, 0, 0, 0, 0, 0, contactados], info: 'Interesados con los que ya has hablado al menos una vez.' },
        { label: 'Visitas esta semana', value: visitasSemana, delta: 0, spark: [0, 0, 0, 0, 0, 0, visitasSemana], info: 'Visitas programadas entre el lunes y el domingo de esta semana.' },
        { label: 'Comisión prevista', value: window.fmtEurShort(comisionPrevista), delta: 0, spark: [0, 0, 0, 0, 0, 0, 1], info: 'Comisión estimada por las propiedades disponibles.' },
      ];

      // Resumen de leads por estado (gráfico tipo embudo)
      const funnel = [
        { label: 'Nuevos', value: nuevos, color: '#2E75B6' },
        { label: 'Contactados', value: contactados, color: '#F5A623' },
        { label: 'Con visita', value: conVisita, color: '#5cb338' },
        { label: 'Cerrados', value: cerrados, color: '#6b7785' },
      ];

      const bySource = {};
      leads.forEach((l) => { const k = l.origen || 'otro'; bySource[k] = (bySource[k] || 0) + 1; });
      const srcLabels = { web_form: 'Web · interés', captacion: 'Web · captación', manual: 'Alta manual', saved_search: 'Búsqueda guardada', agente_ia: 'Agente IA' };
      const srcColors = { web_form: '#2E75B6', captacion: '#F5A623', manual: '#7A5AE0', saved_search: '#0ea5a3', agente_ia: '#5cb338' };
      const sources = Object.entries(bySource).map(([k, v]) => ({ label: srcLabels[k] || k, value: total ? Math.round((v / total) * 100) : 0, color: srcColors[k] || '#94a3b8' }));

      // NUEVA ARQUITECTURA: Contar por intereses
      const nuevosIntereses = allIntereses.filter((i) => i.estado === 'nuevo');
      const contactadosSinVisita = allIntereses.filter((i) => i.estado === 'contactado' && !visits.some((v) => v.interes_id === i.id && v.status === 'programada'));
      const insights = [];
      if (nuevosIntereses.length > 0) {
        const firstLead = leads.find((l) => l.id === nuevosIntereses[0].lead_id);
        insights.push({ tag: 'Sin contactar', txt: `Tienes ${nuevosIntereses.length} interés${nuevosIntereses.length > 1 ? 'es' : ''} sin contactar.`, cta: 'Ver en Base de datos', action: { screen: 'contactos', estado: 'nuevo', leadId: firstLead?.id } });
      }
      if (contactadosSinVisita.length > 0) {
        const firstLead = leads.find((l) => l.id === contactadosSinVisita[0].lead_id);
        insights.push({ tag: 'Agenda una visita', txt: `${contactadosSinVisita.length} interés${contactadosSinVisita.length > 1 ? 'es' : ''} contactado${contactadosSinVisita.length > 1 ? 's' : ''} sin visita: agéndala.`, cta: 'Programar visita', action: { screen: 'contactos', estado: 'contactado', leadId: firstLead?.id } });
      }
      if (valPending > 0) insights.push({ tag: 'Captación', txt: `${valPending} captación${valPending > 1 ? 'es' : ''} pendiente${valPending > 1 ? 's' : ''} de valorar.`, cta: 'Ver captación', action: { screen: 'valoraciones' } });
      if (visitasProg > 0) insights.push({ tag: 'Agenda', txt: `${visitasProg} visita${visitasProg > 1 ? 's' : ''} programada${visitasProg > 1 ? 's' : ''} en total.`, cta: 'Ver calendario', action: { screen: 'calendario' } });
      if (insights.length === 0) insights.push({ tag: 'Todo al día', txt: 'No tienes tareas pendientes ahora mismo.' });

      // Zonas y tipos reales según las propiedades de la cartera
      const zonas = Array.from(new Set(properties.map((p) => p.ciudad || p.zona).filter(Boolean)));
      const tipos = Array.from(new Set(properties.map((p) => p.tipo).filter(Boolean)));

      // Operaciones cerradas: propiedades Vendidas y Alquiladas
      const propVendidas = properties.filter((p) => p.estado === 'Vendido');
      const propAlquiladas = properties.filter((p) => p.estado === 'Alquilado');
      const operacionesRaw = [
        ...propVendidas.map((p) => ({
          id: p.id,
          regimen: 'Venta',
          tipo: p.tipo || 'piso',
          zona: p.ciudad || p.zona || 'Tenerife',
          precio: p.precio_venta || 0,
          comision: Math.round((p.precio_venta || 0) * (p.comision || 3) / 100),
          dias: 0,
          created_at: p.updated_at || p.created_at,
        })),
        ...propAlquiladas.map((p) => ({
          id: p.id,
          regimen: 'Alquiler',
          tipo: p.tipo || 'piso',
          zona: p.ciudad || p.zona || 'Tenerife',
          precio: p.precio_alquiler || 0,
          comision: Math.round((p.precio_alquiler || 0) * (p.comision || 3) / 100),
          dias: 0,
          created_at: p.updated_at || p.created_at,
        })),
      ];

      return {
        ...base,
        kpis, funnel, sources, insights,
        captacionesPendientes: valPending,
        operaciones: {
          ...base.operaciones,
          zonas,
          tipos: tipos.length ? tipos : base.operaciones.tipos,
          raw: operacionesRaw,
        },
      };
    })();

    // ── Datos de la pantalla Inicio (resumen, oportunidades, actividad) ──
    const homeData = (() => {
      const now = new Date();
      const dayMs = 86400000;
      const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
      const endToday = new Date(startToday); endToday.setDate(endToday.getDate() + 1);
      const lunes = new Date(now); const dow = (lunes.getDay() + 6) % 7;
      lunes.setDate(lunes.getDate() - dow); lunes.setHours(0, 0, 0, 0);
      const domingo = new Date(lunes); domingo.setDate(domingo.getDate() + 7);

      // NUEVA ARQUITECTURA: acceder a intereses
      const allIntereses = window.ZADI_DATA.intereses || [];
      const progVisits = visits.filter((v) => v.status === 'programada');
      const visitasHoy = progVisits.filter((v) => { const d = new Date(v.scheduled_for); return d >= startToday && d < endToday; });
      const visitasSemana = progVisits.filter((v) => { const d = new Date(v.scheduled_for); return d >= lunes && d < domingo; });
      const captPend = valoraciones.filter((v) => v.estado === 'pendiente');
      const propsActivas = properties.filter((p) => p.estado === 'Disponible');

      // Contar "sin contactar" sincronizando con recomendaciones (intereses + captaciones pendientes)
      const interesadosSinContactar = allIntereses.filter((i) => i.estado === 'nuevo' && leads.some((l) => l.id === i.lead_id && l.origen !== 'captacion'));
      const captacionesSinContactar = allIntereses.filter((i) => i.estado === 'nuevo' && leads.some((l) => l.id === i.lead_id && l.origen === 'captacion'));
      const captacionesPendientesNoConvertidas = captPend.length;
      const nuevoIntereses = interesadosSinContactar.length + captacionesSinContactar.length + captacionesPendientesNoConvertidas;

      // Seguimientos olvidados: contactado/visita sin actividad > 5 días (más antiguos primero)
      const stale = leads
        .filter((l) => (l.estado === 'contactado' || l.estado === 'visita') && l.updated_at && (now - new Date(l.updated_at)) > 5 * dayMs)
        .sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
      // Nuevos interesados en las últimas 24 h
      const last24 = leads.filter((l) => l.created_at && (now - new Date(l.created_at)) < dayMs);

      // NUEVA ARQUITECTURA: Estadísticas de interés por propiedad (contar intereses, no leads)
      const propStats = properties.map((p) => {
        // Contar intereses para esta propiedad, excluyendo captaciones
        const interesesProp = allIntereses.filter((i) => {
          const lead = leads.find((l) => l.id === i.lead_id);
          return i.property_id === p.id && lead && lead.origen !== 'captacion';
        });
        const sinContactar = interesesProp.filter((i) => i.estado === 'nuevo');
        const vis = progVisits.filter((v) => v.property_id === p.id).length;
        const compat = window.compatibleLeads ? window.compatibleLeads(p, leads, properties) : [];
        return { p, interesados: interesesProp.length, sinContactar: sinContactar.length, vis, compat: compat.length };
      });
      // Seguimientos de visitas pasadas sin cerrar (más antiguas primero)
      const followUps = leads.map((l) => {
        if (l.estado === 'cerrado') return null;
        const past = visits.filter((v) => v.lead_id === l.id && v.status !== 'cancelada' && new Date(v.scheduled_for) < now);
        if (!past.length) return null;
        const last = past.sort((a, b) => new Date(b.scheduled_for) - new Date(a.scheduled_for))[0];
        const dias = Math.floor((now - new Date(last.scheduled_for)) / dayMs);
        return dias >= 3 ? { l, dias } : null;
      }).filter(Boolean).sort((a, b) => b.dias - a.dias);

      // Solo 2 KPIs principales simplificados
      const summary = [
        { label: 'Pendientes de contactar', value: nuevoIntereses, action: { screen: 'contactos', estado: 'nuevo' }, icon: 'phone' },
        { label: 'Visitas hoy', value: visitasHoy.length, action: { screen: 'calendario' }, icon: 'calendar' },
      ];

      // ── Recomendaciones "Qué hacer hoy" (Acción · Motivo · Beneficio · Botón) ──
      const recs = [];
      const plural = (n) => n === 1 ? '' : 's';

      // Sistema inteligente de recomendaciones dinámicas — máx 5
      // Mezcla recomendaciones específicas (una propiedad) con generales (múltiples propiedades)

      // 🔴 Interesados sin contactar (NUEVA ARQUITECTURA: contar por intereses)
      // Los valores ya están calculados arriba (interesadosSinContactar, captacionesSinContactar, captacionesPendientesNoConvertidas)
      const totalCaptaciones = captacionesSinContactar.length + captacionesPendientesNoConvertidas;
      const todosSinContactar = [...interesadosSinContactar, ...captacionesSinContactar];

      if (todosSinContactar.length > 0 || captacionesPendientesNoConvertidas > 0) {
        const totalSin = nuevoIntereses; // Usa el total ya calculado arriba
        // Extraer IDs únicos de leads sin contactar (combinando interesados + captaciones)
        const leadIdsSinContactar = Array.from(new Set([
          ...interesadosSinContactar.map(i => i.lead_id),
          ...captacionesSinContactar.map(i => i.lead_id)
        ]));
        recs.push({
          tipo: 'urgente', icon: 'phone', w: 100,  // Prioridad 1
          accion: `Tienes ${totalSin} sin contactar: ${interesadosSinContactar.length} interesado${plural(interesadosSinContactar.length)} en comprar o alquilar y ${totalCaptaciones} posible${plural(totalCaptaciones)} captación${totalCaptaciones === 1 ? '' : 'es'}`,
          motivo: `Todos necesitan contacto inmediato.`,
          cta: 'Ver', action: window.contextNavigation.leadsFiltered('nuevo', leadIdsSinContactar),
        });
      }

      // 🔵 Visitas programadas para hoy
      if (visitasHoy.length > 0) {
        recs.push({
          tipo: 'importante', icon: 'calendar', w: 95,  // Prioridad 2
          accion: `Tienes ${visitasHoy.length} visita${plural(visitasHoy.length)} hoy`,
          motivo: visitasHoy.slice(0, 3).map((v) => {
            // NUEVA ARQUITECTURA: buscar por interes_id si existe, si no por lead_id
            const interes = v.interes_id ? allIntereses.find((x) => x.id === v.interes_id) : null;
            const l = interes ? leads.find((x) => x.id === interes.lead_id) : leads.find((x) => x.id === v.lead_id);
            const h = new Date(v.scheduled_for).getHours();
            const m = new Date(v.scheduled_for).getMinutes();
            return `${l?.nombre || 'Interesado'} a las ${h}:${m < 10 ? '0' : ''}${m}`;
          }).join(' • '),
          cta: 'Ver agenda', action: { screen: 'calendario' },
        });
      }

      // Recomendaciones inteligentes por estado de interés (NUEVA ARQUITECTURA)
      // Validar que el lead exista en la BD (evitar intereses huérfanos)
      const enNegociacion = allIntereses.filter((i) => i.estado === 'negociacion' && leads.some((l) => l.id === i.lead_id));
      const enVisita = allIntereses.filter((i) => i.estado === 'visita' && leads.some((l) => l.id === i.lead_id));

      if (enNegociacion.length > 0) {
        recs.push({
          tipo: 'importante', icon: 'handshake', w: 82,  // Prioridad 3.5
          accion: `Tienes ${enNegociacion.length} contacto${plural(enNegociacion.length)} en negociación`,
          motivo: `Contactalos para cerrar la oferta.`,
          cta: 'Ver', action: { screen: 'contactos', estado: 'negociacion' },
        });
      } else if (enVisita.length > 0) {
        recs.push({
          tipo: 'seguimiento', icon: 'clock', w: 80,  // Prioridad 4
          accion: `Tienes ${enVisita.length} contacto${plural(enVisita.length)} en visita`,
          motivo: `Haz seguimiento para pasar a negociación.`,
          cta: 'Ver', action: { screen: 'contactos', estado: 'visita' },
        });
      } else if (followUps.length > 0) {
        recs.push({
          tipo: 'seguimiento', icon: 'clock', w: 80,  // Prioridad 4
          accion: `Tienes ${followUps.length} contacto${plural(followUps.length)} sin seguimiento`,
          motivo: `Realizaron una visita hace días sin cierre.`,
          cta: 'Ver', action: { screen: 'contactos' },
        });
      }

      // 🟢 Propiedades con interesados sin visita programada (general)
      const propsVisitasPendientes = propStats.filter((s) => s.interesados >= 2 && s.vis === 0);
      if (propsVisitasPendientes.length > 0) {
        // Pasar todas las propiedades con problemas para que usuario pueda clicar en cada una
        const propIdsWithIssues = propsVisitasPendientes.map(p => p.p.id);
        recs.push({
          tipo: 'importante', icon: 'calendar', w: 90,  // Prioridad 3
          accion: `Programa visitas: ${propsVisitasPendientes.length} propiedade${plural(propsVisitasPendientes.length)} con oportunidades`,
          motivo: propsVisitasPendientes.slice(0, 3).map((p) => `${p.p.titulo}`).join(' • '),
          cta: 'Ver propiedades',
          action: {
            _contextType: 'propertiesWithIssues',
            propertyIds: propIdsWithIssues,
            screen: 'propiedades'
          },
        });
      }

      // Clientes compatibles - SIEMPRE mostrar (recomendación más importante)
      const propsConCompat = propStats.filter((s) => s.compat > 0);
      if (propsConCompat.length > 0) {
        const totalCompat = propsConCompat.reduce((s, p) => s + p.compat, 0);
        const compatPropIds = propsConCompat.map(p => p.p.id);
        recs.push({
          tipo: 'compatibles', icon: 'send', w: 70,  // Prioridad 5
          accion: `${totalCompat} cliente${plural(totalCompat)} compatible${plural(totalCompat)} sin contactar`,
          motivo: propsConCompat.slice(0, 3).map((p) => `${p.p.titulo}`).join(' • '),
          cta: 'Enviar',
          action: {
            _contextType: 'compatibleProperties',
            propertyIds: compatPropIds,
            screen: 'propiedades'
          },
        });
      }

      // 🏠 Nuevas captaciones pendientes
      if (captPend.length > 0) {
        recs.push({
          tipo: 'importante', icon: 'tag', w: 65,
          accion: `${captPend.length} nueva captación${plural(captPend.length)} pendiente${plural(captPend.length)}`,
          motivo: `Propiedad${plural(captPend.length)} para valorar.`,
          cta: 'Ver', action: { screen: 'valoraciones' },
        });
      }

      // Ordenar por prioridad y tomar máx 5
      recs.sort((a, b) => b.w - a.w);
      const recommendations = recs.slice(0, 5);

      const activity = [];
      leads.forEach((l) => {
        if (l.created_at) activity.push({ icon: 'contacts', txt: `${l.nombre} solicitó información`, ts: l.created_at, action: { screen: 'contactos', leadId: l.id } });
        if (l.updated_at && l.updated_at !== l.created_at && l.estado !== 'nuevo') {
          const SL = { contactado: 'fue contactado', visita: 'tiene visita programada', negociacion: 'pasó a negociación', cerrado: 'cerró operación', perdido: 'se descartó' };
          activity.push({ icon: l.estado === 'cerrado' ? 'check' : 'contacts', txt: `${l.nombre} ${SL[l.estado] || 'se actualizó'}`, ts: l.updated_at, action: { screen: 'contactos', leadId: l.id } });
        }
      });
      visits.forEach((v) => { if (v.created_at) { const lead = leads.find((l) => l.id === v.lead_id); if (lead) activity.push({ icon: 'calendar', txt: `Visita programada con ${lead.nombre}`, ts: v.created_at, action: { screen: 'calendario' } }); } });
      activity.sort((a, b) => new Date(b.ts) - new Date(a.ts));

      return { summary, recommendations, activity: activity.slice(0, 8) };
    })();

    // ── Notificaciones derivadas de datos reales ──
    const notifications = (() => {
      const list = [];
      leads.filter((l) => l.estado === 'nuevo').slice(0, 6).forEach((l) => {
        list.push({ icon: 'inbox', txt: `Nuevo interesado: ${l.nombre}`, fecha: l.fecha || 'Reciente', screen: 'contactos' });
      });
      valoraciones.filter((v) => v.estado === 'pendiente').slice(0, 4).forEach((v) => {
        list.push({ icon: 'tag', txt: `Captación pendiente: ${v.propietario}`, fecha: v.fecha || 'Reciente', screen: 'valoraciones' });
      });
      visits.filter((v) => v.status === 'programada').slice(0, 4).forEach((v) => {
        const lead = leads.find((l) => l.id === v.lead_id);
        list.push({ icon: 'calendar', txt: `Visita programada${lead ? ' · ' + lead.nombre : ''}`, fecha: new Date(v.scheduled_for).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), screen: 'calendario' });
      });
      return list;
    })();

    const panel = (
      <TweaksPanel>
        <TweakSection label="Tipografía" />
        <TweakRadio label="Fuente" value={t.font} options={['Onest', 'Hanken', 'Sistema']} onChange={(v) => setTweak('font', v)} />
        <TweakSection label="Color de marca" />
        <TweakColor label="Acento" value={t.accent} options={['#2E75B6', '#7A5AE0', '#0ea5a3']} onChange={(v) => setTweak('accent', v)} />
        <TweakSection label="Estilo" />
        <TweakToggle label="Navegación sólida" value={t.sidebarSolid} onChange={(v) => setTweak('sidebarSolid', v)} />
        <TweakToggle label="Tarjetas con elevación" value={t.cardElevation} onChange={(v) => setTweak('cardElevation', v)} />
      </TweaksPanel>
    );

    if (!logged) {
      return (<>
        <LoginScreen onLogin={() => setLogged(true)} />
        {panel}
      </>);
    }

    return (
      <div className={`app${t.sidebarSolid ? ' nav-solid' : ''}${t.cardElevation ? '' : ' flat'}`}>
        <Sidebar screen={screen} setScreen={goTo} collapsed={collapsed} setCollapsed={setCollapsed} newCount={newCount} valPending={valPending} user={user} mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
        <div className="main">
          <Topbar title={title} notifications={notifications} onLogout={logout} onGo={goTo} user={user} onMenuClick={() => setMobileNavOpen((v) => !v)} />
          <div className="content">
            {screen === 'inicio' && <HomeScreen homeData={homeData} onGo={goTo} onAction={handleContextAction} user={user} />}
            {screen === 'contactos' && <ContactsScreen leads={leads} setLeads={setLeads} visits={visits} properties={properties} extFilter={extFilter} clearExtFilter={() => setExtFilter(null)} onCreateLead={createLead} onUpdateLead={updateLead} onDeleteLead={deleteLead} onSaveVisit={saveVisit} onDeleteVisit={deleteVisit} />}
            {screen === 'propiedades' && <PropertiesScreen properties={properties} leads={leads} visits={visits} toast={pushToast} onRefresh={loadProperties} onOpenLead={(leadId) => goWithFilter({ screen: 'contactos', leadId })} extFilter={extFilter} />}
            {screen === 'calendario' && <CalendarScreen visits={visits} leads={leads} properties={properties} onCreateVisit={createVisit} onMoveVisit={moveVisit} onDeleteVisit={deleteVisit} onSaveVisit={saveVisit} toast={pushToast} />}
            {screen === 'valoraciones' && <ValoracionesScreen valoraciones={valoraciones} setValoraciones={setValoraciones} toast={pushToast} onCreate={createCaptacion} onUpdate={updateCaptacion} onDelete={deleteCaptacion} onConvert={convertCaptacion} extFilter={extFilter} />}
            {screen === 'dashboard' && <DashboardScreen analytics={dashboardAnalytics} properties={properties} onAction={goWithFilter} />}
            {screen === 'notificaciones' && <NotificationsScreen notifications={notifications} toast={pushToast} />}
            {screen === 'uikit' && <UIKitScreen />}
          </div>
        </div>
        {toastNode}
        {panel}
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);

  // Enable entrance animations only when the tab is actually visible, so content
  // is never stuck at opacity:0 in a hidden/backgrounded tab.
  function enableAnims() { if (!document.hidden) document.body.classList.add('anims'); }
  enableAnims();
  document.addEventListener('visibilitychange', enableAnims);
})();
