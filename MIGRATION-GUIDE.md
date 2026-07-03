# Guía de Migración: Arquitectura Lead/Interest v1.0
## De desarrollo local a producción con preservación de datos

---

## 📋 Resumen Ejecutivo

Este documento describe el proceso completo para desplegar la nueva arquitectura **Lead/Interest** en producción, **sin perder ningún dato existente** del cliente.

### ✅ Lo que se preserva:
- ✅ Todos los leads/contactos existentes
- ✅ Todas las propiedades
- ✅ Todas las relaciones lead-propiedad (convertidas a intereses)
- ✅ Todas las captaciones (convertidas a leads + intereses)
- ✅ Histórico de visitas y actividades

### 🎯 Lo que cambia:
- Nueva tabla `intereses` (relaciones Lead↔Property con estado independiente)
- Nueva tabla `leads` (estructura optimizada, única por email)
- Nuevos estados de interés: nuevo, contactado, visita, negociación, cerrado, perdido
- Dashboard sincronizado: BD cuenta LEADS, Análisis cuenta INTERESES
- Cambios de estado persistentes en tiempo real

---

## 🔧 Arquitectura Nueva vs Antigua

### Antigua (pre-migración):
```
contacts/leads (tabla única)
├─ id, name, email, phone, status
└─ properties (JSON string)

lead_properties (tabla intermedia)
├─ lead_id
├─ property_id
└─ (sin estados individuales)
```

### Nueva (post-migración):
```
leads (personas)
├─ id, nombre, apellidos, email, telefono, status
├─ origin (Web, captacion, etc)
└─ created_at, updated_at

intereses (relaciones Lead↔Property)
├─ id
├─ lead_id → links a leads
├─ property_id → links a properties
├─ estado (nuevo, contactado, visita, negociación, cerrado, perdido)
└─ created_at, updated_at
```

---

## 📦 Contenido del Commit

### Archivos modificados en `main` (commit d48dc4f):
- `app-crm.jsx` — Carga de intereses, recomendaciones mejoradas
- `lead_detail.jsx` — Lectura/edición con estados de interés
- `screen_contacts.jsx` — Contadores LEADS, sin Estado duplicada
- `screen_dashboard.jsx` — KPIs y embudo sincronizados
- `server.js` — PATCH endpoint para cambios de estado

### Archivo nuevo (migración):
- `migrate-to-lead-interest-architecture.js` — Script de migración seguro

---

## 🚀 Procedimiento de Despliegue

### **FASE 1: PREPARACIÓN (sin cambios)**

#### 1.1 Backup en producción
```bash
# En el servidor de producción
cd /path/to/crm
cp pg.db pg.db.backup-$(date +%Y%m%d-%H%M%S)
```

#### 1.2 Verificar estado actual
```bash
# Revisar leads/contactos existentes
sqlite3 pg.db "SELECT COUNT(*) as total_leads FROM contacts;"
sqlite3 pg.db "SELECT COUNT(*) as total_props FROM lead_properties;"
```

---

### **FASE 2: CÓDIGO (pull + test)**

#### 2.1 Pull del código nuevo (commit d48dc4f)
```bash
cd /path/to/crm
git pull origin main
# O si es nuevo: git clone <repo>
```

#### 2.2 Test en staging (opcional pero RECOMENDADO)
```bash
# Copiar pg.db.backup a un directorio de test
cp pg.db.backup pg.db.staging

# Ejecutar migración en dry-run
node migrate-to-lead-interest-architecture.js --db=pg.db.staging --dry-run

# Si todo OK, ejecutar migración real
node migrate-to-lead-interest-architecture.js --db=pg.db.staging

# Verificar resultado
sqlite3 pg.db.staging "SELECT COUNT(*) FROM leads; SELECT COUNT(*) FROM intereses;"
```

---

### **FASE 3: MIGRACIÓN (datos existentes)**

#### 3.1 Ejecutar script de migración en producción
```bash
cd /path/to/crm

# DRY-RUN: ver qué haría sin aplicar cambios
node migrate-to-lead-interest-architecture.js --db=pg.db --dry-run

# REAL: aplicar migración (después de revisar dry-run)
node migrate-to-lead-interest-architecture.js --db=pg.db
```

**El script hace automáticamente:**
- ✅ Crear backup (pg.db.backup-TIMESTAMP)
- ✅ Crear tablas nuevas (leads, intereses)
- ✅ Migrar leads/contactos de tabla antigua
- ✅ Crear intereses desde relaciones antiguas
- ✅ Convertir captaciones a leads + intereses
- ✅ Deduplicar por email
- ✅ Validar integridad referencial

#### 3.2 Verificar migración
```bash
# Contar datos después de migración
sqlite3 pg.db "SELECT COUNT(*) FROM leads;"      # debe = leads antiguos
sqlite3 pg.db "SELECT COUNT(*) FROM intereses;"  # debe >= relaciones antiguas
sqlite3 pg.db "SELECT COUNT(*) FROM properties;" # debe = propiedades antiguas

# Buscar inconsistencias
sqlite3 pg.db "SELECT COUNT(*) FROM intereses WHERE lead_id NOT IN (SELECT id FROM leads);"
# Debe devolver: 0 (si hay más que 0, hay orfandades)
```

