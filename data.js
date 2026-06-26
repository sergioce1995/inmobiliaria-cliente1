// data.js — Estructuras base del CRM. SIN datos fake.
// Los leads y propiedades reales se cargan desde la API en tiempo de ejecución.
(function () {
  const property_ref = {};

  const leads = [];
  const contacts = [];
  const properties = [];
  const valoraciones = [];

  // Estados del lead — definición clara de cada etapa del embudo.
  const statusInfo = {
    nuevo:       { label: 'Nuevo',       desc: 'Lead recién llegado, todavía sin contactar.' },
    contactado:  { label: 'Contactado',  desc: 'Ya has hablado con el lead al menos una vez.' },
    visita:      { label: 'Visita',      desc: 'Tiene una visita programada o ya realizada.' },
    negociacion: { label: 'Negociación', desc: 'Existe una oferta, reserva o conversaciones avanzadas.' },
    cerrado:     { label: 'Cerrado',     desc: 'Operación finalizada correctamente.' },
    perdido:     { label: 'Perdido',     desc: 'El cliente deja de ser una oportunidad real.' },
  };

  const valStatus = {
    pendiente:  { label: 'Pendiente',  cls: 'nuevo',      desc: 'Solicitud nueva sin revisar.' },
    valorada:   { label: 'Valorada',   cls: 'contactado', desc: 'Valoración enviada al propietario.' },
    captada:    { label: 'Captada',    cls: 'interesado', desc: 'El propietario acepta: ya es propiedad vuestra.' },
    descartada: { label: 'Descartada', cls: 'cerrado',    desc: 'Solicitud descartada (no encaja o no interesa).' },
  };
  const valTipos = ['Piso', 'Ático', 'Casa / Chalet', 'Villa', 'Local', 'Garaje', 'Terreno'];

  const analytics = {
    kpis: [
      { label: 'Nuevos hoy', value: 0, delta: 0, spark: [0,0,0,0,0,0,0],
        info: 'Leads que han entrado hoy y todavía no has contactado.' },
      { label: 'Contactados', value: 0, delta: 0, spark: [0,0,0,0,0,0,0],
        info: 'Leads con los que ya has tenido al menos un contacto este mes.' },
      { label: 'Tasa conversión', value: '0%', delta: 0, spark: [0,0,0,0,0,0,0],
        info: 'De cada 100 leads que entran, cuántos acaban en operación cerrada.' },
      { label: 'Comisión prevista', value: '0 €', delta: 0, spark: [0,0,0,0,0,0,0],
        info: 'Comisión estimada por propiedades activas.' },
    ],
    funnel: [
      { label: 'Leads recibidos', value: 0, color: '#2E75B6' },
      { label: 'Contactados', value: 0, color: '#4f8fc7' },
      { label: 'Interesados', value: 0, color: '#F5A623' },
      { label: 'Visitas', value: 0, color: '#e89515' },
      { label: 'Cerrados', value: 0, color: '#5cb338' },
    ],
    sources: [],
    trend: [0,0,0,0,0,0,0,0,0,0,0,0],
    insights: [],
    operaciones: {
      meses: ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      tipoColor: { 'Piso': '#2E75B6', 'Casa / Chalet': '#5cb338', 'Ático': '#F5A623', 'Local': '#7A5AE0', 'Terreno': '#e5544b' },
      zonaColor: { 'Barcelona': '#2E75B6', 'Madrid': '#F5A623', 'Marbella': '#5cb338', 'Valencia': '#7A5AE0' },
      regimenColor: { 'Venta': '#2E75B6', 'Alquiler': '#0ea5a3' },
      tipos: ['Piso', 'Casa / Chalet', 'Ático', 'Local', 'Terreno'],
      zonas: ['Barcelona', 'Madrid', 'Marbella', 'Valencia'],
      raw: [],
    },
  };

  const notifications = [];

  window.ZADI_DATA = { leads, contacts, properties, analytics, notifications, property_ref, statusInfo, valoraciones, valStatus, valTipos };

  // ── Perfil de comprador inferido y compatibilidad (ESTIMACIÓN) ──────────────
  // No pedimos datos nuevos: deducimos el perfil de un lead a partir de las
  // propiedades que YA le interesan. Solo aplica a leads con ≥1 interés previo.
  // Preparado para afinar (p. ej. si en el futuro capturamos presupuesto/zona reales).
  function inferProfile(lead, properties) {
    if (!lead || !Array.isArray(lead.propiedades) || lead.propiedades.length === 0) return null;
    const byId = {}; (properties || []).forEach((p) => { byId[p.id] = p; });
    const props = lead.propiedades.map((id) => byId[id]).filter(Boolean);
    if (props.length === 0) return null;
    const precios = props.map((p) => p.precio || 0).filter((n) => n > 0);
    const habs = props.map((p) => p.hab || 0);
    const ciudades = new Set(props.map((p) => (p.ciudad || p.zona || '').toLowerCase()).filter(Boolean));
    return {
      precioMin: precios.length ? Math.min(...precios) : 0,
      precioMax: precios.length ? Math.max(...precios) : 0,
      habMin: Math.min(...habs),
      habMax: Math.max(...habs),
      ciudades,
      n: props.length,
    };
  }

  // ¿La propiedad encaja con el perfil? precio ±15 %, ciudad coincidente, habitaciones ±1.
  function profileMatches(profile, p) {
    if (!profile || !p) return false;
    const price = p.precio || 0;
    if (profile.precioMax > 0 && price > 0) {
      if (price < profile.precioMin * 0.85 || price > profile.precioMax * 1.15) return false;
    }
    if (profile.ciudades.size > 0) {
      const c = (p.ciudad || p.zona || '').toLowerCase();
      if (c && !profile.ciudades.has(c)) return false;
    }
    const hab = p.hab || 0;
    if (hab < profile.habMin - 1 || hab > profile.habMax + 1) return false;
    return true;
  }

  // Clientes COMPATIBLES de la base de datos que NO conocen esta propiedad (estimación).
  // Excluye a quienes ya están interesados y a los propietarios (captación).
  function compatibleLeads(property, leads, properties) {
    if (!property) return [];
    return (leads || []).filter((l) => {
      if (Array.isArray(l.propiedades) && l.propiedades.includes(property.id)) return false;
      if (l.origen === 'captacion') return false;
      return profileMatches(inferProfile(l, properties), property);
    });
  }

  // Calidad / nivel de interés del lead. Preparado para afinar con más señales.
  function leadScore(lead, visits) {
    if (!lead) return { level: 'bajo' };
    if (lead.estado === 'cerrado') return { level: 'bajo' };
    const tieneVisita = (visits || []).some((v) => v.lead_id === lead.id && v.status !== 'cancelada');
    if (lead.estado === 'visita' || tieneVisita) return { level: 'alto' };
    const nProps = Array.isArray(lead.propiedades) ? lead.propiedades.length : 0;
    if (lead.estado === 'contactado' || nProps > 1) return { level: 'medio' };
    return { level: 'bajo' };
  }

  window.inferProfile = inferProfile;
  window.compatibleLeads = compatibleLeads;
  window.leadScore = leadScore;
  window.LEAD_QUALITY = {
    alto: { label: 'Interés alto', color: '#5cb338' },
    medio: { label: 'Interés medio', color: '#F5A623' },
    bajo: { label: 'Interés bajo', color: '#b6bfc9' },
  };
  window.fmtEur = (n) => {
    if (typeof n !== 'number') return n;
    return n.toLocaleString('es-ES') + ' €';
  };
  window.fmtEurShort = (n) => {
    if (n >= 1000000) return (n / 1000000).toLocaleString('es-ES', { maximumFractionDigits: 2 }) + ' M€';
    if (n >= 1000) return Math.round(n / 1000) + 'k €';
    return n + ' €';
  };
})();
