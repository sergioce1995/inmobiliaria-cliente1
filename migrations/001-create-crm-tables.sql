-- ZADI CRM System - Database Schema
-- Migration: Create CRM tables for multi-tenant lead management

-- ─ TABLE: clients (Inmobiliarias) ─
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  plan TEXT DEFAULT 'starter', -- 'starter' | 'pro' | 'enterprise'
  google_sheet_id TEXT,
  google_drive_folder_id TEXT,
  logo_url TEXT,
  brand_colors TEXT, -- JSON: {primary, secondary, accent}
  custom_text TEXT, -- JSON: {crm_title, inbox_label, etc}
  trial_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─ TABLE: leads (Leads/Interesados) ─
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  nombre TEXT,
  apellidos TEXT,
  email TEXT,
  telefono TEXT,
  origin TEXT DEFAULT 'web_form', -- 'web_form' | 'saved_search' | 'agente_ia' | 'call' | 'import'
  source_property_id TEXT, -- Which property triggered interest
  status TEXT DEFAULT 'nuevo', -- 'nuevo' | 'contactado' | 'interesado' | 'cerrado' | 'perdido'
  assigned_to TEXT, -- Agent email
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id)
);

-- Create index for faster lead lookups
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- ─ TABLE: interactions (Call logs, emails, visits) ─
CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  type TEXT, -- 'call' | 'email' | 'message' | 'visit' | 'note'
  content TEXT,
  duration_minutes INTEGER, -- For calls only
  created_by TEXT, -- Agent email
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(lead_id) REFERENCES leads(id)
);

CREATE INDEX IF NOT EXISTS idx_interactions_lead_id ON interactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at DESC);

-- ─ TABLE: contacts (Contact Database/CRM Base de Datos) ─
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  nombre TEXT,
  apellidos TEXT,
  email TEXT,
  telefono TEXT,
  address TEXT,
  ciudad TEXT,
  preferred_property_type TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  notes TEXT,
  tags TEXT, -- JSON array: ['inversion', 'familia', 'urgente']
  last_contact DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);

-- ─ TABLE: property_shares (Tracking property sharing with leads) ─
CREATE TABLE IF NOT EXISTS property_shares (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  property_id TEXT, -- From Google Sheets
  lead_id TEXT,
  shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  shared_by TEXT, -- Agent email
  opened_count INTEGER DEFAULT 0,
  last_opened DATETIME,
  FOREIGN KEY(client_id) REFERENCES clients(id),
  FOREIGN KEY(lead_id) REFERENCES leads(id)
);

CREATE INDEX IF NOT EXISTS idx_property_shares_client_id ON property_shares(client_id);
CREATE INDEX IF NOT EXISTS idx_property_shares_lead_id ON property_shares(lead_id);

-- ─ TABLE: daily_insights (Pre-generated AI analyses) ─
CREATE TABLE IF NOT EXISTS daily_insights (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  date DATE,
  lead_summary TEXT, -- JSON: {total_new, contacted, status_breakdown, conversion_rate}
  top_properties TEXT, -- JSON: [{id, views, interests, trend}]
  recommendations TEXT, -- JSON: AI-generated actions
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_daily_insights_client_id ON daily_insights(client_id);
CREATE INDEX IF NOT EXISTS idx_daily_insights_date ON daily_insights(date DESC);

-- ─ TABLE: cron_logs (Job execution logs for debugging) ─
CREATE TABLE IF NOT EXISTS cron_logs (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  job_type TEXT, -- 'daily_insights' | 'property_match' | 'followup_reminder'
  status TEXT, -- 'success' | 'failed'
  message TEXT,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_cron_logs_client_id ON cron_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_cron_logs_executed_at ON cron_logs(executed_at DESC);

-- ─ TABLE: properties (Propiedades del cliente) ─
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  titulo TEXT NOT NULL,
  direccion TEXT NOT NULL,
  tipo TEXT, -- 'piso' | 'casa' | 'terreno' | 'local' | 'garaje'
  precio_venta INTEGER,
  precio_alquiler INTEGER,
  habitaciones INTEGER,
  banos INTEGER,
  metros_cuadrados REAL,
  zona TEXT,
  descripcion TEXT,
  caracteristicas TEXT, -- JSON array
  estado TEXT DEFAULT 'disponible', -- 'disponible' | 'vendido' | 'alquilado' | 'inactivo'
  imagen_principal TEXT, -- nombre de archivo
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id)
);

CREATE INDEX IF NOT EXISTS idx_properties_client_id ON properties(client_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

-- ─ TABLE: property_images (Imágenes por propiedad) ─
CREATE TABLE IF NOT EXISTS property_images (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  orden INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(property_id) REFERENCES properties(id)
);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);

-- ─ TABLE: visits (Citas / Visitas a propiedades) ─
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  property_id TEXT,
  scheduled_for DATETIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  title TEXT,
  notes TEXT,
  status TEXT DEFAULT 'programada', -- 'programada' | 'completada' | 'cancelada'
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id),
  FOREIGN KEY(lead_id) REFERENCES leads(id),
  FOREIGN KEY(property_id) REFERENCES properties(id)
);

CREATE INDEX IF NOT EXISTS idx_visits_client_id ON visits(client_id);
CREATE INDEX IF NOT EXISTS idx_visits_lead_id ON visits(lead_id);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_for ON visits(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);

-- ─ TABLE: captaciones (Solicitudes "Vende tu propiedad" — web + manual) ─
CREATE TABLE IF NOT EXISTS captaciones (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  lead_id TEXT, -- propietario asociado en tabla leads
  propietario TEXT,
  email TEXT,
  telefono TEXT,
  tipo TEXT, -- 'Piso' | 'Casa' | 'Villa' | ...
  direccion TEXT,
  ciudad TEXT,
  metros_cuadrados REAL,
  habitaciones INTEGER,
  banos INTEGER,
  notas TEXT,
  estado TEXT DEFAULT 'pendiente', -- 'pendiente' | 'valorada' | 'captada' | 'descartada'
  estimado INTEGER, -- valoración estimada en €
  origin TEXT DEFAULT 'manual', -- 'web' | 'manual'
  property_id TEXT, -- propiedad creada al convertir
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id),
  FOREIGN KEY(lead_id) REFERENCES leads(id)
);

CREATE INDEX IF NOT EXISTS idx_captaciones_client_id ON captaciones(client_id);
CREATE INDEX IF NOT EXISTS idx_captaciones_estado ON captaciones(estado);
CREATE INDEX IF NOT EXISTS idx_captaciones_created_at ON captaciones(created_at DESC);

-- ─ Note: la tabla `users` (acceso al CRM) se crea en server.js (ensureAdminUser) ─
-- ─ Note: saved_searches table already exists, keep as-is ─
-- The existing saved_searches table is compatible with multi-tenant architecture
-- (it already has client_id field from previous implementation)