---

### **FASE 4: VALIDACIÓN (funcionalidad)**

#### 4.1 Iniciar servidor
```bash
npm start  # o node server.js
```

#### 4.2 Validar en navegador

**Base de datos (contactos):**
- [ ] Se ven todos los leads antiguos
- [ ] Contadores están correctos (Nuevo 6, Contactado 4, etc.)
- [ ] Cada lead aparece UNA SOLA VEZ (deduplicación)
- [ ] Al abrir un lead, ve sus propiedades con estados individuales
- [ ] Puede cambiar estado de una propiedad sin editar el lead

**Análisis:**
- [ ] Embudo "Estado de los interesados" muestra números diferentes de BD
- [ ] Nuevo 7 (no 6) — son INTERESES, no leads
- [ ] La diferencia es correcta (algunos leads → múltiples propiedades)

**Recomendaciones (Inicio):**
- [ ] "Tienes 8 sin contactar: 7 interesados en comprar o alquilar y 1 posible captación"
- [ ] Dice "comprar o alquilar" (no "propiedad")
- [ ] Incluye captaciones pendientes

**Propiedades:**
- [ ] Todas las propiedades antiguas visible
- [ ] Interesados reflejan migraciones correctas

#### 4.3 Pruebas funcionales

```javascript
// En consola del navegador
window.ZADI_DATA.leads.length      // debe > 0
window.ZADI_DATA.intereses.length  // debe > leads
```

---

### **FASE 5: ROLLBACK (si es necesario)**

Si algo sale mal:

```bash
cd /path/to/crm

# 1. Detener servidor
kill $(lsof -t -i :8000)

# 2. Restaurar backup
cp pg.db.backup-<TIMESTAMP> pg.db

# 3. Revertir código
git reset --hard <commit-anterior>  # o git revert d48dc4f

# 4. Reiniciar
npm start
```

---

## ⚠️ Puntos Críticos

### Antes de la migración:
1. **BACKUP OBLIGATORIO** — No tocar sin backup
2. **DRY-RUN OBLIGATORIO** — Ver qué hará antes de ejecutar
3. **VALIDAR EN STAGING** — Si es posible, test en clon de BD
4. **COMUNICAR AL CLIENTE** — El CRM estará en mantenimiento 10-15 min

### Durante la migración:
1. **NO TOCAR LA BD** — El script es el único que debe escribir
2. **NO INTERRUMPIR** — Dejar que termine completamente
3. **MONITOREAR** — Ver salida del script para errores

### Después de la migración:
1. **VALIDAR TODOS LOS NÚMEROS** — Leads, intereses, propiedades
2. **PROBAR FUNCIONALIDAD** — BD, Análisis, Recomendaciones
3. **REVISAR LOGS** — Buscar advertencias de integridad

---

## 📊 Checklist de Despliegue

```
PREPARACIÓN:
[ ] Backup de pg.db en producción
[ ] Verificar conteo actual: leads, propiedades, relaciones
[ ] Comunicar downtime al cliente

MIGRACIÓN:
[ ] Pull de commit d48dc4f
[ ] Test con --dry-run
[ ] Ejecutar migración real
[ ] Verificar integridad (no orfandades)

VALIDACIÓN:
[ ] Contar datos post-migración
[ ] Iniciar servidor sin errores
[ ] BD: todos los leads visibles, deduplicados
[ ] Análisis: números de intereses correctos
[ ] Recomendaciones: incluyen captaciones
[ ] Cambiar estado de propiedad → persiste inmediato
[ ] No hay errores en consola del navegador

ROLLBACK (si necesario):
[ ] Detener servidor
[ ] Restaurar pg.db.backup-<TIMESTAMP>
[ ] Revertir código
[ ] Reiniciar y verificar
```

---

## 🔗 Referencias de Código

- **Commit principal:** d48dc4f
- **Script migración:** `migrate-to-lead-interest-architecture.js`
- **Bases de datos:** `pg.db` (producción), `pg_dev.db` (desarrollo)

---

## ❓ FAQ

**P: ¿Se pierden los leads antiguos?**
R: No. El script migra todos los leads a la nueva tabla `leads`, deduplicados por email.

**P: ¿Y las propiedades?**
R: Las propiedades NO se tocan. Se crean referencias nuevas en `intereses`.

**P: ¿Puedo hacer rollback después?**
R: Sí, hasta que no borre el backup. Simplemente restaurar `pg.db.backup-<TIMESTAMP>` y revertir código.

**P: ¿Cuánto tiempo tarda la migración?**
R: Depende del volumen de datos. Típicamente 1-5 minutos.

**P: ¿Qué pasa si hay email duplicados?**
R: El script los deduplicará automáticamente, manteniendo el más reciente.

---

**Última actualización:** 2026-07-03
**Versión de migración:** 1.0
**Estado:** Listo para producción
