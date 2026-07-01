// PG — CRM + Web Server
// Propiedades del CRM (SQLite)
// Lead capture automático
// Multi-tenant ready

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import NodeCache from 'node-cache';
import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import Anthropic from '@anthropic-ai/sdk';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8000;

// ─ RUTAS DE DATOS (configurables para producción / disco persistente) ─
// En local usan la carpeta del proyecto; en Render se apuntan al disco con env vars.
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'pg.db');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'public', 'propiedades');
// Datos iniciales (se copian al disco solo en el PRIMER arranque si está vacío)
const SEED_DB = path.join(__dirname, 'seed', 'pg.db');
const SEED_UPLOADS = path.join(__dirname, 'seed', 'propiedades');

function seedDataIfNeeded() {
  try {
    // Crear directorio de BD si no existe (para Vercel)
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

    // Copiar seed si existe, si no el servidor creará una BD vacía
    if (!fs.existsSync(DB_PATH) && fs.existsSync(SEED_DB)) {
      fs.copyFileSync(SEED_DB, DB_PATH);
      console.log('🌱 Base de datos inicial copiada a', DB_PATH);
    } else if (!fs.existsSync(DB_PATH)) {
      console.log('📝 Nueva base de datos será creada en', DB_PATH);
    }

    if (fs.existsSync(SEED_UPLOADS) && (!fs.existsSync(UPLOADS_DIR) || fs.readdirSync(UPLOADS_DIR).length === 0)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      fs.cpSync(SEED_UPLOADS, UPLOADS_DIR, { recursive: true });
      console.log('🌱 Imágenes iniciales copiadas a', UPLOADS_DIR);
    } else {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('⚠️ Seed inicial:', e.message);
  }
}
seedDataIfNeeded();

// ─ CACHE ─
// Cachea resultados durante 5 minutos (600 segundos)
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// ─ AUTH config ─
const SESSION_SECRET = process.env.SESSION_SECRET || 'pg-dev-secret-cambiar-en-produccion';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'info@pgasesorainmobiliaria.com').toLowerCase();
// Cuenta de administrador (tuya) presente en TODOS los despliegues para soporte/revisión.
const MASTER_ADMIN_EMAIL = (process.env.MASTER_ADMIN_EMAIL || 'sergioce1995@gmail.com').toLowerCase();
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
};
app.use(express.static('.')); // Servir archivos públicos
app.use('/images', express.static(path.join(__dirname, 'public', 'images'))); // Ruta para imágenes (estáticas del diseño)
app.use('/propiedades', express.static(UPLOADS_DIR)); // Imágenes de propiedades (disco persistente en prod)
app.use('/property-images', express.static(UPLOADS_DIR)); // Alias alternativo

// ─ CONFIGURACIÓN ─
// Google Sheets/Drive integration DESACTIVADO
// Todas las propiedades se gestionan desde el CRM (SQLite)
/*
const SHEET_ID = '1clnphc3qes7E1PmaFyvc9RLa1EIGkhU-q1v73M8EEJI';
const DRIVE_FOLDER_ID = '1vfGft-FgiBBbYiH5d2AJxI97JEZh6i6F';
const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');

let credentials;
try {
  credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
} catch (err) {
  console.error('Error reading credentials:', err.message);
  process.exit(1);
}

// ─ AUTH ─ (DESACTIVADO)
/*
const auth = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/gmail.send',
  ],
});
*/

// ─ ANTHROPIC API (para Agente IA y Insights) ─
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-placeholder'
});

// ─ GEOCODING CACHE ─ (DESACTIVADO)
// const geocodeCache = {};

// ─ DATABASE MIGRATIONS ─
// Cargar y ejecutar migraciones SQL al iniciar (en orden alfabético)
function initializeCRMTables() {
  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Orden alfabético: 001, 002, 003...

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        db.run(statement + ';', (err) => {
          if (err && !err.message.includes('already exists')) {
            console.warn(`⚠️ Migration [${file}] warning: ${err.message}`);
          }
        });
      }
      console.log(`✅ Migration loaded: ${file}`);
    }

    // ALTER TABLE para columnas adicionales (idempotente, compatibilidad)
    db.run(`ALTER TABLE properties ADD COLUMN latitud REAL`, () => {});
    db.run(`ALTER TABLE properties ADD COLUMN longitud REAL`, () => {});
    db.run(`ALTER TABLE properties ADD COLUMN unidad_superficie TEXT DEFAULT 'm²'`, () => {});
    db.run(`ALTER TABLE properties ADD COLUMN ciudad TEXT`, () => {});
    db.run(`ALTER TABLE leads ADD COLUMN interes_propiedades TEXT`, () => {});

    console.log('✅ CRM tables and migrations initialized');
  } catch (err) {
    console.error('❌ Error loading migrations:', err.message);
  }
}

// ─ GEOCODING: Nominatim (cache en memoria) ─
const geocodeCache = {};
async function geocodeAddress(address) {
  if (!address) return null;
  if (geocodeCache[address]) return geocodeCache[address];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'PG-Inmobiliaria/1.0' } });
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache[address] = coords;
      console.log(`📍 Geocoded "${address}" → ${coords.lat}, ${coords.lng}`);
      return coords;
    }
  } catch (err) {
    console.warn(`⚠️ Geocoding fail "${address}":`, err.message);
  }
  return null;
}

// ─ DATABASE: SQLite para saved searches + CRM ─
const dbPath = DB_PATH;
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err);
  } else {
    console.log('✅ SQLite database opened');
    // Crear tabla si no existe
    db.run(`
      CREATE TABLE IF NOT EXISTS saved_searches (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        email TEXT NOT NULL,
        nombre_busqueda TEXT NOT NULL,
        filtros TEXT NOT NULL,
        token_privado TEXT UNIQUE NOT NULL,
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_property_sent TEXT
      )
    `, (err) => {
      if (err) console.error('❌ Error creating table:', err);
      else console.log('✅ Saved searches table ready');
    });

    // Inicializar tablas CRM
    initializeCRMTables();
    // Asegurar la cuenta de acceso al CRM (sin contraseña hasta el primer acceso)
    ensureAdminUser();
  }
});

