-- Migration: Create generic events table to replace/extend visits
-- Supports: visits, meetings, tasks, personal events

-- ─ TABLE: events (Eventos genericos: visitas, reuniones, tareas, personales) ─
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  type TEXT DEFAULT 'visit', -- 'visit' | 'meeting' | 'task' | 'personal'
  lead_id TEXT,
  property_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_for DATETIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  color TEXT, -- Visual: 'blue' (visit) | 'orange' (meeting) | 'green' (task) | 'gray' (personal)
  status TEXT DEFAULT 'programada', -- 'programada' | 'completada' | 'cancelada'
  notes TEXT,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(client_id) REFERENCES clients(id),
  FOREIGN KEY(lead_id) REFERENCES leads(id),
  FOREIGN KEY(property_id) REFERENCES properties(id)
);

CREATE INDEX IF NOT EXISTS idx_events_client_id ON events(client_id);
CREATE INDEX IF NOT EXISTS idx_events_lead_id ON events(lead_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_scheduled_for ON events(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
