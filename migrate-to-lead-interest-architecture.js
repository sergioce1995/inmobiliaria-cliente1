// Script de migración: estructura antigua → arquitectura Lead/Interest
// USO: node migrate-to-lead-interest-architecture.js --db=/ruta/a/pg.db [--dry-run]

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const dbPath = args.find(a => a.startsWith('--db='))?.split('=')[1] || path.join(__dirname, 'pg.db');
const dryRun = args.includes('--dry-run');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando BD:', err.message);
    process.exit(1);
  }
  console.log(`✅ Conectado a: ${dbPath}`);
  if (dryRun) console.log('⚙️  MODO DRY-RUN: sin cambios permanentes\n');
});

async function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function migrate() {
  try {
    console.log('📋 INICIANDO MIGRACIÓN: Estructura antigua → Lead/Interest\n');

    // 1. BACKUP
    console.log('1️⃣  BACKUP');
    if (!dryRun) {
      const fs = await import('fs/promises');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(__dirname, `pg.db.backup-${timestamp}`);
      const dbContent = await fs.readFile(dbPath);
      await fs.writeFile(backupPath, dbContent);
      console.log(`   ✅ Backup creado: ${backupPath}\n`);
    } else {
      console.log(`   ⚙️  (Backup omitido en --dry-run)\n`);
    }

    // 2. CREAR NUEVAS TABLAS si no existen
    console.log('2️⃣  CREAR TABLAS NUEVAS');

    // Tabla leads (nueva arquitectura)
    const leadsTableSQL = `
      CREATE TABLE IF NOT EXISTS leads (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        nombre TEXT,
        apellidos TEXT,
        email TEXT UNIQUE,
        telefono TEXT,
        status TEXT DEFAULT 'nuevo' CHECK(status IN ('nuevo', 'contactado', 'visita', 'negociacion', 'cerrado', 'perdido')),
        origin TEXT DEFAULT 'Web',
        source_property_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Tabla intereses (nueva arquitectura)
    const interesesTableSQL = `
      CREATE TABLE IF NOT EXISTS intereses (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        lead_id TEXT NOT NULL,
        property_id TEXT NOT NULL,
        estado TEXT DEFAULT 'nuevo' CHECK(estado IN ('nuevo', 'contactado', 'visita', 'negociacion', 'cerrado', 'perdido')),
        fecha_interes DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id),
        FOREIGN KEY (property_id) REFERENCES properties(id),
        UNIQUE(lead_id, property_id)
      )
    `;

    if (!dryRun) {
      await dbRun(leadsTableSQL);
      await dbRun(interesesTableSQL);
      console.log('   ✅ Tablas creadas/verificadas\n');
    } else {
      console.log('   ⚙️  (Tablas no modificadas en --dry-run)\n');
    }

    // 3. ANÁLISIS DE DATOS ANTIGUOS
    console.log('3️⃣  ANÁLISIS DE DATOS ANTIGUOS');

    // Verificar qué existe en la BD actual
    const tables = await dbAll(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    const tableNames = tables.map(t => t.name);
    console.log(`   Tablas encontradas: ${tableNames.join(', ')}\n`);

    // 4. MIGRACIÓN DE DATOS
    console.log('4️⃣  MIGRACIÓN DE DATOS');

    if (tableNames.includes('contacts') || tableNames.includes('leads')) {
      // Tabla antigua: contacts o leads (vieja arquitectura)
      const sourceTable = tableNames.includes('contacts') ? 'contacts' : 'leads';
      console.log(`   📥 Importando desde tabla: ${sourceTable}`);

      const oldLeads = await dbAll(`SELECT * FROM ${sourceTable}`);
      console.log(`   📊 Registros encontrados: ${oldLeads.length}\n`);

      if (oldLeads.length > 0 && !dryRun) {
        let migratedCount = 0;
        let duplicatesSkipped = 0;

        for (const oldLead of oldLeads) {
          // Generar ID si no existe
          const leadId = oldLead.id || `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Email única, deduplicar
          const email = oldLead.email || null;
          if (email) {
            const existing = await dbGet('SELECT id FROM leads WHERE email = ? AND client_id = ?',
              [email, oldLead.client_id || 'default-client']);
            if (existing) {
              duplicatesSkipped++;
              continue;
            }
          }

          try {
            await dbRun(`
              INSERT OR IGNORE INTO leads (id, client_id, nombre, apellidos, email, telefono, status, origin, source_property_id, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              leadId,
              oldLead.client_id || 'default-client',
              oldLead.nombre || oldLead.name || '',
              oldLead.apellidos || oldLead.surname || '',
              email,
              oldLead.telefono || oldLead.phone || '',
              oldLead.status || 'nuevo',
              oldLead.origin || 'Web',
              oldLead.source_property_id || null,
              oldLead.created_at || new Date().toISOString(),
              oldLead.updated_at || new Date().toISOString()
            ]);
            migratedCount++;
          } catch (err) {
            console.error(`   ⚠️  Error migrando lead ${oldLead.email}:`, err.message);
          }
        }
        console.log(`   ✅ Leads migrados: ${migratedCount}\n`);
        if (duplicatesSkipped > 0) {
          console.log(`   ⚠️  Duplicados por email omitidos: ${duplicatesSkipped}\n`);
        }
      }
    }

    // 5. CREAR INTERESES desde relaciones antiguas
    console.log('5️⃣  CREAR INTERESES DESDE PROPIEDADES ANTIGUAS');

    if (tableNames.includes('lead_properties') || tableNames.includes('interest_properties')) {
      const propTable = tableNames.includes('lead_properties') ? 'lead_properties' : 'interest_properties';
      const oldProps = await dbAll(`SELECT * FROM ${propTable}`);
      console.log(`   📥 Relaciones encontradas: ${oldProps.length}\n`);

      if (oldProps.length > 0 && !dryRun) {
        let createdCount = 0;

        for (const oldProp of oldProps) {
          try {
            const intresId = `intres_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await dbRun(`
              INSERT OR IGNORE INTO intereses (id, client_id, lead_id, property_id, estado, created_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `, [
              intresId,
              oldProp.client_id || 'default-client',
              oldProp.lead_id,
              oldProp.property_id,
              'nuevo', // estado por defecto (antiguas eran todas "nuevas")
              oldProp.created_at || new Date().toISOString()
            ]);
            createdCount++;
          } catch (err) {
            console.error(`   ⚠️  Error creando interés:`, err.message);
          }
        }
        console.log(`   ✅ Intereses creados: ${createdCount}\n`);
      }
    }

    // 6. CREAR INTERESES desde tabla captaciones
    console.log('6️⃣  CONVERTIR CAPTACIONES A INTERESES');

    if (tableNames.includes('captaciones')) {
      const captaciones = await dbAll('SELECT * FROM captaciones');
      console.log(`   📥 Captaciones encontradas: ${captaciones.length}\n`);

      if (captaciones.length > 0 && !dryRun) {
        let convertedCount = 0;

        for (const cap of captaciones) {
          try {
            // Crear lead para la captación si no existe
            const leadId = `lead_captacion_${cap.id}`;
            const existingLead = await dbGet('SELECT id FROM leads WHERE id = ?', [leadId]);

            if (!existingLead) {
              await dbRun(`
                INSERT INTO leads (id, client_id, nombre, email, telefono, status, origin, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                leadId,
                cap.client_id || 'default-client',
                cap.nombre || '',
                cap.email || null,
                cap.telefono || null,
                'nuevo',
                'captacion',
                cap.created_at || new Date().toISOString()
              ]);
            }

            // Crear interés si hay property_id
            if (cap.property_id) {
              const intresId = `intres_cap_${cap.id}`;
              await dbRun(`
                INSERT OR IGNORE INTO intereses (id, client_id, lead_id, property_id, estado, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
              `, [
                intresId,
                cap.client_id || 'default-client',
                leadId,
                cap.property_id,
                'nuevo',
                cap.created_at || new Date().toISOString()
              ]);
            }
            convertedCount++;
          } catch (err) {
            console.error(`   ⚠️  Error convirtiendo captación ${cap.id}:`, err.message);
          }
        }
        console.log(`   ✅ Captaciones convertidas: ${convertedCount}\n`);
      }
    }

    // 7. VALIDACIÓN FINAL
    console.log('7️⃣  VALIDACIÓN FINAL');

    if (!dryRun) {
      const leadCount = await dbGet('SELECT COUNT(*) as cnt FROM leads');
      const intresCount = await dbGet('SELECT COUNT(*) as cnt FROM intereses');
      const propCount = await dbGet('SELECT COUNT(*) as cnt FROM properties');

      console.log(`   📊 Leads después de migración: ${leadCount.cnt}`);
      console.log(`   📊 Intereses después de migración: ${intresCount.cnt}`);
      console.log(`   📊 Propiedades: ${propCount.cnt}\n`);

      // Validar integridad referencial
      const orphanIntereses = await dbGet(`
        SELECT COUNT(*) as cnt FROM intereses i
        WHERE NOT EXISTS (SELECT 1 FROM leads l WHERE l.id = i.lead_id)
      `);

      if (orphanIntereses.cnt > 0) {
        console.log(`   ⚠️  Advertencia: ${orphanIntereses.cnt} intereses sin lead asociado`);
      } else {
        console.log(`   ✅ Integridad referencial verificada`);
      }
    }

    console.log('\n✅ MIGRACIÓN COMPLETADA');
    if (dryRun) {
      console.log('   Ejecutar sin --dry-run para aplicar cambios permanentes');
    }

  } catch (err) {
    console.error('\n❌ ERROR DURANTE MIGRACIÓN:', err.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrate();
