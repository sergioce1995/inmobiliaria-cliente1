# 🎯 Sistema de Navegación Contextualizada - Implementación Local

**Fecha:** 2026-07-03  
**Estado:** ✅ Funcional en Local  
**Versión:** 1.0

---

## Resumen Ejecutivo

Se ha implementado un sistema de navegación contextualizado para las recomendaciones del CRM. **Cada recomendación abre exactamente el contexto donde el usuario puede resolver el problema**, sin necesidad de búsquedas adicionales o navegación multi-paso.

---

## ✅ Lo que está Implementado

### 1. **Sistema de Contexto (`context-navigation.js`)**

Nueva capa de abstracción que define tipos de navegación contextualizados:

```javascript
// Ejemplo: Abrir propiedad con tab específico
window.contextNavigation.propertyDetail(propertyId, 'sinContactar', [leadIds])

// Ejemplo: Filtrar leads por estado
window.contextNavigation.leadsFiltered('nuevo', [leadIds])
```

**Tipos disponibles:**
- `PROPERTY_DETAIL` - Abre ficha de propiedad con tab específico
- `LEADS_FILTERED` - Filtra Base de datos a leads específicos
- `LEADS_BY_STATE` - Filtra por estado de interés
- `CALENDAR` - Abre calendario
- `VALORACIONES` - Abre captaciones

### 2. **Handlers Contextualizados en `app-crm.jsx`**

```javascript
const openPropertyDetail(propertyId, activeTab, leadIds)
const openLeadsFiltered(estado, leadIds)
const handleContextAction(action) // Enrutador principal
```

**Flujo:** HomeScreen → `onAction(handleContextAction)` → Router → Pantalla destino

### 3. **Mejoras en `screen_contacts.jsx`**

✅ Aceptar `leadIds` en `extFilter` para filtrar a leads específicos:

```javascript
const extLeadIds = extFilter?.leadIds; // Array de IDs a mostrar
const inLeadIds = !extLeadIds || extLeadIds.includes(c.id);
// Filtra la tabla a solo esos leads
```

**Resultado:** Cuando se hace clic en "Sin contactar", muestra solo los 6 leads sin contactar.

### 4. **Mejoras en `screen_properties.jsx`**

✅ Aceptar `initialTab` para abrir sección específica:

```javascript
function PropertyDetail({ initialTab = null }) {
  const [expandedSection, setExpandedSection] = useState(initialTab || null);
  // El tab se abre automáticamente
}
```

✅ Soporte para abrir propiedad desde contexto:

```javascript
if (extFilter?._propertyDetailContext && extFilter._selectedProperty) {
  setSelectedProperty(extFilter._selectedProperty); // Abre automáticamente
}
```

### 5. **Auto-Add de Propiedades en Visitas (`app-crm.jsx`)**

Cuando se crea una visita con propiedad seleccionada, se auto-añade al lead:

```javascript
const createVisit = async ({ lead_id, property_id, ... }) => {
  // ... crear visita ...
  
  if (lead && property_id) {
    const currentProps = JSON.parse(lead.interes_propiedades);
    const propIds = currentProps.map(p => p.id);
    if (!propIds.includes(property_id)) {
      const updated = [...currentProps, { id: property_id }];
      // PATCH para guardar
    }
  }
}
```

---

## 🧪 Pruebas Realizadas

### Test 1: Recomendación "Sin contactar"
```
✅ Clic en "Ver"
✅ Abre Base de datos
✅ Muestra "6 de 16 contactos"
✅ Filtro "Nuevo" está activo
✅ Solo los 6 leads sin contactar se muestran
```

### Test 2: Recomendación "Programa visitas"
```
✅ Clic en "Ver propiedades"
✅ Abre pantalla de Propiedades
✅ Encuentra la propiedad automáticamente
✅ Abre la ficha "Piso La Salle"
✅ Tab "sinContactar" se expande automáticamente
✅ Muestra "Pendientes de contactar (0)"
```

