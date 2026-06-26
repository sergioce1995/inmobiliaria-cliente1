# 📋 SETUP STATUS — ZADI CRM + Web

## ✅ Completado

### Local Development
- [x] Carpeta copiada: `C:\INMOBILIARIA\CLIENTE01`
- [x] Git inicializado y conectado a GitHub
- [x] Código CRM probado localmente (http://localhost:8000)
  - Inicio rediseñado ✅
  - PropertyDetail con KPIs clickables ✅
  - Calendario funciona ✅
  - Base de datos llena con leads reales ✅

### GitHub
- [x] Repositorio creado: https://github.com/sergioce1995/inmobiliaria-cliente1
- [x] Branch main contiene código inicial
- [x] Branch setup/deployment con configuración para Vercel

### Configuration Files
- [x] `vercel.json` — Configuración de Vercel
- [x] `.env.example` — Variables de entorno documentadas
- [x] `DEPLOYMENT.md` — Guía completa de despliegue

---

## 📝 Próximos Pasos (Para el Usuario)

### 1. Merge la rama setup/deployment
```bash
# En GitHub: https://github.com/sergioce1995/inmobiliaria-cliente1/pull/new/setup/deployment
# O en local:
git checkout main
git merge setup/deployment
git push origin main
```

### 2. Conectar Vercel
**Instrucciones en:** [DEPLOYMENT.md](./DEPLOYMENT.md) → Sección "Vercel Deployment"

**Resumen rápido:**
1. https://vercel.com → Import Git Repository
2. Selecciona: `sergioce1995/inmobiliaria-cliente1`
3. Add Environment Variables:
   - `SESSION_SECRET`: Cadena aleatoria (32+ chars)
   - `DATABASE_URL`: `file:./pg.db` (o la de Supabase)
4. Deploy

### 3. Verificar Deployments
Una vez desplegado en Vercel:
- ✅ Web: `https://inmobiliaria-cliente1.vercel.app/`
- ✅ CRM: `https://inmobiliaria-cliente1.vercel.app/crm`
- ✅ API: `https://inmobiliaria-cliente1.vercel.app/api/*`

---

## 🔧 Base de Datos

### Opción A: SQLite Local (Actual)
- **Ubicación:** `pg.db` (en la carpeta raíz)
- **Ventajas:** Sem

plista, no requiere servicios externos
- **Desventaja:** No se sincroniza entre instancias de Vercel

### Opción B: Supabase (Recomendado para Producción)
- **Proyecto actual:** `Sergio-Inmobiliaria`
- **ID:** `amkwipllwznysawxzhrd`
- **URL:** https://supabase.com/projects/amkwipllwznysawxzhrd
- **Ventajas:** Backup automático, escalable, real-time

**Para activar Supabase en Vercel:**
1. En Supabase: `Settings → Database → Connection string`
2. En Vercel env vars: `DATABASE_URL=postgresql://...`
3. Redeploy

---

## 📊 Supabase Status

### Proyectos Actuales
| Nombre | ID | Estado |
|--------|----|---------| 
| Sergio-Inmobiliaria | `amkwipllwznysawxzhrd` | ✅ Activo |

**Nota:** Usuario mencionó 2 proyectos duplicados, pero solo 1 visible en la organización actual.

---

## 🗂️ Estructura del Repo

```
C:\INMOBILIARIA\CLIENTE01/
├── server.js                 # API Express + Web server
├── crm.html                  # Frontend CRM
├── index.html                # Web landing
├── package.json              # Dependencias
├── pg.db                      # SQLite (ignorado en Git)
├── migrations/               # SQL scripts
│   └── 001-create-crm-tables.sql
├── vercel.json               # Vercel config ✨ NUEVO
├── .env.example              # Env template ✨ NUEVO
├── DEPLOYMENT.md             # Guía despliegue ✨ NUEVO
├── node_modules/             # Dependencias (local)
└── ...
```

---

## 🎯 QUÉ FALTA PARA PRODUCCIÓN

### Absoluto (Bloqueantes)
1. **Vercel Deployment**
   - [ ] Conectar repo a Vercel
   - [ ] Configurar env vars (`SESSION_SECRET`, `DATABASE_URL`)
   - [ ] Deploy ← **TAREA 1**

### Importante (Recomendado)
2. **Supabase para BD Productiva**
   - [ ] Migrar a Supabase (opcional si SQLite local es suficiente)
   - [ ] Configurar respaldos automáticos

3. **Verificación Post-Deploy**
   - [ ] Probar web: https://inmobiliaria-cliente1.vercel.app
   - [ ] Probar CRM: https://inmobiliaria-cliente1.vercel.app/crm
   - [ ] Probar API: https://inmobiliaria-cliente1.vercel.app/api/auth/me

### Futuro (Mejoras)
- [ ] Email (SendGrid/Resend)
- [ ] Analytics
- [ ] SSL/HTTPS (Vercel lo da gratis)
- [ ] Custom domain (opcional)

---

## 🔐 Seguridad

**IMPORTANTE:** Antes de Deploy:
- [ ] Generar `SESSION_SECRET` seguro (no uses "test" o strings predecibles)
- [ ] Usar `.env` local (NUNCA commitear .env con secretos)
- [ ] Verificar que `DATABASE_URL` en Vercel está configurado

**En Vercel, nunca expongas:**
- DATABASE_URL (es privado, lo guarda como secret)
- SESSION_SECRET (es privado, lo guarda como secret)

---

## 📞 Resumen Ejecutivo

| Componente | Estado | URL |
|------------|--------|-----|
| **GitHub** | ✅ Listo | https://github.com/sergioce1995/inmobiliaria-cliente1 |
| **Código** | ✅ Probado | C:\INMOBILIARIA\CLIENTE01 |
| **Vercel** | ⏳ Pendiente | https://inmobiliaria-cliente1.vercel.app (TBD) |
| **Supabase** | ✅ Opcional | https://supabase.com/projects/amkwipllwznysawxzhrd |
| **Web + CRM** | ✅ Listos | Ver arriba |

---

**Última actualización:** 2026-06-26
**Próximo paso:** [DEPLOYMENT.md → Vercel Deployment](./DEPLOYMENT.md#1️⃣-vercel-deployment)
