-- Tabla de operaciones (ventas y alquileres) para historial independiente del estado actual
CREATE TABLE IF NOT EXISTS property_operations (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('sale', 'rental')), -- 'sale' o 'rental'
  operation_date TEXT NOT NULL, -- fecha de venta o inicio de alquiler (ISO 8601)
  end_date TEXT, -- fecha final (solo para alquileres cerrados)
  operation_price REAL NOT NULL, -- precio final de venta o precio mensual de alquiler
  commission_type TEXT NOT NULL CHECK (commission_type IN ('percentage', 'fixed')), -- 'percentage' o 'fixed'
  commission_percentage REAL, -- porcentaje si commission_type = 'percentage'
  commission_fixed_amount REAL, -- importe fijo si commission_type = 'fixed'
  commission_amount REAL NOT NULL, -- comisión calculada (resultado final)
  income_frequency TEXT NOT NULL CHECK (income_frequency IN ('once', 'monthly')), -- 'once' para ventas, 'monthly' para alquileres
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')), -- 'active' para alquileres en curso, 'closed' para cerrados
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (property_id) REFERENCES properties(id)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_property_operations_client_id ON property_operations(client_id);
CREATE INDEX idx_property_operations_property_id ON property_operations(property_id);
CREATE INDEX idx_property_operations_operation_date ON property_operations(operation_date);
CREATE INDEX idx_property_operations_operation_type ON property_operations(operation_type);
CREATE INDEX idx_property_operations_status ON property_operations(status);
