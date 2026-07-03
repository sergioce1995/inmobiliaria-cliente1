// Script de limpieza: elimina leads duplicados por email, manteniendo el más reciente

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'pg.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error conectando BD:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a:', DB_PATH);
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

async function cleanup() {
  try {
    console.log('\n📊 ANÁLISIS DE DUPLICADOS\n');

    // 1. Encontrar emails duplicados
    const duplicates = await dbAll(`
      SELECT email, COUNT(*) as cnt, GROUP_CONCAT(id) as ids
      FROM leads
      WHERE email IS NOT NULL AND email != ''
      GROUP BY email
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC
    `);

    if (duplicates.length === 0) {
      console.log('✅ No hay duplicados. Base de datos limpia.');
      db.close();
      return;
    }

    console.log(`⚠️  Encontrados ${duplicates.length} grupos de leads duplicados:`);
    duplicates.forEach((dup) => {
      console.log(`   • ${dup.email}: ${dup.cnt} registros (ids: ${dup.ids})`);
    });

    console.log('\n🔄 LIMPIEZA EN PROGRESO...\n');

    let totalDeleted = 0;
    let totalMerged = 0;

    // 2. Para cada grupo de duplicados
    for (const dup of duplicates) {
      const ids = dup.ids.split(',').map(id => id.trim());

      // Obtener todos los registros duplicados ordenados por fecha (más reciente primero)
      const records = await dbAll(
        `SELECT id, created_at FROM leads WHERE id IN (${ids.map(() => '?').join(',')})
         ORDER BY created_at DESC`,
        ids
      );

      if (records.length === 0) {
        console.log(`   ⚠️ No se encontraron registros para email: ${dup.email}`);
        continue;
      }

      // El primero (más reciente) se mantiene
      const keepId = records[0].id;
      const deleteIds = records.slice(1).map(r => r.id);

      console.log(`   • Email: ${dup.email}`);
      console.log(`     Manteniendo: id=${keepId} (${records[0].created_at})`);
      console.log(`     Eliminando: ids=[${deleteIds.join(', ')}]`);

      // Reasignar intereses de los duplicados al registro que se mantiene
      for (const delId of deleteIds) {
        // Obtener intereses del registro que se va a eliminar
        const intereses = await dbAll(
          'SELECT * FROM intereses WHERE lead_id = ?',
          [delId]
        );

        // Transferir cada interés
        for (const interes of intereses) {
          // Verificar si ya existe un interés del lead que se mantiene para la misma propiedad
          const existing = await dbAll(
            'SELECT id FROM intereses WHERE lead_id = ? AND property_id = ?',
            [keepId, interes.property_id]
          );

          if (existing.length === 0) {
            // No existe, actualizar el interés para apuntar al lead que se mantiene
            await dbRun(
              'UPDATE intereses SET lead_id = ? WHERE id = ?',
              [keepId, interes.id]
            );
            totalMerged++;
          } else {
            // Ya existe un interés para esta propiedad, eliminar el duplicado
            await dbRun('DELETE FROM intereses WHERE id = ?', [interes.id]);
          }
        }

        // Eliminar el lead duplicado
        await dbRun('DELETE FROM leads WHERE id = ?', [delId]);
        totalDeleted++;
      }

      console.log(`     ✓ Limpiado\n`);
    }

    console.log(`\n✅ LIMPIEZA COMPLETADA`);
    console.log(`   • Leads duplicados eliminados: ${totalDeleted}`);
    console.log(`   • Intereses reasignados: ${totalMerged}`);

    // Verificar resultado final
    const finalCount = await dbAll(`
      SELECT COUNT(DISTINCT email) as unique_emails,
             COUNT(*) as total_leads
      FROM leads
      WHERE email IS NOT NULL AND email != ''
    `);

    console.log(`\n📊 ESTADO FINAL:`);
    console.log(`   • Leads únicos por email: ${finalCount[0].unique_emails}`);
    console.log(`   • Total de leads: ${finalCount[0].total_leads}`);

    db.close();
    console.log('\n✅ Base de datos limpia y cerrada.');

  } catch (err) {
    console.error('\n❌ Error durante limpieza:', err.message);
    db.close();
    process.exit(1);
  }
}

cleanup();
