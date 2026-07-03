// sync-from-prod.js — Trae a tu pg.db LOCAL los leads/propiedades/visitas NUEVOS
// que el cliente haya creado en producción (Render). No borra ni sobreescribe nada
// local; solo INSERTA registros cuyo id todavía no existe en local.
//
// Uso:
//   PROD_URL=https://inmobiliaria-cliente1.onrender.com PROD_EMAIL=tu@email.com PROD_PASSWORD=tu_password node sync-from-prod.js

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROD_URL = process.env.PROD_URL || 'https://inmobiliaria-cliente1.onrender.com';
const EMAIL = process.env.PROD_EMAIL;
const PASSWORD = process.env.PROD_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('❌ Faltan credenciales. Uso:\n   PROD_EMAIL=tu@email.com PROD_PASSWORD=tu_password node sync-from-prod.js');
  process.exit(1);
}

const db = new sqlite3.Database(path.join(__dirname, 'pg.db'));
const dbRun = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, function (e) { e ? rej(e) : res(this); }));
const dbGet = (sql, params = []) => new Promise((res, rej) => db.get(sql, params, (e, r) => e ? rej(e) : res(r)));

async function login() {
  const res = await fetch(`${PROD_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Login falló (${res.status}): ${body.error || body.needsSetup ? 'la cuenta no tiene contraseña aún' : 'credenciales incorrectas'}`);
  }
  const cookie = res.headers.get('set-cookie');
  return cookie.split(';')[0]; // "pg_session=..."
}

async function fetchJSON(urlPath, cookie) {
  const res = await fetch(`${PROD_URL}${urlPath}`, { headers: { Cookie: cookie } });
  if (!res.ok) throw new Error(`GET ${urlPath} falló (${res.status})`);
  return res.json();
}

async function main() {
  console.log(`🔐 Iniciando sesión en ${PROD_URL}...`);
  const cookie = await login();
  console.log('✅ Sesión iniciada');

  // ── Propiedades (endpoint público, no necesita cookie) ──
  const propsRes = await fetch(`${PROD_URL}/api/paula/properties`);
  const { properties: prodProps } = await propsRes.json();
  let newProps = 0, newImages = 0;
  for (const p of prodProps) {
    const exists = await dbGet('SELECT id FROM properties WHERE id = ?', [p.id]);
    if (!exists) {
      await dbRun(
        `INSERT INTO properties (id, client_id, titulo, direccion, tipo, precio_venta, precio_alquiler, habitaciones, banos, metros_cuadrados, zona, ciudad, descripcion, caracteristicas, estado, latitud, longitud, unidad_superficie, created_at, updated_at)
         VALUES (?, 'default-client', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.titulo, p.direccion, p.tipo, p.precio_venta || null, p.precio_alquiler || null, p.habitaciones, p.banos, p.metros_cuadrados, p.zona, p.ciudad, p.descripcion, JSON.stringify(p.features || []), p.estado, p.lat || null, p.lng || null, p.unidad_superficie, p.created_at || new Date().toISOString(), p.updated_at || new Date().toISOString()]
      );
      newProps++;
    }
    for (const img of (p.images || [])) {
      const imgExists = await dbGet('SELECT id FROM property_images WHERE id = ?', [img.id]);
      if (!imgExists) {
        await dbRun('INSERT INTO property_images (id, property_id, filename, orden, created_at) VALUES (?, ?, ?, ?, ?)', [img.id, p.id, img.filename, 0, new Date().toISOString()]);
        newImages++;
      }
    }
  }

  // ── Leads (requiere auth) ──
  const leadsData = await fetchJSON('/api/crm/leads?client_id=default-client', cookie);
  let newLeads = 0;
  for (const l of (leadsData.leads || [])) {
    const exists = await dbGet('SELECT id FROM leads WHERE id = ?', [l.id]);
    if (!exists) {
      await dbRun(
        `INSERT INTO leads (id, client_id, nombre, apellidos, email, telefono, origin, source_property_id, status, assigned_to, notes, interes_propiedades, created_at, updated_at)
         VALUES (?, 'default-client', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [l.id, l.nombre, l.apellidos, l.email, l.telefono, l.origin, l.source_property_id, l.status, l.assigned_to, l.notes, l.interes_propiedades, l.created_at, l.updated_at]
      );
      newLeads++;
    }
  }

  // ── Visitas (requiere auth) ──
  const visitsData = await fetchJSON('/api/crm/visits?client_id=default-client', cookie);
  let newVisits = 0;
  for (const v of (visitsData.visits || [])) {
    const exists = await dbGet('SELECT id FROM visits WHERE id = ?', [v.id]);
    if (!exists) {
      await dbRun(
        `INSERT INTO visits (id, client_id, lead_id, property_id, scheduled_for, duration_minutes, title, notes, status, created_by, created_at, updated_at)
         VALUES (?, 'default-client', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.id, v.lead_id, v.property_id, v.scheduled_for, v.duration_minutes, v.title, v.notes, v.status, v.created_by, v.created_at, v.updated_at]
      );
      newVisits++;
    }
  }

  console.log(`\n✅ Sincronización completa:`);
  console.log(`   Propiedades nuevas: ${newProps} (+ ${newImages} imágenes)`);
  console.log(`   Leads nuevos: ${newLeads}`);
  console.log(`   Visitas nuevas: ${newVisits}`);
  db.close();
}

main().catch((err) => { console.error('❌', err.message); db.close(); process.exit(1); });