### Test 3: Auto-add de propiedades
```
⏳ Requiere prueba manual:
   1. Ir a Calendario
   2. Crear nueva visita
   3. Seleccionar lead + propiedad
   4. Verificar que propiedad aparece en ficha del lead
```

---

## 📐 Arquitectura

```
Inicio (HomeScreen)
    ↓
  Recomendación con action = {
    _contextType: 'propertyDetail',
    propertyId: 'x',
    activeTab: 'sinContactar',
    leadIds: [...]
  }
    ↓
handleContextAction() interpreta el tipo
    ↓
openPropertyDetail(id, tab, leadIds)
    ↓
setExtFilter({ _propertyDetailContext: true, ... })
setScreen('propiedades')
    ↓
PropertiesScreen detecta extFilter._selectedProperty
    ↓
Abre PropertyDetail con initialTab='sinContactar'
    ↓
Component monta con useState(initialTab || null)
    ↓
expandedSection inicia en 'sinContactar' ✅
```

---

## 🔄 Próximas Mejoras (No Urgentes)

1. **Modal "Compatibles"**
   - Mostrar todas las propiedades con sus compatibles
   - Clickear propiedad → Abre su ficha

2. **Modal "Propiedades sin actividad"**
   - Filtrar propiedades sin interacción > 25 días
   - Listar con estado y últimas acciones

3. **Modal "Visitas pendientes de seguimiento"**
   - Leads que visitaron pero sin cierre
   - Botón directo para seguimiento

4. **Refactorizar más recomendaciones**
   - "Clientes compatibles" → Abrir con tab compatibles
   - "Nuevas captaciones" → Abrir Captación filtrada

---

## 📝 Cambios en Archivos

### `context-navigation.js` (NUEVO)
- Helpers para crear acciones contextualizadas
- Tipos de contexto pre-definidos
- Documentación de uso

### `app-crm.jsx`
- Línea ~600: Nuevos handlers (`openPropertyDetail`, `openLeadsFiltered`, `handleContextAction`)
- Línea ~600: Pasar `handleContextAction` a HomeScreen en lugar de `goWithFilter`
- Línea ~248: Auto-add de propiedades en `createVisit`
- Línea ~888: Refactorizar recomendación "Programa visitas" para usar contexto

### `screen_contacts.jsx`
- Línea ~93: Extraer `extLeadIds` de extFilter
- Línea ~124: Filtro `inLeadIds` en lógica de filas
- Resultado: Soporte para filtrar a leads específicos

### `screen_properties.jsx`
- Línea ~8: Añadir parámetro `initialTab` a PropertyDetail
- Línea ~9: useState usa `initialTab` como valor inicial
- Línea ~680-684: useEffect detecta y abre propiedad desde contexto
- Línea ~792: Pasar `initialTab` a PropertyDetail

### `crm.html`
- Línea ~23: Cargar `context-navigation.js` antes de app-crm.jsx

---

## 🚀 Próximos Pasos

1. **Testing adicional:**
   - [ ] Crear visita en calendario → Verificar auto-add en lead
   - [ ] Verificar que todos los filtros funcionan correctamente
   - [ ] Prueba en diferentes navegadores

2. **Si todo funciona correctamente en local:**
   - [ ] Usuario aprueba cambios
   - [ ] Pasar a producción
   - [ ] Documentar en CHANGELOG

3. **Optimizaciones futuras:**
   - Precarga de contexto para mejor UX
   - Historial de navegación (back button inteligente)
   - Transiciones animadas entre contextos

---

## ⚙️ Configuración Actual

- **Base de datos:** `pg.db` (local, separada de prod)
- **Branch:** `main` (cambios locales, no pusheado)
- **Servidor:** Ejecutándose en http://localhost:8000
- **Estado:** ✅ Funcional, listo para testing extenso

---

**Nota:** Este archivo documenta la versión LOCAL del sistema. Los cambios NO han sido pusheados a GitHub/producción hasta que el usuario apruebe después de testing completo.

*Última actualización: 2026-07-03*
