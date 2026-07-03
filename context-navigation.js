// context-navigation.js
// Sistema de navegación contextualizada para recomendaciones
// Cada recomendación abre exactamente el contexto donde el usuario puede resolver el problema

window.contextNavigation = {
  // Tipos de contexto que una recomendación puede abrir
  CONTEXT_TYPES: {
    // Abrir una propiedad específica con un tab activo
    PROPERTY_DETAIL: 'propertyDetail',
    // Abrir Base de datos filtrada a leads específicos
    LEADS_FILTERED: 'leadsFiltered',
    // Abrir Base de datos filtrada por estado
    LEADS_BY_STATE: 'leadsByState',
    // Abrir pantalla de propiedades
    PROPERTIES: 'properties',
    // Abrir calendario
    CALENDAR: 'calendar',
    // Abrir valoraciones
    VALORACIONES: 'valoraciones',
  },

  // Helper para crear acciones de recomendación contextualizadas
  createAction: (type, payload) => {
    return { _contextType: type, ...payload };
  },

  // Property detail con tab específico
  propertyDetail: (propertyId, activeTab = null, leadIds = []) => {
    return {
      _contextType: 'propertyDetail',
      propertyId,
      activeTab, // 'sinContactar', 'contactadosSinVisita', 'conVisita', 'compatibles'
      leadIds, // IDs de leads a pre-filtrar en ese tab
    };
  },

  // Leads filtrados por estado
  leadsFiltered: (estado, leadIds = null) => {
    return {
      _contextType: 'leadsFiltered',
      estado,
      leadIds, // Si se proporciona, filtrar a esos IDs específicamente
    };
  },

  // Leads sin contactar de una propiedad específica
  propertyLeadsToContact: (propertyId, sinContactarLeadIds) => {
    return {
      _contextType: 'propertyDetail',
      propertyId,
      activeTab: 'sinContactar',
      leadIds: sinContactarLeadIds,
    };
  },

  // Compatibles de una propiedad
  propertyCompatibles: (propertyId) => {
    return {
      _contextType: 'propertyDetail',
      propertyId,
      activeTab: 'compatibles',
    };
  },

  // Agendar visitas - abrir calendario
  scheduleVisits: () => {
    return { _contextType: 'calendar' };
  },

  // Ver nuevas captaciones
  newCaptaciones: () => {
    return { _contextType: 'valoraciones' };
  },
};

window.handleContextNavigation = (context, handlers) => {
  if (!context || !context._contextType) return;

  const type = context._contextType;

  if (type === 'propertyDetail') {
    handlers.openPropertyDetail?.(context.propertyId, context.activeTab, context.leadIds);
  } else if (type === 'leadsFiltered') {
    handlers.openLeadsFiltered?.(context.estado, context.leadIds);
  } else if (type === 'calendar') {
    handlers.openCalendar?.();
  } else if (type === 'valoraciones') {
    handlers.openValoraciones?.();
  } else if (type === 'properties') {
    handlers.openProperties?.();
  }
};
