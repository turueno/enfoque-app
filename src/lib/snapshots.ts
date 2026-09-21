import { getDb, queryAll, queryOne, logAudit } from './db';
import { getDashboardStats, getAllFrentes, getStructuralAlerts } from './queries';
import { Frente } from './types';

export interface DashboardSnapshotRow {
  id: string;
  created_at: string;
  created_by: string;
  usuario_id: string | null;
  titulo: string;
  notas: string | null;
  stats_json: string;
  frentes_json: string;
  alerts_count: number;
  por_validar_total: number;
  requiere_decision: number;
  requiere_coordinacion: number;
  en_riesgo: number;
  sin_owner_claro: number;
}

export interface DashboardSnapshotParsed extends DashboardSnapshotRow {
  stats: ReturnType<typeof getDashboardStats>;
  frentes: (Frente & {
    owner_nombre: string | null;
    responsabilidades_count: number;
    decisiones_count: number;
    interfaces_count: number;
    resultado_principal: string | null;
    alert_count: number;
  })[];
}

export function getAllDashboardSnapshots(): DashboardSnapshotParsed[] {
  const rows = queryAll<DashboardSnapshotRow>(
    'SELECT * FROM dashboard_snapshots ORDER BY created_at DESC'
  );
  return rows.map((r) => {
    let stats: any = {};
    let frentes: any[] = [];
    try {
      stats = JSON.parse(r.stats_json);
    } catch (e) {}
    try {
      frentes = JSON.parse(r.frentes_json);
    } catch (e) {}
    return {
      ...r,
      stats,
      frentes
    };
  });
}

export function getDashboardSnapshotById(id: string): DashboardSnapshotParsed | null {
  const row = queryOne<DashboardSnapshotRow>(
    'SELECT * FROM dashboard_snapshots WHERE id = ?',
    id
  );
  if (!row) return null;
  let stats: any = {};
  let frentes: any[] = [];
  try {
    stats = JSON.parse(row.stats_json);
  } catch (e) {}
  try {
    frentes = JSON.parse(row.frentes_json);
  } catch (e) {}
  return {
    ...row,
    stats,
    frentes
  };
}

export function createDashboardSnapshot(
  titulo: string,
  notas: string | null,
  createdByName: string,
  usuarioId: string | null
): DashboardSnapshotParsed {
  const db = getDb();
  const now = new Date().toISOString();
  const id = `SNAP-${Date.now()}`;

  const stats = getDashboardStats();
  const frentes = getAllFrentes();
  const alerts = getStructuralAlerts();

  const statsJson = JSON.stringify(stats);
  const frentesJson = JSON.stringify(frentes);

  const stmt = db.prepare(`
    INSERT INTO dashboard_snapshots (
      id, created_at, created_by, usuario_id, titulo, notas,
      stats_json, frentes_json, alerts_count,
      por_validar_total, requiere_decision, requiere_coordinacion,
      en_riesgo, sin_owner_claro
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    now,
    createdByName,
    usuarioId,
    titulo,
    notas || null,
    statsJson,
    frentesJson,
    alerts.length,
    stats.porValidarTotal,
    stats.requiereDecision,
    stats.requiereCoordinacion,
    stats.enRiesgo,
    stats.sinOwnerClaro
  );

  logAudit(
    createdByName,
    'dashboard_snapshot',
    id,
    'creacion',
    null,
    titulo,
    `Captura de corte de gobernanza: ${titulo} (${stats.porValidarTotal} por validar, ${stats.requiereDecision} decisiones pendientes)`
  );

  return {
    id,
    created_at: now,
    created_by: createdByName,
    usuario_id: usuarioId,
    titulo,
    notas: notas || null,
    stats_json: statsJson,
    frentes_json: frentesJson,
    alerts_count: alerts.length,
    por_validar_total: stats.porValidarTotal,
    requiere_decision: stats.requiereDecision,
    requiere_coordinacion: stats.requiereCoordinacion,
    en_riesgo: stats.enRiesgo,
    sin_owner_claro: stats.sinOwnerClaro,
    stats,
    frentes
  };
}

export function deleteDashboardSnapshot(id: string, usuario: string): boolean {
  const db = getDb();
  const current = queryOne<DashboardSnapshotRow>(
    'SELECT * FROM dashboard_snapshots WHERE id = ?',
    id
  );
  if (!current) return false;

  db.prepare('DELETE FROM dashboard_snapshots WHERE id = ?').run(id);

  logAudit(
    usuario,
    'dashboard_snapshot',
    id,
    'eliminacion',
    current.titulo,
    null,
    `Eliminación del corte histórico: ${current.titulo}`
  );

  return true;
}
