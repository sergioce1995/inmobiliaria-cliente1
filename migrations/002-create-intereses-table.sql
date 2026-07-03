-- ZADI CRM System - Database Schema Evolution
-- Migration: Create Intereses (Lead-Property relationships) table
-- This separates the concept of a Person (Lead) from their Interests in Properties

-- ─ TABLE: intereses (Lead-Property relationships) ─
CREATE TABLE IF NOT EXISTS intereses (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  lead_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  estado TEXT DEFAULT 'nuevo', -- 'nuevo' | 'contactado' | 'visita' | 'negociacion' | 'cerrado' | 'perdido'
  fecha_interes DATETIME DEFAULT CURRENT_TIMESTAMP,
  ultima_actividad DATETIME DEFAULT CURRENT_TIMESTAMP,
  notas TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id),
  FOREIGN KEY(lead_id) REFERENCES leads(id),
  FOREIGN KEY(property_id) REFERENCES properties(id),
  UNIQUE(lead_id, property_id) -- Un lead no puede tener dos intereses por la misma propiedad
);

CREATE INDEX IF NOT EXISTS idx_intereses_client_id ON intereses(client_id);
CREATE INDEX IF NOT EXISTS idx_intereses_lead_id ON intereses(lead_id);
CREATE INDEX IF NOT EXISTS idx_intereses_property_id ON intereses(property_id);
CREATE INDEX IF NOT EXISTS idx_intereses_estado ON intereses(estado);
CREATE INDEX IF NOT EXISTS idx_intereses_fecha_interes ON intereses(fecha_interes DESC);

-- ─ ALTER: Rename and adjust visits table to use interes_id ─
-- Add interes_id column to visits (nullable for now, for backwards compatibility)
ALTER TABLE visits ADD COLUMN interes_id TEXT DEFAULT NULL;

-- Create foreign key relationship (optional - depends on your requirements)
-- Note: This assumes visits will eventually have interes_id instead of direct lead_id+property_id
-- ALTER TABLE visits ADD FOREIGN KEY(interes_id) REFERENCES intereses(id);

-- ─ Update visits indexes ─
CREATE INDEX IF NOT EXISTS idx_visits_interes_id ON visits(interes_id);