// Crea la tabla users (si falta) y siembra la cuenta admin sin contraseña.
// Serializado para garantizar que la tabla existe antes del INSERT.
function ensureAdminUser() {
  const now = new Date().toISOString();
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      client_id TEXT DEFAULT 'default-client',
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      nombre TEXT,
      role TEXT DEFAULT 'agente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // Por si la tabla ya existía sin la columna role
    db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'agente'`, () => {});
    const seed = (email, nombre, role) => db.run(
      `INSERT OR IGNORE INTO users (id, client_id, email, password_hash, nombre, role, created_at, updated_at)
       VALUES (?, 'default-client', ?, NULL, ?, ?, ?, ?)`,
      [uuidv4(), email, nombre, role, now, now],
      (err) => {
        if (err) console.warn(`⚠️ Seed user ${email}:`, err.message);
        else console.log(`✅ Cuenta CRM asegurada: ${email} (${role})`);
      }
    );
    seed(ADMIN_EMAIL, 'Paula Gutiérrez', 'agente');
    seed(MASTER_ADMIN_EMAIL, 'Administrador', 'admin');
  });
}

// ─ EMAIL: Gmail API (usando Google Service Account) ─
// Usa las mismas credenciales de Google que para Sheets/Drive
// Los emails se envían desde la cuenta de Google del cliente

// ─ GEOCODING: Dirección → Coordenadas (Nominatim OpenStreetMap) ─
// ─ GEOCODING (DESACTIVADO) ─
/*
async function geocodeAddress(address) {
  if (geocodeCache[address]) {
    return geocodeCache[address];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'PG-Inmobiliaria' } }
    );

    if (!response.ok) {
      console.warn(`❌ Geocoding failed for: ${address}`);
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      const { lat, lon } = data[0];
      const coords = { lat: parseFloat(lat), lng: parseFloat(lon) };
      geocodeCache[address] = coords;
      console.log(`✅ Geocoded: ${address} → (${coords.lat}, ${coords.lng})`);
      return coords;
    }
  } catch (err) {
    console.error('❌ Geocoding error:', err.message);
  }

  return null;
}
*/

// ─ SERVIR IMAGEN HERO SIN CACHÉ ─
app.get('/images/hero/paula.jpg', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'images', 'hero', 'paula.jpg');
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('❌ Error sirviendo paula.jpg:', err.message);
      res.status(404).send('Imagen no encontrada');
    }
  });
});

// ─ API: Obtener propiedades (SQLite + Google Sheets legacy) ─
app.get('/api/properties', async (req, res) => {
  const cached = cache.get('properties');
  if (cached) {
    console.log('✅ Devolviendo propiedades del caché');
    return res.json(cached);
  }

  try {
    const properties = [];

    // 1️⃣ LEER PROPIEDADES DEL CRM (SQLite)
    try {
      // Para Paula: obtener TODAS las propiedades (sin filtrar por client_id mientras tanto)
      const dbProperties = await dbAll(
        `SELECT * FROM properties ORDER BY created_at DESC`,
        []
      );

      for (const dbProp of dbProperties) {
        const images = await dbAll(
          `SELECT * FROM property_images WHERE property_id = ? ORDER BY orden ASC`,
          [dbProp.id]
        );

        // Incluir propiedades con venta O alquiler
        if (dbProp.precio_venta || dbProp.precio_alquiler) {
          // Geocodificar si no tiene coords (cachea)
          let lat = dbProp.latitud, lng = dbProp.longitud;
          if (lat == null || lng == null) {
            const addr = [dbProp.zona, 'Tenerife, España'].filter(Boolean).join(', ');
            const coords = await geocodeAddress(addr);
            if (coords) {
              lat = coords.lat; lng = coords.lng;
              await dbRun('UPDATE properties SET latitud = ?, longitud = ? WHERE id = ?', [lat, lng, dbProp.id]);
            }
          }
          // Pequeño jitter determinista para no apilar marcadores en el mismo punto
          if (lat != null && lng != null) {
            const seed = dbProp.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            lat += ((seed % 100) - 50) / 10000;
            lng += (((seed * 7) % 100) - 50) / 10000;
          }

          const photoArr = images.map(img => ({
            id: img.id,
            name: img.filename,
            url: `/propiedades/${dbProp.id}/imagenes/${img.filename}`
          }));

          properties.push({
            id: dbProp.id,
            title: dbProp.titulo,
            type: dbProp.precio_venta ? 'compra' : 'alquiler',
            kind: dbProp.tipo,
            price: dbProp.precio_venta || dbProp.precio_alquiler || 0,
            rooms: dbProp.habitaciones || 0,
            baths: dbProp.banos || 0,
            m2: dbProp.metros_cuadrados || 0,
            area: dbProp.zona,
            description: dbProp.descripcion,
            address: dbProp.direccion,
            lat: lat || 28.28,
            lng: lng || -16.55,
            photo: photoArr[0]?.url || null,
            photos: photoArr,
            images: photoArr,
            tone: 45,
            tag: 'disponible',
            elevator: false
          });
        }

        console.log(`✅ Propiedad CRM: ${dbProp.titulo}`);
      }
    } catch (err) {
      console.warn('⚠️ Error leyendo CRM:', err.message);
    }

    // 2️⃣ LEER PROPIEDADES DE GOOGLE SHEETS (LEGACY) - DESACTIVADO
    // Solo usar propiedades del CRM ahora
    /*
    try {
      const doc = new GoogleSpreadsheet(SHEET_ID, auth);
      await doc.loadInfo();

      const sheet = doc.sheetsByTitle['Propiedades'];
      if (sheet) {
        const rows = await sheet.getRows();
        console.log(`📊 Total filas Sheet: ${rows.length}`);

        for (const row of rows) {
          const getField = (fieldName) => {
            const value = row.get(fieldName);
            return value ? String(value).trim() : '';
          };

          const idRef = getField('ID Referencia');
          if (!idRef) continue;

          const dirección = getField('Dirección');
          const coords = await geocodeAddress(dirección);
          const images = await getImagesFromDrive(idRef);

          const priceStr = getField('Precio Venta (€)').split(',')[0].replace(/\./g, '').trim();
          const price = parseInt(priceStr) || 0;

          const tipo = getField('Tipo Inmueble') || 'Propiedad';
          const zona = getField('Zona') || 'Tenerife';

          properties.push({
            id: idRef,
            title: `${tipo} en ${zona}`,
            type: 'compra',
            kind: tipo,
            price: price,
            rooms: parseInt(getField('Habitaciones')) || 0,
            baths: parseInt(getField('Baños')) || 0,
            m2: parseInt(getField('Metros Cuadrados')) || 0,
            area: zona,
            description: getField('Observaciones'),
            address: dirección,
            lat: coords?.lat || null,
            lng: coords?.lng || null,
            photos: images,
            tone: (idRef.charCodeAt(0) + idRef.charCodeAt(idRef.length - 1)) % 360,
            tag: getField('Estado'),
            elevator: getField('Ascensor') === 'Sí'
          });

          console.log(`✅ Propiedad Sheet: ${tipo} en ${zona}`);
        }
      }
    } catch (err) {
      console.warn('⚠️ Error leyendo Sheets:', err.message);
    }
    */

    console.log(`📦 Total propiedades: ${properties.length}`);
    cache.set('properties', properties);
    res.json(properties);
  } catch (err) {
    console.error('❌ Error fetching properties:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─ DRIVE: Obtener imágenes de una propiedad ─
// ─ GOOGLE DRIVE IMAGES (DESACTIVADO) ─
/*
async function getImagesFromDrive(propId) {
  try {
    const token = await auth.getAccessToken();

    // Buscar carpeta de la propiedad en el Drive
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${propId}' and '${DRIVE_FOLDER_ID}' in parents and trashed=false&spaces=drive&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${token.token}` }
      }
    );

    const data = await response.json();
    if (!data.files || data.files.length === 0) {
      return [];
    }

    const propFolder = data.files[0];

    // Buscar carpeta IMAGENES dentro de la propiedad
    const imagesResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='IMAGENES' and '${propFolder.id}' in parents and trashed=false&spaces=drive&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${token.token}` }
      }
    );

    const imagesData = await imagesResponse.json();
    if (!imagesData.files || imagesData.files.length === 0) {
      return [];
    }

    const imagesFolder = imagesData.files[0];

    // Obtener archivos dentro de IMAGENES
    const filesResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${imagesFolder.id}' in parents and trashed=false and mimeType contains 'image'&spaces=drive&fields=files(id,name,webContentLink)`,
      {
        headers: { Authorization: `Bearer ${token.token}` }
      }
    );

    const filesData = await filesResponse.json();
    return (filesData.files || []).map(file => ({
      id: file.id,
      name: file.name,
      url: `/api/image/${file.id}`,
    }));
  } catch (err) {
    console.error('Error fetching images:', err.message);
    return [];
  }
}
*/

