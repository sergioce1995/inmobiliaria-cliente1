# 🚀 Deployment — ZADI CRM + Web

## Estado Actual
✅ Carpeta copiada: `C:\INMOBILIARIA\CLIENTE01`
✅ GitHub: https://github.com/sergioce1995/inmobiliaria-cliente1 (con main branch)
✅ vercel.json creado
✅ .env.example documentado
✅ Código CRM + Web listo (test en http://localhost:8000)

---

## Próximos Pasos

### 1️⃣ Vercel Deployment
**Objetivo:** Publicar la app en Vercel (web + API)

**Pasos:**
1. Ve a https://vercel.com/dashboard
2. New Project → Import Git Repository
3. Selecciona: `sergioce1995/inmobiliaria-cliente1`
4. Framework: Other
5. Root Directory: `.`
6. Environment Variables (antes de Deploy):
   - `SESSION_SECRET`: Genera una cadena aleatoria de 32+ caracteres
   - `DATABASE_URL`: `file:./pg.db` (usa SQLite local en Vercel)
   - `NODE_ENV`: `production`
7. Deploy 🎉

**URLs esperadas después:**
- Web: `https://inmobiliaria-cliente1.vercel.app/`
- CRM: `https://inmobiliaria-cliente1.vercel.app/crm`
- API: `https://inmobiliaria-cliente1.vercel.app/api/...`

---

### 2️⃣ Supabase Configuration (Opcional)
**Objetivo:** Usar Supabase como DB en vez de SQLite (opcional)

**Proyecto actual:** `Sergio-Inmobiliaria` (id: `amkwipllwznysawxzhrd`)

**Si quieres usar Supabase en lugar de SQLite:**
1. Ve a https://supabase.com/dashboard
2. Abre el proyecto `Sergio-Inmobiliaria`
3. Copia la connection string: `Settings → Database → Connection String`
4. En Vercel, añade env var:
   - `DATABASE_URL`: `postgresql://...` (la connection string de Supabase)
5. Redeploy en Vercel

---

### 3️⃣ Database Initialization
**En Vercel (una sola vez):**
```bash
# Vercel ejecuta automáticamente en el primer deploy
# Si no, ejecuta manualmente:
node -e "
  const fs = require('fs');
  const path = './pg.db';
  if (!fs.existsSync(path)) {
    const migrations = fs.readdirSync('./migrations');
    // Las migraciones se cargan en server.js al iniciar
  }
"
```

---

### 4️⃣ GitHub Desktop Sync (Recomendado)
**Si haces cambios locales:**
```bash
# En C:\INMOBILIARIA\CLIENTE01
git add .
git commit -m "Descripción del cambio"
git push origin main
```
Vercel redeploya automáticamente al hacer push a main.

---

### 5️⃣ Verificación Final
Después del deploy en Vercel, verifica:

1. **Web:** https://inmobiliaria-cliente1.vercel.app/
   - [ ] Se carga la landing page
   - [ ] Imágenes de propiedades se ven
   - [ ] Formulario de contacto funciona

2. **CRM:** https://inmobiliaria-cliente1.vercel.app/crm
   - [ ] Login funciona (usa DB local de Vercel)
   - [ ] Leads aparecen
   - [ ] Propiedades se cargan
   - [ ] Inicio muestra recomendaciones
   - [ ] Calendario funciona
   - [ ] No hay errores en consola

3. **API:** https://inmobiliaria-cliente1.vercel.app/api/auth/me
   - [ ] Devuelve `{"authenticated": false}` (sin sesión)

---

## Archivos Clave

| Archivo | Rol |
|---------|-----|
| `server.js` | API + Web server (Express) |
| `crm.html` | Frontend del CRM |
| `index.html` | Web landing page |
| `pg.db` | SQLite (ignorado en Git) |
| `migrations/` | SQL scripts (ejecutados al iniciar) |
| `vercel.json` | Configuración de Vercel |
| `.env.example` | Plantilla de variables |

---

## Troubleshooting

**❌ "Cannot find module" en Vercel:**
- Verifica que `package.json` tiene todas las dependencias
- Revisa que `npm install` se ejecuta en build

**❌ CRM no carga datos:**
- Verifica que `DATABASE_URL` está set en Vercel
- Revisa los logs: `vercel logs`

**❌ "CORS error" en web:**
- API está en el mismo dominio (Vercel), no hay CORS

---

## Próximos Pasos Futuros
- [ ] Backup automático de BD (via Supabase)
- [ ] Email notifications (SendGrid/Resend)
- [ ] Análisis (Mixpanel/Plausible)
- [ ] CDN para imágenes (Cloudinary/Imagekit)

---

**Estado:** Listo para deploy en Vercel ✅
**Última actualización:** 2026-06-26
