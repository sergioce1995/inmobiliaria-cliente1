# 📌 ACTIONABLE TODO — ZADI Production Setup

## Inmediato (Hoy)

### ✅ YA HECHO (No requiere acción)
- [x] Carpeta copiada y código verificado
- [x] GitHub repo creado con main branch
- [x] Documentación de despliegue escrita
- [x] Archivo de configuración (.env template, vercel.json)

---

## 🔴 BLOQUEANTE — Sin esto, NO funciona en producción

### 1️⃣ Deploy en Vercel (CRÍTICO)

**Tiempo estimado:** 10 minutos

**Link directo:** https://vercel.com/dashboard

**Pasos:**
```
1. Click: "+ New Project"
2. "Import Git Repository"
3. Busca y selecciona: "sergioce1995/inmobiliaria-cliente1"
4. Framework: "Other"
5. Root Directory: "."
6. [IMPORTANTE] Añade Environment Variables:
   - SESSION_SECRET = (genera string aleatorio de 32 chars)
   - DATABASE_URL = file:./pg.db
   - NODE_ENV = production
7. Click: "Deploy" 🎉
```

**Resultado esperado:**
- URL de Vercel: `https://inmobiliaria-cliente1.vercel.app`
- Deploy automático en cada push a main

---

## 🟡 IMPORTANTE (después de Vercel)

### 2️⃣ Verificación Post-Deploy

**Links a probar:**
- [ ] Web: https://inmobiliaria-cliente1.vercel.app (debe cargar landing page)
- [ ] CRM Login: https://inmobiliaria-cliente1.vercel.app/crm (redirige a login)
- [ ] API Health: https://inmobiliaria-cliente1.vercel.app/api/auth/me (devuelve JSON)

**Si algo falla:**
- Verifica logs: https://vercel.com/dashboard → inmobiliaria-cliente1 → Deployments
- Revisa que env vars están set correctamente

---

## 🟢 OPCIONAL (Producción Avanzada)

### 3️⃣ Activar Supabase (más tarde, si quieres)

**Cuándo:** Cuando tengas muchos datos o múltiples instancias

**Cómo (ver DEPLOYMENT.md Sección 2):**
```
1. Proyecto Supabase: "Sergio-Inmobiliaria" (ya existe)
2. Copia Connection String
3. Vercel → Settings → Environment Variables
4. DATABASE_URL = (pega connection string)
5. Redeploy
```

---

## 📋 Checklist Final

```
ANTES de marcar como "LISTO":

□ Vercel project creado
□ Environment vars en Vercel:
  □ SESSION_SECRET (cadena aleatoria 32+ chars)
  □ DATABASE_URL (set a file:./pg.db o Supabase)
  □ NODE_ENV (production)
□ Deploy ejecutado sin errores
□ Test web: https://inmobiliaria-cliente1.vercel.app (carga)
□ Test CRM: https://inmobiliaria-cliente1.vercel.app/crm (va a login)
□ Test API: https://inmobiliaria-cliente1.vercel.app/api/auth/me (responde JSON)

✅ SI TODO ESTÁ ✅ → ZADI está en producción
```

---

## 💡 Tips

**Cambios locales:**
```bash
cd C:\INMOBILIARIA\CLIENTE01
git checkout main
# ... haz cambios ...
git add .
git commit -m "Descripción"
git push origin main
# → Vercel redeploya automáticamente
```

**Ver logs de Vercel:**
```
https://vercel.com/dashboard
→ Selecciona "inmobiliaria-cliente1"
→ "Deployments" tab
→ Click en el deploy más reciente
```

**Rollback a deploy anterior:**
```
Vercel → Deployments → Click en deploy anterior → "Promote to Production"
```

---

## 🎯 Success Criteria

✅ **LISTO cuando:**
1. https://inmobiliaria-cliente1.vercel.app/ carga (web)
2. https://inmobiliaria-cliente1.vercel.app/crm carga (CRM login)
3. CRM muestra datos (leads, propiedades, calendario)
4. Usuarios pueden login y trabajar
5. No hay errores en navegador (F12 → Console)

---

**Última actualización:** 2026-06-26
**Estado:** Esperando deploy en Vercel ⏳
**Soporte:** Ver DEPLOYMENT.md para detalles técnicos