// ─ API: Guardar interesados ─
app.post('/api/interested', async (req, res) => {
  try {
    const { fullName, lastName, email, phone, propertyRef } = req.body;

    const doc = new GoogleSpreadsheet(SHEET_ID, auth);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['Interesados'];
    if (!sheet) {
      return res.status(404).json({ error: 'Hoja Interesados no encontrada' });
    }

    // Formatear fecha como DD/MM/YYYY HH:mm:ss (igual al anterior)
    const now = new Date();
    const dia = String(now.getDate()).padStart(2, '0');
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const año = now.getFullYear();
    const horas = String(now.getHours()).padStart(2, '0');
    const minutos = String(now.getMinutes()).padStart(2, '0');
    const segundos = String(now.getSeconds()).padStart(2, '0');
    const fechaFormato = `${dia}/${mes}/${año} ${horas}:${minutos}:${segundos}`;

    // Guardar en orden correcto: Inmueble, Nombre, Apellidos, Email, Teléfono, Fecha y hora, Estado
    await sheet.addRow({
      'Inmueble': propertyRef,
      'Nombre': fullName,
      'Apellidos': lastName,
      'Email': email,
      'Teléfono': phone,
      'Fecha y hora': fechaFormato,
      'Estado': '',
    });

    // NUEVO: Guardar también en SQLite (para CRM)
    // TODO: En producción, obtener client_id del contexto del usuario
    const clientId = 'client-123'; // Demo: hardcodeado para testing
    const leadId = uuidv4();
    const nowISO = new Date().toISOString();

    console.log(`🔄 Intentando guardar lead en CRM: ${fullName} (${email})`);

    try {
      // Guardar lead
      await dbRun(
        `INSERT INTO leads (id, client_id, nombre, apellidos, email, telefono, origin, source_property_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [leadId, clientId, fullName, lastName, email, phone, 'web_form', propertyRef, 'nuevo', nowISO, nowISO]
      );
      console.log(`✅ Lead guardado en CRM: ${fullName} - ${email}`);

      // NUEVO: Guardar también como contacto (automáticamente)
      const contactId = uuidv4();
      await dbRun(
        `INSERT INTO contacts (id, client_id, nombre, apellidos, email, telefono, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [contactId, clientId, fullName, lastName, email, phone, nowISO, nowISO]
      );
      console.log(`✅ Contacto creado automáticamente: ${fullName}`);
    } catch (dbErr) {
      console.error(`❌ Error guardando en CRM: ${dbErr.message}`);
      console.error(dbErr);
    }

    console.log(`✅ Interesado registrado: ${fullName} ${lastName} - ${propertyRef}`);
    res.json({ success: true, message: 'Interés registrado correctamente' });
  } catch (err) {
    console.error('❌ Error saving interested:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─ API: SAVED SEARCHES ─

// Guardar una búsqueda
app.post('/api/saved-search', (req, res) => {
  const { clientId, email, nombreBusqueda, filtros } = req.body;

  if (!email || !filtros || !nombreBusqueda) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  const id = uuidv4();
  const tokenPrivado = uuidv4();

  db.run(
    `INSERT INTO saved_searches (id, client_id, email, nombre_busqueda, filtros, token_privado)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, clientId, email, nombreBusqueda, JSON.stringify(filtros), tokenPrivado],
    (err) => {
      if (err) {
        console.error('❌ Error saving search:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`✅ Búsqueda guardada: ${nombreBusqueda} para ${email}`);
      res.json({
        success: true,
        id,
        token: tokenPrivado,
        message: '💾 Búsqueda guardada. Te avisaremos si hay nuevas propiedades.'
      });
    }
  );
});

// Ver búsquedas guardadas (con token privado)
app.get('/api/saved-search/:token', (req, res) => {
  const { token } = req.params;

  db.all(
    `SELECT id, email, nombre_busqueda, filtros, created_at FROM saved_searches WHERE token_privado = ? AND active = 1`,
    [token],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const searches = (rows || []).map(row => ({
        id: row.id,
        email: row.email,
        nombre: row.nombre_busqueda,
        filtros: JSON.parse(row.filtros),
        createdAt: row.created_at
      }));

      res.json({ searches, token });
    }
  );
});

// Eliminar búsqueda guardada
app.delete('/api/saved-search/:id', (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE saved_searches SET active = 0 WHERE id = ?`,
    [id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      console.log(`✅ Búsqueda eliminada: ${id}`);
      res.json({ success: true, message: 'Búsqueda eliminada' });
    }
  );
});

// Función para verificar si una propiedad encaja con una búsqueda guardada
function propertyMatchesFilters(property, filters) {
  if (filters.zona && property.area !== filters.zona) return false;
  if (filters.tipo && property.kind !== filters.tipo) return false;
  if (filters.precioMin && property.price < filters.precioMin) return false;
  if (filters.precioMax && property.price > filters.precioMax) return false;
  if (filters.habitacionesMin && property.rooms < filters.habitacionesMin) return false;
  return true;
}

// ─ MULTI-TENANT MIDDLEWARE ─
// Verifica que el usuario tiene acceso al cliente_id solicitado
// Para Phase 1, usamos client_id del request como contexto
function validateClientAccess(req, res, next) {
  const clientId = req.body.client_id || req.params.client_id || req.query.client_id;

  if (!clientId) {
    return res.status(400).json({ error: 'client_id es requerido' });
  }

  // TODO: En producción, validar contra JWT/sesión del usuario
  // Por ahora, simplemente pasar el client_id al siguiente middleware
  req.user = req.user || {};
  req.user.client_id = clientId;
  next();
}

// Helper: convertir db.run/db.all a Promises para async/await
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

// Función para enviar emails a búsquedas guardadas que encajan (usando Gmail API)
async function notifySavedSearches(newProperty) {
  db.all(
    `SELECT id, email, nombre_busqueda, filtros, last_property_sent FROM saved_searches WHERE active = 1`,
    async (err, rows) => {
      if (err) {
        console.error('❌ Error fetching saved searches:', err);
        return;
      }

      for (const search of rows || []) {
        const filters = JSON.parse(search.filtros);

        if (propertyMatchesFilters(newProperty, filters)) {
          try {
            const token = await auth.getAccessToken();

            // Construir email en formato RFC 2822
            const emailContent = `From: PG Inmobiliaria <${credentials.client_email}>
To: ${search.email}
Subject: 🏠 Nueva propiedad: ${newProperty.title}
Content-Type: text/html; charset=utf-8

<h2>¡Nueva propiedad que te interesa!</h2>
<p>Encontramos una propiedad en tu búsqueda: "<strong>${search.nombre_busqueda}</strong>"</p>

<div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
  <h3>${newProperty.title}</h3>
  <p><strong>Precio:</strong> €${newProperty.price.toLocaleString()}</p>
  <p><strong>Zona:</strong> ${newProperty.area}</p>
  <p><strong>Tipo:</strong> ${newProperty.kind}</p>
  <p><strong>Habitaciones:</strong> ${newProperty.rooms} | <strong>Baños:</strong> ${newProperty.baths} | <strong>m²:</strong> ${newProperty.m2}</p>
  <p><strong>Descripción:</strong> ${newProperty.description}</p>
</div>

<p>
  <a href="http://localhost:8000" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
    Ver propiedad completa
  </a>
</p>

<hr>
<p style="font-size: 12px; color: #999;">
  Estás recibiendo este email porque guardaste una búsqueda en PG.<br>
  Para gestionar tus búsquedas o desuscribirte, contacta con PG.
</p>`;

            // Enviar usando Gmail API
            const encodedMessage = Buffer.from(emailContent)
              .toString('base64')
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '');

            const sendResponse = await fetch(
              'https://www.googleapis.com/gmail/v1/users/me/messages/send',
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token.token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  raw: encodedMessage
                })
              }
            );

            if (sendResponse.ok) {
              console.log(`✅ Email enviado a ${search.email} - Búsqueda: ${search.nombre_busqueda}`);
              // Actualizar timestamp de última propiedad enviada
              db.run(
                `UPDATE saved_searches SET last_property_sent = ? WHERE id = ?`,
                [newProperty.id, search.id]
              );
            } else {
              const error = await sendResponse.json();
              console.error(`❌ Error enviando email a ${search.email}:`, error);
            }
          } catch (err) {
            console.error(`❌ Error en Gmail API para ${search.email}:`, err.message);
          }
        }
      }
    }
  );
}

// ─ API: Servir imágenes de propiedades del CRM ─
app.get('/api/property-image/:propertyId/:filename', (req, res) => {
  try {
    const { propertyId, filename } = req.params;
    const filepath = path.join(UPLOADS_DIR, propertyId, 'imagenes', filename);

    // Validar que el archivo existe
    if (!fs.existsSync(filepath)) {
      console.warn(`⚠️ Imagen no encontrada: ${filepath}`);
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    res.sendFile(filepath);
  } catch (err) {
    console.error('❌ Error serving property image:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─ API: Servir imágenes de Drive (proxy con autenticación) ─
app.get('/api/image/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const token = await auth.getAccessToken();

    const imageRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${token.token}` }
      }
    );

    if (!imageRes.ok) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    // Pasar el content-type correcto
    const contentType = imageRes.headers.get('content-type');
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // Cachear 24h en cliente

    // Stream la imagen
    imageRes.body.pipe(res);
  } catch (err) {
    console.error('Error serving image:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─ HEALTH CHECK ─
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────
// CRM API ENDPOINTS (Phase 1)
// ─────────────────────────────────────────────────────────────

// DELETE /api/delete-all-properties - Clean all properties (TEMPORARY - ADMIN)
app.delete('/api/delete-all-properties', async (req, res) => {
  try {
    await dbRun(`DELETE FROM property_images`);
    await dbRun(`DELETE FROM properties`);
    res.json({ message: 'All properties deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/fix-properties - Fix caracteristicas format (TEMPORARY)
app.post('/api/fix-properties', async (req, res) => {
  try {
    const props = await dbAll(`SELECT id, caracteristicas FROM properties`);
    for (const prop of props) {
      try {
        if (prop.caracteristicas && typeof prop.caracteristicas === 'string') {
          // Try to parse as JSON
          try {
            const parsed = JSON.parse(prop.caracteristicas);
            // Already valid JSON, skip
            continue;
          } catch {
            // Invalid JSON - convert string to array
            const fixed = JSON.stringify([prop.caracteristicas]);
            await dbRun(`UPDATE properties SET caracteristicas = ? WHERE id = ?`, [fixed, prop.id]);
          }
        }
      } catch (e) {
        console.warn(`Failed to fix prop ${prop.id}:`, e.message);
      }
    }
    res.json({ message: 'Fixed properties', count: props.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─ AUTENTICACIÓN ─────────────────────────────────────────────
function signToken(payload) {
  return jwt.sign(payload, SESSION_SECRET, { expiresIn: '30d' });
}

function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.pg_session;
    if (!token) return res.status(401).json({ error: 'No autenticado' });
    req.authUser = jwt.verify(token, SESSION_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
}

// Estado de sesión
app.get('/api/auth/me', (req, res) => {
  try {
    const d = jwt.verify(req.cookies?.pg_session || '', SESSION_SECRET);
    db.get('SELECT nombre, email, role FROM users WHERE email = ?', [d.email], (err, user) => {
      if (err || !user) return res.json({ authenticated: true, email: d.email, nombre: d.email.split('@')[0], role: 'agente' });
      res.json({ authenticated: true, email: user.email, nombre: user.nombre || d.email.split('@')[0], role: user.role || 'agente' });
    });
  } catch {
    res.json({ authenticated: false });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const user = await dbGet('SELECT * FROM users WHERE lower(email) = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    if (!user.password_hash) return res.status(409).json({ needsSetup: true });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    res.cookie('pg_session', signToken({ email: user.email, client_id: user.client_id || 'default-client' }), COOKIE_OPTS);
    res.json({ ok: true, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Primer acceso: crear contraseña (solo si la cuenta aún no tiene)
app.post('/api/auth/setup', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    const user = await dbGet('SELECT * FROM users WHERE lower(email) = ?', [email]);
    if (!user) return res.status(404).json({ error: 'Cuenta no encontrada' });
    if (user.password_hash) return res.status(409).json({ error: 'Esta cuenta ya tiene contraseña. Inicia sesión.' });
    const hash = await bcrypt.hash(password, 10);
    await dbRun('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [hash, new Date().toISOString(), user.id]);
    res.cookie('pg_session', signToken({ email: user.email, client_id: user.client_id || 'default-client' }), COOKIE_OPTS);
    res.json({ ok: true, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('pg_session');
  res.json({ ok: true });
});

// Protección del CRM: todas las rutas /api/crm/* requieren login,
// EXCEPTO los formularios públicos de la web (interés en propiedad y captación).
app.use('/api/crm/', (req, res, next) => {
  const esFormularioPublico = req.method === 'POST' && (req.path === '/leads' || req.path === '/captaciones');
  if (esFormularioPublico) return next();
  return requireAuth(req, res, next);
});

// Middleware para validar access CRM
app.use('/api/crm/', validateClientAccess);

// ─ INBOX: Leads Management ─

// GET /api/crm/leads - List all leads for a client
app.get('/api/crm/leads', async (req, res) => {
  try {
    const { client_id } = req.user;
    const { status, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM leads WHERE client_id = ? AND (status IS NULL OR status != ?)';
    const params = [client_id, 'archivado'];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const leads = await dbAll(sql, params);
    const total = await dbGet(
      'SELECT COUNT(*) as count FROM leads WHERE client_id = ?',
      [client_id]
    );

    res.json({
      leads,
      total: total.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('❌ Error fetching leads:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crm/leads - Create a new lead
app.post('/api/crm/leads', async (req, res) => {
  try {
    const client_id = req.body.client_id || req.user?.client_id || 'default-client';
    const { nombre, apellidos, email, telefono, origin = 'web_form', source_property_id, notes } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: 'nombre y email son requeridos' });
    }

    const now = new Date().toISOString();
    const parseInts = (s) => { try { const a = JSON.parse(s || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } };

    // ¿Ya existe un lead con este email? → no duplicar, añadir el interés a su lista.
    const existing = await dbGet(
      'SELECT * FROM leads WHERE client_id = ? AND lower(email) = ?',
      [client_id, (email || '').trim().toLowerCase()]
    );

    if (existing) {
      const lista = parseInts(existing.interes_propiedades);
      // Migrar la propiedad original (de leads antiguos) a la lista si aún no está
      if (existing.source_property_id && !lista.includes(existing.source_property_id)) lista.push(existing.source_property_id);
      if (source_property_id && !lista.includes(source_property_id)) lista.push(source_property_id);
      // Si estaba cerrado y vuelve a mostrar interés, se reactiva como nuevo.
      const nuevoEstado = existing.status === 'cerrado' ? 'nuevo' : existing.status;
      await dbRun(
        `UPDATE leads SET interes_propiedades = ?, source_property_id = COALESCE(source_property_id, ?), status = ?, telefono = COALESCE(NULLIF(telefono,''), ?), updated_at = ? WHERE id = ?`,
        [JSON.stringify(lista), source_property_id || null, nuevoEstado, telefono || '', now, existing.id]
      );
      const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [existing.id]);
      console.log(`🔁 Lead existente actualizado: ${email} (${lista.length} props de interés)`);
      return res.status(200).json(lead);
    }

    const id = uuidv4();
    const lista = source_property_id ? [source_property_id] : [];
    await dbRun(
      `INSERT INTO leads (id, client_id, nombre, apellidos, email, telefono, origin, source_property_id, interes_propiedades, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, client_id, nombre, apellidos, email, telefono, origin, source_property_id, JSON.stringify(lista), 'nuevo', notes || '', now, now]
    );

    console.log(`✅ Lead created: ${nombre} - ${email}`);
    const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [id]);
    res.status(201).json(lead);
  } catch (err) {
    console.error('❌ Error creating lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/crm/leads/:id - Get lead detail with interactions
app.get('/api/crm/leads/:id', async (req, res) => {
  try {
    const { client_id } = req.user;
    const { id } = req.params;

    const lead = await dbGet(
      'SELECT * FROM leads WHERE id = ? AND client_id = ?',
      [id, client_id]
    );

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    // Get interactions for this lead
    const interactions = await dbAll(
      'SELECT * FROM interactions WHERE lead_id = ? ORDER BY created_at DESC',
      [id]
    );

    res.json({ ...lead, interactions });
  } catch (err) {
    console.error('❌ Error fetching lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/crm/leads/:id - Update lead
app.patch('/api/crm/leads/:id', async (req, res) => {
  try {
    const { client_id } = req.user;
    const { id } = req.params;
    const { status, assigned_to, notes, nombre, apellidos, email, telefono } = req.body;

    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      params.push(assigned_to);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    if (nombre !== undefined) { updates.push('nombre = ?'); params.push(nombre); }
    if (apellidos !== undefined) { updates.push('apellidos = ?'); params.push(apellidos); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (telefono !== undefined) { updates.push('telefono = ?'); params.push(telefono); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);
    params.push(client_id);

    await dbRun(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = ? AND client_id = ?`,
      params
    );

    const lead = await dbGet('SELECT * FROM leads WHERE id = ?', [id]);
    console.log(`✅ Lead updated: ${id}`);
    res.json(lead);
  } catch (err) {
    console.error('❌ Error updating lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/crm/leads/:id - Archive lead (soft delete)
app.delete('/api/crm/leads/:id', async (req, res) => {
  try {
    const { client_id } = req.user;
    const { id } = req.params;

    // Soft delete: set status to 'perdido' or similar
    await dbRun(
      'UPDATE leads SET status = ?, updated_at = ? WHERE id = ? AND client_id = ?',
      ['archivado', new Date().toISOString(), id, client_id]
    );

    console.log(`✅ Lead archived: ${id}`);
    res.json({ success: true, message: 'Lead archivado' });
  } catch (err) {
    console.error('❌ Error deleting lead:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─ INTERACTIONS: Call logs, emails, notes ─

// POST /api/crm/interactions/:lead_id - Log interaction
app.post('/api/crm/interactions/:lead_id', async (req, res) => {
  try {
    const { client_id } = req.user;
    const { lead_id } = req.params;
    const { type, content, duration_minutes, created_by } = req.body;

    if (!type || !content) {
      return res.status(400).json({ error: 'type y content son requeridos' });
    }

    // Verify lead belongs to client
    const lead = await dbGet(
      'SELECT * FROM leads WHERE id = ? AND client_id = ?',
      [lead_id, client_id]
    );

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO interactions (id, lead_id, type, content, duration_minutes, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, lead_id, type, content, duration_minutes || null, created_by || '', now]
    );

    // Update lead's updated_at
    await dbRun(
      'UPDATE leads SET updated_at = ? WHERE id = ?',
      [now, lead_id]
    );

    console.log(`✅ Interaction logged: ${type} for lead ${lead_id}`);

    const interaction = await dbGet('SELECT * FROM interactions WHERE id = ?', [id]);
    res.status(201).json(interaction);
  } catch (err) {
    console.error('❌ Error logging interaction:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/crm/interactions/:lead_id - Get interaction history
app.get('/api/crm/interactions/:lead_id', async (req, res) => {
  try {
    const { client_id } = req.user;
    const { lead_id } = req.params;

    // Verify lead belongs to client
    const lead = await dbGet(
      'SELECT * FROM leads WHERE id = ? AND client_id = ?',
      [lead_id, client_id]
    );

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    const interactions = await dbAll(
      'SELECT * FROM interactions WHERE lead_id = ? ORDER BY created_at DESC',
      [lead_id]
    );

    res.json({ interactions });
  } catch (err) {
    console.error('❌ Error fetching interactions:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─ DATABASE: Contacts (Base de Datos) ─

// GET /api/crm/contacts - List all contacts
app.get('/api/crm/contacts', async (req, res) => {
  try {
    const { client_id } = req.user;
    const { limit = 50, offset = 0, search } = req.query;

    let sql = 'SELECT * FROM contacts WHERE client_id = ?';
    const params = [client_id];

    if (search) {
      sql += ` AND (nombre LIKE ? OR apellidos LIKE ? OR email LIKE ? OR telefono LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const contacts = await dbAll(sql, params);
    const total = await dbGet(
      'SELECT COUNT(*) as count FROM contacts WHERE client_id = ?',
      [client_id]
    );

    res.json({
      contacts,
      total: total.count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('❌ Error fetching contacts:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crm/contacts - Create a new contact
app.post('/api/crm/contacts', async (req, res) => {
  try {
    const { client_id } = req.user;
    const { nombre, apellidos, email, telefono, address, ciudad, preferred_property_type, budget_min, budget_max, notes, tags } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: 'nombre y email son requeridos' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO contacts (id, client_id, nombre, apellidos, email, telefono, address, ciudad, preferred_property_type, budget_min, budget_max, notes, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, client_id, nombre, apellidos, email, telefono, address, ciudad,
        preferred_property_type, budget_min, budget_max, notes,
        tags ? JSON.stringify(tags) : '[]', now, now
      ]
    );

    console.log(`✅ Contact created: ${nombre} - ${email}`);

    const contact = await dbGet('SELECT * FROM contacts WHERE id = ?', [id]);
    res.status(201).json(contact);
  } catch (err) {
    console.error('❌ Error creating contact:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/crm/contacts/:id - Update contact
app.patch('/api/crm/contacts/:id', async (req, res) => {
  try {
    const { client_id } = req.user;
    const { id } = req.params;
    const { nombre, apellidos, email, telefono, address, ciudad, preferred_property_type, budget_min, budget_max, notes, tags } = req.body;

    const updates = [];
    const params = [];

    if (nombre !== undefined) { updates.push('nombre = ?'); params.push(nombre); }
    if (apellidos !== undefined) { updates.push('apellidos = ?'); params.push(apellidos); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email); }
    if (telefono !== undefined) { updates.push('telefono = ?'); params.push(telefono); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (ciudad !== undefined) { updates.push('ciudad = ?'); params.push(ciudad); }
    if (preferred_property_type !== undefined) { updates.push('preferred_property_type = ?'); params.push(preferred_property_type); }
    if (budget_min !== undefined) { updates.push('budget_min = ?'); params.push(budget_min); }
    if (budget_max !== undefined) { updates.push('budget_max = ?'); params.push(budget_max); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);
    params.push(client_id);

    await dbRun(
      `UPDATE contacts SET ${updates.join(', ')} WHERE id = ? AND client_id = ?`,
      params
    );

    const contact = await dbGet('SELECT * FROM contacts WHERE id = ?', [id]);
    console.log(`✅ Contact updated: ${id}`);
    res.json(contact);
  } catch (err) {
    console.error('❌ Error updating contact:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/crm/contacts/:id - Delete contact
app.delete('/api/crm/contacts/:id', async (req, res) => {
  try {
    const { client_id } = req.user;
    const { id } = req.params;

    await dbRun(
      'DELETE FROM contacts WHERE id = ? AND client_id = ?',
      [id, client_id]
    );

    console.log(`✅ Contact deleted: ${id}`);
    res.json({ success: true, message: 'Contact eliminado' });
  } catch (err) {
    console.error('❌ Error deleting contact:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─ PROPIEDADES: CRUD Endpoints ─

// GET /api/paula/properties - Get Paula's properties (simple endpoint, no auth required)
app.get('/api/paula/properties', async (req, res) => {
  try {
    console.log('[API] Fetching Paula properties...');

    // Get properties with active status only (Disponible or Reservada)
    const properties = await dbAll(
      `SELECT id, client_id, titulo, direccion, tipo, precio_venta, precio_alquiler, habitaciones, banos, metros_cuadrados, unidad_superficie, zona, ciudad, descripcion, caracteristicas, estado, latitud, longitud, created_at, updated_at FROM properties WHERE estado IN ('Disponible', 'Reservada') ORDER BY created_at DESC`,
      []
    );

    console.log(`[API] Found ${properties.length} properties`);

    const propertiesWithImages = await Promise.all(properties.map(async (prop) => {
      const images = await dbAll(
        `SELECT id, property_id, filename, orden FROM property_images WHERE property_id = ? ORDER BY orden ASC`,
        [prop.id]
      );

      // Geocode si faltan coords
      let lat = prop.latitud, lng = prop.longitud;
      if (lat == null || lng == null) {
        const addr = [prop.zona, 'Tenerife, España'].filter(Boolean).join(', ');
        const coords = await geocodeAddress(addr);
        if (coords) {
          lat = coords.lat; lng = coords.lng;
          await dbRun('UPDATE properties SET latitud = ?, longitud = ? WHERE id = ?', [lat, lng, prop.id]);
        }
      }
      // Jitter determinista para evitar marcadores apilados
      if (lat != null && lng != null) {
        const seed = prop.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        lat += ((seed % 100) - 50) / 10000;
        lng += (((seed * 7) % 100) - 50) / 10000;
      }

      const photoArr = images.map(img => ({
        id: img.id,
        name: img.filename,
        filename: img.filename,
        url: `/propiedades/${prop.id}/imagenes/${img.filename}`
      }));

      let caracteristicas = [];
      try { caracteristicas = JSON.parse(prop.caracteristicas || '[]'); } catch {}

      const type = prop.precio_alquiler && !prop.precio_venta ? 'alquiler' : 'compra';
      const kindMap = { piso: 'Piso', casa: 'Casa', villa: 'Villa', atico: 'Ático', chalet: 'Chalet', duplex: 'Dúplex', local: 'Local', terreno: 'Terreno' };
      const kind = kindMap[prop.tipo] || (prop.tipo ? (prop.tipo.charAt(0).toUpperCase() + prop.tipo.slice(1)) : 'Piso');

      return {
        // Shape adaptado a la web pública (app.jsx + components.jsx)
        id: prop.id,
        title: prop.titulo,
        type,
        kind,
        price: prop.precio_venta || prop.precio_alquiler || 0,
        rooms: prop.habitaciones || 0,
        baths: prop.banos || 0,
        m2: prop.metros_cuadrados || 0,
        unidad_superficie: prop.unidad_superficie || 'm²',
        area: prop.zona || '',
        city: prop.ciudad || 'Tenerife',
        description: prop.descripcion || '',
        address: prop.direccion || '',
        lat: lat || 28.28,
        lng: lng || -16.55,
        photo: photoArr[0]?.url || null,
        photos: photoArr,
        images: photoArr,
        features: caracteristicas,
        tone: 45,
        tag: prop.estado || 'disponible',
        // Campos raw también (para el CRM que consume el mismo endpoint)
        titulo: prop.titulo,
        precio_venta: prop.precio_venta,
        precio_alquiler: prop.precio_alquiler,
        habitaciones: prop.habitaciones,
        banos: prop.banos,
        metros_cuadrados: prop.metros_cuadrados,
        zona: prop.zona,
        descripcion: prop.descripcion,
        tipo: prop.tipo,
        estado: prop.estado,
        direccion: prop.direccion,
        unidad_superficie: prop.unidad_superficie || 'm²',
        ciudad: prop.ciudad || '',
      };
    }));

    res.json({ properties: propertiesWithImages, total: propertiesWithImages.length });
  } catch (err) {
    console.error('❌ Error fetching Paula properties:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/crm/properties - List all properties for a client
app.get('/api/crm/properties', async (req, res) => {
  try {
    const { client_id } = req.user || { client_id: null };
    const { limit = 50, offset = 0 } = req.query;

    // Fix caracteristicas for all properties first
    await dbRun(`UPDATE properties SET caracteristicas = '[]' WHERE caracteristicas IS NULL OR caracteristicas = '' OR caracteristicas LIKE '%[object Object]%'`);

    const properties = await dbAll(
      `SELECT id, client_id, titulo, direccion, tipo, precio_venta, precio_alquiler, habitaciones, banos, metros_cuadrados, zona, descripcion, caracteristicas, estado, created_at, updated_at FROM properties WHERE client_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [client_id, parseInt(limit), parseInt(offset)]
    );

    // Get images for each property
    const propertiesWithImages = await Promise.all(properties.map(async (prop) => {
      const images = await dbAll(
        `SELECT * FROM property_images WHERE property_id = ? ORDER BY orden ASC`,
        [prop.id]
      );
      let caracteristicas = [];
      try {
        const carac = prop.caracteristicas || '[]';
        if (typeof carac === 'string') {
          caracteristicas = JSON.parse(carac);
        } else if (Array.isArray(carac)) {
          caracteristicas = carac;
        } else {
          caracteristicas = [];
        }
      } catch (e) {
        console.warn(`Failed to parse caracteristicas for ${prop.id}:`, e.message);
        caracteristicas = [];
      }
      // Filter out null/undefined values
      if (!Array.isArray(caracteristicas)) caracteristicas = [];
      return { ...prop, images, caracteristicas };
    }));

    const total = await dbGet(
      'SELECT COUNT(*) as count FROM properties WHERE client_id = ?',
      [client_id]
    );

    // Safely return response
    const response = {
      properties: (propertiesWithImages || []).map(p => {
        return {
          id: String(p.id || ''),
          client_id: String(p.client_id || ''),
          titulo: String(p.titulo || ''),
          direccion: String(p.direccion || ''),
          tipo: String(p.tipo || ''),
          precio_venta: Number(p.precio_venta) || null,
          precio_alquiler: Number(p.precio_alquiler) || null,
          habitaciones: Number(p.habitaciones) || 0,
          banos: Number(p.banos) || 0,
          metros_cuadrados: Number(p.metros_cuadrados) || 0,
          zona: String(p.zona || ''),
          descripcion: String(p.descripcion || ''),
          caracteristicas: Array.isArray(p.caracteristicas) ? p.caracteristicas : [],
          estado: String(p.estado || ''),
          created_at: String(p.created_at || ''),
          updated_at: String(p.updated_at || ''),
          images: Array.isArray(p.images) ? p.images : []
        };
      }),
      total: Number(total.count) || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    res.json(response);
  } catch (err) {
    console.error('❌ Error fetching properties:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crm/properties - Create new property
app.post('/api/crm/properties', async (req, res) => {
  try {
    const client_id = req.user?.client_id || 'default-client';
    const { titulo, direccion, tipo, precio_venta, precio_alquiler, habitaciones, banos, metros_cuadrados, zona, ciudad, descripcion, caracteristicas, unidad_superficie } = req.body;

    if (!titulo) {
      return res.status(400).json({ error: 'título es requerido' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    const finalDireccion = direccion || zona || ciudad || 'Por completar';

    // Geocode la dirección antes de guardar (best-effort, no bloquea si falla)
    const addrForGeo = [zona, ciudad, 'Tenerife, España'].filter(Boolean).join(', ');
    const coords = await geocodeAddress(addrForGeo);

    await dbRun(
      `INSERT INTO properties (id, client_id, titulo, direccion, tipo, precio_venta, precio_alquiler, habitaciones, banos, metros_cuadrados, zona, ciudad, descripcion, caracteristicas, unidad_superficie, latitud, longitud, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, client_id, titulo, finalDireccion, tipo, precio_venta || null, precio_alquiler || null,
        habitaciones || null, banos || null, metros_cuadrados || null, zona || ciudad, ciudad || null, descripcion,
        JSON.stringify(caracteristicas || []), unidad_superficie || 'm²', coords?.lat || null, coords?.lng || null, now, now
      ]
    );

    console.log(`✅ Propiedad creada: ${titulo}`);
    const property = await dbGet('SELECT * FROM properties WHERE id = ?', [id]);
    res.status(201).json({ ...property, caracteristicas: (() => { try { return JSON.parse(property.caracteristicas || '[]'); } catch { return []; } })() });
  } catch (err) {
    console.error('❌ Error creating property:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/crm/properties/:id - Get property detail with images
app.get('/api/crm/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const property = await dbGet('SELECT * FROM properties WHERE id = ?', [id]);

    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    const images = await dbAll(
      'SELECT * FROM property_images WHERE property_id = ? ORDER BY orden ASC',
      [id]
    );

    res.json({ ...property, caracteristicas: (() => { try { return JSON.parse(property.caracteristicas || '[]'); } catch { return []; } })(), images });
  } catch (err) {
    console.error('❌ Error fetching property:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/crm/properties/:id - Update property
app.patch('/api/crm/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, direccion, tipo, precio_venta, precio_alquiler, habitaciones, banos, metros_cuadrados, zona, ciudad, descripcion, estado, caracteristicas, unidad_superficie } = req.body;

    const updates = [];
    const params = [];

    if (unidad_superficie !== undefined) { updates.push('unidad_superficie = ?'); params.push(unidad_superficie); }
    if (titulo !== undefined) { updates.push('titulo = ?'); params.push(titulo); }
    if (direccion !== undefined) { updates.push('direccion = ?'); params.push(direccion); }
    if (tipo !== undefined) { updates.push('tipo = ?'); params.push(tipo); }
    if (precio_venta !== undefined) { updates.push('precio_venta = ?'); params.push(precio_venta); }
    if (precio_alquiler !== undefined) { updates.push('precio_alquiler = ?'); params.push(precio_alquiler); }
    if (habitaciones !== undefined) { updates.push('habitaciones = ?'); params.push(habitaciones); }
    if (banos !== undefined) { updates.push('banos = ?'); params.push(banos); }
    if (metros_cuadrados !== undefined) { updates.push('metros_cuadrados = ?'); params.push(metros_cuadrados); }
    if (zona !== undefined) { updates.push('zona = ?'); params.push(zona); }
    if (ciudad !== undefined) { updates.push('ciudad = ?'); params.push(ciudad); }
    if (descripcion !== undefined) { updates.push('descripcion = ?'); params.push(descripcion); }
    if (estado !== undefined) { updates.push('estado = ?'); params.push(estado); }
    if (caracteristicas !== undefined) { updates.push('caracteristicas = ?'); params.push(JSON.stringify(caracteristicas)); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Re-geocode si cambian zona o ciudad
    if (zona !== undefined || ciudad !== undefined) {
      const current = await dbGet('SELECT zona FROM properties WHERE id = ?', [id]);
      const addrForGeo = [zona ?? current?.zona, ciudad || 'Tenerife, España'].filter(Boolean).join(', ');
      const coords = await geocodeAddress(addrForGeo);
      if (coords) {
        updates.push('latitud = ?'); params.push(coords.lat);
        updates.push('longitud = ?'); params.push(coords.lng);
      }
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await dbRun(
      `UPDATE properties SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const property = await dbGet('SELECT * FROM properties WHERE id = ?', [id]);
    console.log(`✅ Propiedad actualizada: ${id}`);
    res.json({ ...property, caracteristicas: (() => { try { return JSON.parse(property.caracteristicas || '[]'); } catch { return []; } })() });
  } catch (err) {
    console.error('❌ Error updating property:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/crm/properties/:id - Delete property
app.delete('/api/crm/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Borrar imágenes en disco
    const propertyFolder = path.join(UPLOADS_DIR, id);
    if (fs.existsSync(propertyFolder)) {
      fs.rmSync(propertyFolder, { recursive: true, force: true });
    }

    await dbRun('DELETE FROM property_images WHERE property_id = ?', [id]);
    await dbRun('DELETE FROM properties WHERE id = ?', [id]);

    console.log(`✅ Propiedad eliminada: ${id}`);
    res.json({ success: true, message: 'Propiedad eliminada' });
  } catch (err) {
    console.error('❌ Error deleting property:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crm/properties/:id/images - Upload image for property (base64)
app.post('/api/crm/properties/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const { filename, base64, orden = 0 } = req.body;

    const property = await dbGet('SELECT * FROM properties WHERE id = ?', [id]);
    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    // Crear carpeta si no existe
    const propertyFolder = path.join(UPLOADS_DIR, id, 'imagenes');
    if (!fs.existsSync(propertyFolder)) {
      fs.mkdirSync(propertyFolder, { recursive: true });
    }

    // Guardar imagen en filesystem
    const filepath = path.join(propertyFolder, filename);
    const buffer = Buffer.from(base64, 'base64');
    fs.writeFileSync(filepath, buffer);

    // Guardar en BD
    const imageId = uuidv4();
    await dbRun(
      `INSERT INTO property_images (id, property_id, filename, orden) VALUES (?, ?, ?, ?)`,
      [imageId, id, filename, orden]
    );

    console.log(`✅ Imagen guardada: ${filename} en ${propertyFolder}`);
    res.status(201).json({ id: imageId, filename, orden, url: `/propiedades/${id}/imagenes/${filename}` });
  } catch (err) {
    console.error('❌ Error uploading image:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/crm/properties/:id/images/:imageId - Eliminar una imagen
app.delete('/api/crm/properties/:id/images/:imageId', async (req, res) => {
  try {
    const { id, imageId } = req.params;
    const img = await dbGet('SELECT * FROM property_images WHERE id = ? AND property_id = ?', [imageId, id]);
    if (!img) return res.status(404).json({ error: 'Imagen no encontrada' });

    const filepath = path.join(UPLOADS_DIR, id, 'imagenes', img.filename);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    await dbRun('DELETE FROM property_images WHERE id = ?', [imageId]);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting image:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crm/properties/bulk-import - Import multiple properties at once
app.post('/api/crm/properties/bulk-import', async (req, res) => {
  try {
    const { client_id } = req.user;
    const { properties } = req.body;

    if (!Array.isArray(properties) || properties.length === 0) {
      return res.status(400).json({ error: 'properties array required' });
    }

    const results = [];
    for (const prop of properties) {
      const {
        titulo,
        direccion,
        tipo = 'piso',
        precio_venta,
        precio_alquiler,
        habitaciones = 0,
        banos = 0,
        metros_cuadrados = 0,
        zona = '',
        descripcion = '',
        caracteristicas = ''
      } = prop;

      if (!titulo || !direccion) {
        continue; // Skip if missing required fields
      }

      const id = uuidv4();
      try {
        await dbRun(
          `INSERT INTO properties (id, client_id, titulo, direccion, tipo, precio_venta, precio_alquiler, habitaciones, banos, metros_cuadrados, zona, descripcion, caracteristicas, estado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            client_id,
            titulo,
            direccion,
            tipo,
            precio_venta ? parseInt(precio_venta) : null,
            precio_alquiler ? parseInt(precio_alquiler) : null,
            habitaciones,
            banos,
            metros_cuadrados,
            zona,
            descripcion,
            typeof caracteristicas === 'string' ? JSON.stringify([caracteristicas]) : JSON.stringify(caracteristicas || []),
            'activa'
          ]
        );
        results.push({ id, titulo, status: 'created' });
      } catch (err) {
        results.push({ titulo, status: 'error', error: err.message });
      }
    }

    console.log(`✅ Bulk import completed: ${results.filter(r => r.status === 'created').length}/${properties.length}`);
    res.status(201).json({ imported: results.filter(r => r.status === 'created').length, total: properties.length, results });
  } catch (err) {
    console.error('❌ Error bulk importing properties:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────

// GET /api/crm/visits — List visits for a client
app.get('/api/crm/visits', (req, res) => {
  try {
    const { client_id, lead_id, from, to } = req.query;
    if (!client_id) return res.status(400).json({ error: 'client_id required' });

    let sql = `SELECT v.*, COALESCE(TRIM(l.nombre || ' ' || COALESCE(l.apellidos,'')), v.title, 'Lead') AS lead_name
      FROM visits v LEFT JOIN leads l ON v.lead_id = l.id
      WHERE v.client_id = ? AND v.status != 'cancelada'`;
    const params = [client_id];

    if (lead_id) {
      sql += ' AND v.lead_id = ?';
      params.push(lead_id);
    }
    if (from && to) {
      sql += ' AND v.scheduled_for BETWEEN ? AND ?';
      params.push(from, to);
    }
    sql += ' ORDER BY v.scheduled_for ASC';

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ visits: rows || [] });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crm/visits — Create a new visit
app.post('/api/crm/visits', (req, res) => {
  try {
    const { client_id, lead_id, property_id, scheduled_for, title, notes, duration_minutes } = req.body;
    if (!client_id || !lead_id || !scheduled_for) {
      return res.status(400).json({ error: 'client_id, lead_id, scheduled_for required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO visits (id, client_id, lead_id, property_id, scheduled_for, title, notes, duration_minutes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'programada', ?, ?)`,
      [id, client_id, lead_id, property_id || null, scheduled_for, title || '', notes || '', duration_minutes || 30, now, now],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.get('SELECT * FROM visits WHERE id = ?', [id], (err, visit) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json(visit);
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/crm/visits/:id — Update a visit
app.patch('/api/crm/visits/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { scheduled_for, title, notes, duration_minutes, status } = req.body;

    const updates = [];
    const params = [];

    if (scheduled_for) { updates.push('scheduled_for = ?'); params.push(scheduled_for); }
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    if (duration_minutes !== undefined) { updates.push('duration_minutes = ?'); params.push(duration_minutes); }
    if (status) { updates.push('status = ?'); params.push(status); }

    if (updates.length === 0) return res.json({ message: 'No updates' });

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    db.run(
      `UPDATE visits SET ${updates.join(', ')} WHERE id = ?`,
      params,
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        db.get('SELECT * FROM visits WHERE id = ?', [id], (err, visit) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(visit);
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/crm/visits/:id — Delete a visit
app.delete('/api/crm/visits/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.run('UPDATE visits SET status = "cancelada", updated_at = ? WHERE id = ?', [new Date().toISOString(), id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────

// ─ CAPTACIONES: solicitudes "Vende tu propiedad" (web) + manuales (CRM) ─

// GET /api/crm/captaciones — listar captaciones
app.get('/api/crm/captaciones', async (req, res) => {
  try {
    const client_id = req.user?.client_id || 'default-client';
    const rows = await dbAll(
      'SELECT * FROM captaciones WHERE client_id = ? ORDER BY created_at DESC',
      [client_id]
    );
    res.json({ captaciones: rows || [] });
  } catch (err) {
    console.error('❌ Error fetching captaciones:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crm/captaciones — crear captación (web o CRM) + lead propietario en la base de datos
app.post('/api/crm/captaciones', async (req, res) => {
  try {
    const client_id = req.user?.client_id || 'default-client';
    const {
      propietario, email, telefono, tipo, direccion, ciudad,
      metros_cuadrados, habitaciones, banos, notas, estimado, origin,
    } = req.body;

    if (!propietario && !email) {
      return res.status(400).json({ error: 'propietario o email requerido' });
    }

    const now = new Date().toISOString();

    // 1) Crear lead propietario → aparece en Base de Datos
    const leadId = uuidv4();
    const partes = (propietario || '').trim().split(' ');
    const nombre = partes[0] || propietario || 'Propietario';
    const apellidos = partes.slice(1).join(' ');
    const leadNotas = `Propietario · Quiere vender ${tipo || 'propiedad'}${ciudad ? ' en ' + ciudad : ''}${direccion ? ' (' + direccion + ')' : ''}.${notas ? ' ' + notas : ''}`;
    await dbRun(
      `INSERT INTO leads (id, client_id, nombre, apellidos, email, telefono, origin, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'captacion', 'nuevo', ?, ?, ?)`,
      [leadId, client_id, nombre, apellidos, email || '', telefono || '', leadNotas, now, now]
    );

    // 2) Crear captación
    const id = uuidv4();
    await dbRun(
      `INSERT INTO captaciones (id, client_id, lead_id, propietario, email, telefono, tipo, direccion, ciudad, metros_cuadrados, habitaciones, banos, notas, estado, estimado, origin, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?, ?, ?)`,
      [
        id, client_id, leadId, propietario || nombre, email || '', telefono || '',
        tipo || 'Piso', direccion || '', ciudad || '', metros_cuadrados || null,
        habitaciones || null, banos || null, notas || '', estimado || null, origin || 'manual', now, now,
      ]
    );

    const captacion = await dbGet('SELECT * FROM captaciones WHERE id = ?', [id]);
    console.log(`✅ Captación creada (${origin || 'manual'}): ${propietario || email}`);
    res.status(201).json(captacion);
  } catch (err) {
    console.error('❌ Error creating captación:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/crm/captaciones/:id — editar captación
app.patch('/api/crm/captaciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = ['propietario', 'email', 'telefono', 'tipo', 'direccion', 'ciudad',
      'metros_cuadrados', 'habitaciones', 'banos', 'notas', 'estado', 'estimado'];
    const updates = [];
    const params = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) { updates.push(`${k} = ?`); params.push(req.body[k]); }
    }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);
    await dbRun(`UPDATE captaciones SET ${updates.join(', ')} WHERE id = ?`, params);
    const captacion = await dbGet('SELECT * FROM captaciones WHERE id = ?', [id]);
    res.json(captacion);
  } catch (err) {
    console.error('❌ Error updating captación:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/crm/captaciones/:id — eliminar captación
app.delete('/api/crm/captaciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM captaciones WHERE id = ?', [id]);
    console.log(`🗑️ Captación eliminada: ${id}`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting captación:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/crm/captaciones/:id/convertir — pasar a Propiedad y quitar de captaciones
app.post('/api/crm/captaciones/:id/convertir', async (req, res) => {
  try {
    const client_id = req.user?.client_id || 'default-client';
    const { id } = req.params;
    const cap = await dbGet('SELECT * FROM captaciones WHERE id = ?', [id]);
    if (!cap) return res.status(404).json({ error: 'Captación no encontrada' });

    const propId = uuidv4();
    const now = new Date().toISOString();
    const titulo = `${cap.tipo || 'Propiedad'}${cap.ciudad ? ' en ' + cap.ciudad : ''}`;
    const tipoLower = (cap.tipo || 'piso').toLowerCase().split(' ')[0];
    const zona = cap.ciudad || cap.direccion || '';

    let coords = null;
    try {
      coords = await geocodeAddress([cap.direccion, cap.ciudad, 'Tenerife, España'].filter(Boolean).join(', '));
    } catch {}

    await dbRun(
      `INSERT INTO properties (id, client_id, titulo, direccion, tipo, precio_venta, precio_alquiler, habitaciones, banos, metros_cuadrados, zona, ciudad, descripcion, caracteristicas, unidad_superficie, latitud, longitud, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'm²', ?, ?, ?, ?)`,
      [
        propId, client_id, titulo, cap.direccion || zona || 'Por completar', tipoLower,
        cap.estimado || null, null, cap.habitaciones || null, cap.banos || null,
        cap.metros_cuadrados || null, zona, cap.ciudad || null, cap.notas || '', JSON.stringify([]),
        coords?.lat || null, coords?.lng || null, now, now,
      ]
    );

    // Quitar de captaciones
    await dbRun('DELETE FROM captaciones WHERE id = ?', [id]);

    const property = await dbGet('SELECT * FROM properties WHERE id = ?', [propId]);
    console.log(`✅ Captación convertida en propiedad: ${titulo}`);
    res.status(201).json({ property, removedCaptacionId: id });
  } catch (err) {
    console.error('❌ Error converting captación:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────

// ─ CRM ROUTING ─
app.get('/crm', (req, res) => {
  const crmPath = path.join(__dirname, 'crm.html');
  res.sendFile(crmPath);
});

app.get('/crm/*', (req, res) => {
  // Serve crm.html for all /crm/* routes (for client-side routing)
  const crmPath = path.join(__dirname, 'crm.html');
  res.sendFile(crmPath);
});

// ─ CATCH-ALL ─
app.get('*', (req, res) => {
  // Servir PG.html (public web)
  const indexPath = path.join(__dirname, 'PG.html');
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`🚀 PG Server running on http://localhost:${PORT}`);
  console.log(`📊 CRM: http://localhost:${PORT}/crm`);
  console.log(`🌐 Web: http://localhost:${PORT}/`);
  // Google Sheets/Drive desactivado - Solo usando CRM (SQLite)
});
