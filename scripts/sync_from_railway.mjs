import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const RAILWAY_URL = process.env.RAILWAY_URL || 'https://enfoque-app-production-545f.up.railway.app';
const DB_PATH = path.join(process.cwd(), 'data', 'enfoque.db');

async function syncFromRailway() {
  console.log(`📡 Conectando a Railway: ${RAILWAY_URL}...`);

  // 1. Sincronizar textos_sistema
  try {
    const resTextos = await fetch(`${RAILWAY_URL}/api/admin/textos`);
    if (!resTextos.ok) {
      throw new Error(`Error HTTP al obtener textos: ${resTextos.status}`);
    }
    const { textos } = await resTextos.json();

    const db = new DatabaseSync(DB_PATH);
    const updateStmt = db.prepare(`
      UPDATE textos_sistema 
      SET valor = ?, updated_at = ?, updated_by = ?
      WHERE clave = ?
    `);

    let updatedCount = 0;
    for (const t of textos) {
      if (t.updated_at) {
        updateStmt.run(t.valor, t.updated_at, t.updated_by || null, t.clave);
        updatedCount++;
      }
    }
    console.log(`✅ Textos del CMS sincronizados: ${updatedCount} textos personalizados traídos de Railway a local.`);

    // 2. Sincronizar snapshots
    try {
      const resSnapshots = await fetch(`${RAILWAY_URL}/api/snapshots`);
      if (resSnapshots.ok) {
        const { snapshots } = await resSnapshots.json();
        if (Array.isArray(snapshots) && snapshots.length > 0) {
          const insertSnapshotStmt = db.prepare(`
            INSERT OR REPLACE INTO dashboard_snapshots 
            (id, created_at, created_by, usuario_id, titulo, notas, stats_json, frentes_json, alerts_count, por_validar_total, requiere_decision, requiere_coordinacion, en_riesgo, sin_owner_claro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          let snapCount = 0;
          for (const s of snapshots) {
            insertSnapshotStmt.run(
              s.id,
              s.created_at || new Date().toISOString(),
              s.created_by || 'Administrador',
              s.usuario_id || null,
              s.titulo,
              s.notas || null,
              typeof s.stats === 'string' ? s.stats : JSON.stringify(s.stats || {}),
              typeof s.frentes === 'string' ? s.frentes : JSON.stringify(s.frentes || []),
              s.alerts_count || 0,
              s.por_validar_total || 0,
              s.requiere_decision || 0,
              s.requiere_coordinacion || 0,
              s.en_riesgo || 0,
              s.sin_owner_claro || 0
            );
            snapCount++;
          }
          console.log(`✅ Cortes de gobernanza (snapshots) sincronizados: ${snapCount} registros.`);
        }
      }
    } catch (e) {
      console.warn('⚠️ No se pudieron sincronizar snapshots:', e.message);
    }

    db.close();
    console.log('🎉 Sincronización Railway -> Localhost completada exitosamente.');
  } catch (err) {
    console.error('❌ Error al sincronizar desde Railway:', err);
    process.exit(1);
  }
}

syncFromRailway();
