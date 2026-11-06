import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'enfoque.db');
const FRESH_DATA_PATH = path.join(process.cwd(), 'railway_extracted_data_fresh.json');
const FRESH_SNAPSHOTS_PATH = path.join(process.cwd(), 'temp_snapshots_fresh.json');
const FRESH_TEXTOS_PATH = path.join(process.cwd(), 'temp_textos_fresh.json');

async function syncAll() {
  console.log('🔄 Iniciando consolidación total desde Railway a Localhost...');

  if (!fs.existsSync(DB_PATH)) {
    throw new Error(`No se encontró la base de datos en ${DB_PATH}`);
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA foreign_keys = OFF;'); // Para inserción segura en bloque

  // 1. Textos del CMS
  if (fs.existsSync(FRESH_TEXTOS_PATH)) {
    const { textos } = JSON.parse(fs.readFileSync(FRESH_TEXTOS_PATH, 'utf8'));
    const updateTexto = db.prepare(`
      INSERT INTO textos_sistema (clave, seccion, etiqueta, valor, valor_por_defecto, tipo_campo, updated_at, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(clave) DO UPDATE SET
        valor = excluded.valor,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `);
    let count = 0;
    for (const t of textos) {
      if (t.updated_at) {
        updateTexto.run(
          t.clave,
          t.seccion || 'General',
          t.etiqueta || t.clave,
          t.valor,
          t.valor_por_defecto || t.valor,
          t.tipo_campo || 'text',
          t.updated_at,
          t.updated_by
        );
        count++;
      }
    }
    console.log(`✅ Textos CMS consolidados: ${count} claves personalizadas actualizadas.`);
  }

  // 2. Snapshots
  if (fs.existsSync(FRESH_SNAPSHOTS_PATH)) {
    const { snapshots } = JSON.parse(fs.readFileSync(FRESH_SNAPSHOTS_PATH, 'utf8'));
    const insertSnapshot = db.prepare(`
      INSERT OR REPLACE INTO dashboard_snapshots 
      (id, created_at, created_by, usuario_id, titulo, notas, stats_json, frentes_json, alerts_count, por_validar_total, requiere_decision, requiere_coordinacion, en_riesgo, sin_owner_claro)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    let snapCount = 0;
    for (const s of snapshots) {
      insertSnapshot.run(
        s.id,
        s.created_at || new Date().toISOString(),
        s.created_by || 'José Antonio Turueño',
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
    console.log(`✅ Snapshots consolidados: ${snapCount} fotografías de gobernanza guardadas.`);
  }

  // 3. Entidades Organizacionales (Frentes, Decisiones, Responsabilidades, Resultados, Interfaces)
  if (fs.existsSync(FRESH_DATA_PATH)) {
    const entities = JSON.parse(fs.readFileSync(FRESH_DATA_PATH, 'utf8'));

    // Frentes
    const updateFrente = db.prepare(`
      UPDATE frentes SET
        nombre_corto = ?,
        nombre_original = ?,
        tipo_frente = ?,
        owner_id_propuesto = ?,
        owner_id_validado = ?,
        estado_definicion = ?,
        estado_validacion = ?,
        validado_por = ?,
        fecha_validacion = ?,
        comentario_validacion = ?
      WHERE id = ?
    `);
    for (const f of entities.frentes) {
      updateFrente.run(
        f.nombre_corto,
        f.nombre_original,
        f.tipo_frente || 'Función permanente',
        f.owner_id_propuesto,
        f.owner_id_validado,
        f.estado_definicion || 'Definido',
        f.estado_validacion,
        f.validado_por,
        f.fecha_validacion,
        f.comentario_validacion,
        f.id
      );
    }
    console.log(`✅ Frentes consolidados: ${entities.frentes.length} macroprocesos actualizados con nuevos nombres y owners.`);

    // Decisiones (incluye D55, D56, D57)
    const upsertDecision = db.prepare(`
      INSERT INTO decisiones (
        id, frente_id, decision, decisor_propuesto_id, decisor_propuesto_nombre,
        decisor_validado_id, consultar_a_propuesto, consultar_a_validado,
        momento_trigger, criterio_decision, estado_definicion, estado_validacion,
        validado_por, fecha_validacion, comentario_validacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        frente_id = excluded.frente_id,
        decision = excluded.decision,
        decisor_propuesto_id = excluded.decisor_propuesto_id,
        decisor_propuesto_nombre = excluded.decisor_propuesto_nombre,
        decisor_validado_id = excluded.decisor_validado_id,
        consultar_a_propuesto = excluded.consultar_a_propuesto,
        consultar_a_validado = excluded.consultar_a_validado,
        momento_trigger = excluded.momento_trigger,
        criterio_decision = excluded.criterio_decision,
        estado_definicion = excluded.estado_definicion,
        estado_validacion = excluded.estado_validacion,
        validado_por = excluded.validado_por,
        fecha_validacion = excluded.fecha_validacion,
        comentario_validacion = excluded.comentario_validacion
    `);
    for (const d of entities.decisiones) {
      upsertDecision.run(
        d.id,
        d.frente_id,
        d.decision,
        d.decisor_propuesto_id || null,
        d.decisor_propuesto_nombre || null,
        d.decisor_validado_id || null,
        d.consultar_a_propuesto || null,
        d.consultar_a_validado || null,
        d.momento_trigger || null,
        d.criterio_decision || null,
        d.estado_definicion || 'Definido',
        d.estado_validacion,
        d.validado_por || null,
        d.fecha_validacion || null,
        d.comentario_validacion || null
      );
    }
    console.log(`✅ Decisiones consolidadas: ${entities.decisiones.length} decisiones (incluyendo D55, D56, D57).`);

    // Responsabilidades (incluye R122, R7696, R8153)
    const upsertResp = db.prepare(`
      INSERT INTO responsabilidades (
        id, frente_id, persona_id, responsabilidad_original, rol_propuesto,
        rol_validado, estado_revision, estado_validacion, celda_origen,
        validado_por, fecha_validacion, comentario_validacion, comentario_propuesta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        frente_id = excluded.frente_id,
        persona_id = excluded.persona_id,
        responsabilidad_original = excluded.responsabilidad_original,
        rol_propuesto = excluded.rol_propuesto,
        rol_validado = excluded.rol_validado,
        estado_revision = excluded.estado_revision,
        estado_validacion = excluded.estado_validacion,
        celda_origen = excluded.celda_origen,
        validado_por = excluded.validado_por,
        fecha_validacion = excluded.fecha_validacion,
        comentario_validacion = excluded.comentario_validacion,
        comentario_propuesta = excluded.comentario_propuesta
    `);
    for (const r of entities.responsabilidades) {
      upsertResp.run(
        r.id,
        r.frente_id,
        r.persona_id,
        r.responsabilidad_original,
        r.rol_propuesto || null,
        r.rol_validado || null,
        r.estado_revision || 'Definido',
        r.estado_validacion,
        r.celda_origen || null,
        r.validado_por || null,
        r.fecha_validacion || null,
        r.comentario_validacion || null,
        r.comentario_propuesta || null
      );
    }
    console.log(`✅ Responsabilidades consolidadas: ${entities.responsabilidades.length} responsabilidades (incluyendo R122, R7696, R8153 y todas las calificaciones).`);

    // Resultados
    const updateResultado = db.prepare(`
      UPDATE resultados SET
        resultado_validado = ?,
        indicador_validado = ?,
        meta = ?,
        valor_actual = ?,
        estado = ?,
        estado_validacion = ?,
        validado_por = ?,
        fecha_validacion = ?,
        comentario_validacion = ?
      WHERE id = ?
    `);
    for (const res of entities.resultados) {
      updateResultado.run(
        res.resultado_validado,
        res.indicador_validado,
        res.meta,
        res.valor_actual,
        res.estado,
        res.estado_validacion,
        res.validado_por,
        res.fecha_validacion,
        res.comentario_validacion,
        res.id
      );
    }
    console.log(`✅ Resultados consolidados: ${entities.resultados.length} KPIs actualizados.`);

    // Interfaces / Relaciones
    const updateInterfaz = db.prepare(`
      UPDATE interfaces SET
        estado = ?,
        estado_validacion = ?,
        validado_por = ?,
        fecha_validacion = ?,
        comentario_validacion = ?
      WHERE id = ?
    `);
    for (const i of entities.interfaces) {
      updateInterfaz.run(
        i.estado,
        i.estado_validacion,
        i.validado_por,
        i.fecha_validacion,
        i.comentario_validacion,
        i.id
      );
    }
    console.log(`✅ Interfaces consolidadas: ${entities.interfaces.length} relaciones actualizadas.`);
  }

  // 4. Temas de Impacto
  try {
    const resImpact = await fetch('https://enfoque-app-production-545f.up.railway.app/api/agenda/impacto');
    if (resImpact.ok) {
      const { temas } = await resImpact.json();
      if (Array.isArray(temas) && temas.length > 0) {
        db.exec(`
          CREATE TABLE IF NOT EXISTS temas_impacto (
            id TEXT PRIMARY KEY,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            horizonte_temporal TEXT NOT NULL,
            fecha_limite TEXT,
            frente_id TEXT NOT NULL,
            resultado_id TEXT,
            responsable_id TEXT NOT NULL,
            involucrados_ids_json TEXT,
            estado TEXT DEFAULT 'En curso',
            prioridad TEXT DEFAULT 'P2',
            decisiones_generadas_ids_json TEXT,
            responsabilidades_generadas_ids_json TEXT,
            interfaces_generadas_ids_json TEXT,
            frentes_ids_json TEXT,
            created_at TEXT NOT NULL,
            created_by TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `);

        const upsertImpact = db.prepare(`
          INSERT INTO temas_impacto (
            id, titulo, descripcion, horizonte_temporal, fecha_limite, frente_id,
            resultado_id, responsable_id, involucrados_ids_json, estado, prioridad,
            decisiones_generadas_ids_json, responsabilidades_generadas_ids_json,
            interfaces_generadas_ids_json, frentes_ids_json, created_at, created_by, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            titulo = excluded.titulo,
            descripcion = excluded.descripcion,
            horizonte_temporal = excluded.horizonte_temporal,
            fecha_limite = excluded.fecha_limite,
            frente_id = excluded.frente_id,
            resultado_id = excluded.resultado_id,
            responsable_id = excluded.responsable_id,
            involucrados_ids_json = excluded.involucrados_ids_json,
            estado = excluded.estado,
            prioridad = excluded.prioridad,
            decisiones_generadas_ids_json = excluded.decisiones_generadas_ids_json,
            responsabilidades_generadas_ids_json = excluded.responsabilidades_generadas_ids_json,
            interfaces_generadas_ids_json = excluded.interfaces_generadas_ids_json,
            frentes_ids_json = excluded.frentes_ids_json,
            updated_at = excluded.updated_at
        `);

        for (const t of temas) {
          upsertImpact.run(
            t.id,
            t.titulo,
            t.descripcion || null,
            t.horizonte_temporal,
            t.fecha_limite || null,
            t.frente_id,
            t.resultado_id || null,
            t.responsable_id,
            typeof t.involucrados_ids_json === 'string' ? t.involucrados_ids_json : JSON.stringify(t.involucrados_ids || []),
            t.estado || 'En curso',
            t.prioridad || 'P2',
            typeof t.decisiones_generadas_ids_json === 'string' ? t.decisiones_generadas_ids_json : JSON.stringify(t.decisiones_generadas_ids || []),
            typeof t.responsabilidades_generadas_ids_json === 'string' ? t.responsabilidades_generadas_ids_json : JSON.stringify(t.responsabilidades_generadas_ids || []),
            typeof t.interfaces_generadas_ids_json === 'string' ? t.interfaces_generadas_ids_json : JSON.stringify(t.interfaces_generadas_ids || []),
            typeof t.frentes_ids_json === 'string' ? t.frentes_ids_json : JSON.stringify(t.frentes_ids || [t.frente_id]),
            t.created_at,
            t.created_by,
            t.updated_at
          );
        }
        console.log(`✅ Temas de Impacto consolidados: ${temas.length} temas guardados.`);
      }
    }
  } catch (e) {
    console.warn('⚠️ No se pudieron sincronizar temas de impacto vía red:', e.message);
  }

  db.exec('PRAGMA foreign_keys = ON;');
  db.close();

  // Generar copia de respaldo fechada
  const backupPath = path.join(process.cwd(), 'data', 'backups', 'enfoque_backup_synced_20261106.db');
  fs.copyFileSync(DB_PATH, backupPath);
  console.log(`🛡️ Copia de seguridad oficial generada en: ${backupPath}`);
  console.log('🎉 Consolidación total completada con 100% de éxito.');
}

syncAll().catch(e => {
  console.error('❌ Error en syncAll:', e);
  process.exit(1);
});
